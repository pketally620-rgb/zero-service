import {productionText} from './launch-mode.mjs';
import {isIP} from 'node:net';
import {requestBooking} from './booking-entry.mjs';
import {saveService,serviceEnabled} from './service-management.mjs';
import {saveVehicle,vehicleEnabled} from './vehicle-management.mjs';
import {saveDailySlots} from './slot-management.mjs';
import http from 'node:http';
import {retain,pendingReviewAt} from './policy.mjs';
import {readFile} from 'node:fs/promises';
import {randomBytes,createHash,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {openStore,bookingStore,saveBookings} from './store.mjs';
import {priceFor,classifyVehicle,tierLabels} from './domain.mjs';
import {requireValue,text,validateContent} from './validation.mjs';
const scrypt=promisify(scryptCallback),hash=v=>createHash('sha256').update(v).digest('hex');
export async function passwordHash(password){const salt=randomBytes(16).toString('hex');return salt+':'+(await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024})).toString('hex');}
async function verify(password,encoded){const [salt,key]=encoded.split(':');const value=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return timingSafeEqual(value,Buffer.from(key,'hex'));}
const publicFiles={'/':'index.html','/index.html':'index.html','/app.mjs':'app.mjs','/ux.mjs':'ux.mjs','/style.css':'style.css','/admin':'admin.html','/admin.mjs':'admin.mjs','/slot-state.mjs':'slot-state.mjs','/admin.css':'admin.css','/review.html':'review.html','/review.mjs':'review.mjs','/review.css':'review.css'};
const publicBooking=({ownerHash,assisted,...b})=>b;
export function createCandidate({database,origin='http://127.0.0.1:4180',now=()=>Date.now(),fixtures=false,trustedLocalProxy=false}={}){
  const parsed=new URL(origin),production=origin==='https://zerocraft.tw';
  if(parsed.origin!==origin||(!production&&(!['http:','https:'].includes(parsed.protocol)||!['127.0.0.1','localhost'].includes(parsed.hostname))))throw Error('Unsupported origin');
  if(production!==trustedLocalProxy)throw Error('Canonical production requires explicit trusted local proxy');
  if(production&&fixtures)throw Error('Production cannot initialize fixtures');
  const store=openStore(database,{fixtures}),db=store.db;
  retain(store,now());const retentionTimer=setInterval(()=>{try{retain(store,now());}catch{console.error("Retention failed; Engineering review required.");}},3600000);retentionTimer.unref();
  const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
  function limit(key,max,ms){const t=now(),old=db.prepare('SELECT * FROM limits WHERE key=?').get(key);if(old&&old.until>t){if(old.count>=max)fail(429,'操作過於頻繁，請稍後再試。');db.prepare('UPDATE limits SET count=count+1 WHERE key=?').run(key);}else db.prepare('INSERT OR REPLACE INTO limits VALUES(?,1,?)').run(key,t+ms);db.prepare('DELETE FROM limits WHERE until<?').run(t);}
  function session(req,name,role){const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))return;const h=hash(token),s=db.prepare('SELECT * FROM sessions WHERE hash=? AND role=? AND expires>?').get(h,role,now());return s;}
  const cookie=(name,token,age)=>`${name}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${parsed.protocol==='https:'?'; Secure':''}`;
  function issue(res,role){const token=randomBytes(32).toString('hex'),csrf=randomBytes(32).toString('hex'),age=role==='admin'?1800:2592000;const h=hash(token);db.prepare('DELETE FROM sessions WHERE expires<=?').run(now());db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(h,role,csrf,now()+age*1000);res.setHeader('Set-Cookie',cookie(role==='admin'?'zero_admin':'zero_customer',token,age));return {hash:h,csrf,role};}
  const server=http.createServer(async(req,res)=>{
    for(const [k,v] of Object.entries({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'SAMEORIGIN','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'; object-src 'none'"}))res.setHeader(k,v);
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
    try{
      let clientIP=req.socket.remoteAddress;
      if(production){
        const forwarded=req.headers['x-forwarded-for'];
        if(req.socket.remoteAddress!=='127.0.0.1'||req.headers.forwarded!==undefined||req.headers['x-forwarded-host']!==parsed.host||req.headers['x-forwarded-proto']!=='https'||typeof forwarded!=='string'||!isIP(forwarded))fail(403,'無法接受此代理連線。');
        clientIP=forwarded;
      }
      if(req.headers.host!==parsed.host)fail(403,'無法接受此連線。');
      if(!['GET','POST'].includes(req.method))fail(405,'不支援此操作。');
      const path=new URL(req.url,origin).pathname;
      let customer=session(req,'zero_customer','customer'),admin=session(req,'zero_admin','admin'),body={};
      const owner=()=>{if(!admin)fail(401,'請先登入管理中心。');};
      if(req.method==='POST'){
        if(req.headers.origin!==origin)fail(403,'請從本站操作。');
        if(req.headers['content-type']!=='application/json')fail(415,'無法接受此資料格式。');
        const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>32768)fail(413,'資料超過長度限制。');chunks.push(c);}
        try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{fail(400,'資料格式不正確。');}
        requireValue(body&&typeof body==='object'&&!Array.isArray(body));
        if(path!=='/api/admin/login'){
          const s=path.startsWith('/api/manage')||path==='/api/admin/logout'?admin:customer;
          if(!s||req.headers['x-csrf-token']!==s.csrf)fail(403,'操作驗證已失效，請重新載入。');
        }
      }
      if(req.method==='GET'&&path==='/api/session'){if(!customer)customer=issue(res,'customer');return send(200,{csrf:customer.csrf});}
      if(req.method==='GET'&&path==='/api/admin/session'){owner();return send(200,{csrf:admin.csrf});}
      if(req.method==='POST'&&path==='/api/admin/login'){
        limit('login:'+clientIP,8,900000);requireValue(typeof body.password==='string'&&body.password.length<=256);
        const saved=db.prepare("SELECT value FROM settings WHERE key='admin-password'").get();
        if(!saved)fail(503,'管理帳號尚未設定。');
        if(!await verify(body.password,saved.value))fail(401,'登入資料不正確。');
        if(admin)db.prepare('DELETE FROM sessions WHERE hash=?').run(admin.hash);
        const next=issue(res,'admin');return send(200,{csrf:next.csrf});
      }
      if(req.method==='POST'&&path==='/api/admin/logout'){owner();db.prepare('DELETE FROM sessions WHERE hash=?').run(admin.hash);res.setHeader('Set-Cookie',cookie('zero_admin','',0));return send(200,{ok:true});}
      if(req.method==='GET'&&path==='/api/catalog'){
        const s=store.read(),taipei=new Date(now()).toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'});
        return send(200,{vehicles:s.vehicles.filter(vehicleEnabled),services:s.services.filter(serviceEnabled),tierLabels,content:{...s.content,cases:s.content.cases.filter(x=>x.enabled).slice(0,5)},slots:s.slots.filter(x=>x.date>=taipei&&x.status==='OPEN').map(({bookingId,...x})=>x)});
      }
      if(req.method==='POST'&&['/api/quote','/api/manage/quote'].includes(path)){if(path.startsWith('/api/manage/'))owner();const s=store.read(),v=s.vehicles.find(x=>x.id===body.vehicleId),service=s.services.find(x=>x.id===body.serviceId);requireValue(v&&vehicleEnabled(v)&&service&&serviceEnabled(service),'此車款或服務目前未開放，請重新選擇。');return send(200,{...priceFor(service,v),autoTier:classifyVehicle(v,false),note:service.note});}
      if(req.method==='GET'&&path==='/api/bookings/current'){if(!customer)fail(401,'請重新載入頁面。');return send(200,store.read().bookings.filter(x=>x.ownerHash===customer.hash).map(publicBooking));}
      if(req.method==='GET'&&/^\/api\/bookings\/[^/]+$/.test(path)){const b=store.read().bookings.find(x=>x.id===path.split('/').pop());if(!customer||!b||b.ownerHash!==customer.hash)fail(404,'找不到此預約。');return send(200,publicBooking(b));}
      if(req.method==='POST'&&path==='/api/bookings'){
        limit('request:'+clientIP,20,3600000);
        const b=store.mutate(s=>{requireValue(!s.bookings.some(x=>x.ownerHash===customer.hash&&x.status!=='CANCELLED'&&!x.endedAt),'已有處理中的需求，請先更改或撤回。');const b=requestBooking(s,{vehicleId:body.vehicleId,serviceId:body.serviceId,slotId:body.slotId,ownerHash:customer.hash},now());return publicBooking(b);});return send(201,b);
      }
      if(req.method==='POST'&&/^\/api\/(manage\/)?bookings\/[^/]+\/(confirm|change|cancel)$/.test(path)){
        const management=path.startsWith('/api/manage/');if(management)owner();const parts=path.split('/'),action=parts.pop(),id=parts.pop();
        if(action==='confirm'&&!management)fail(403,'預約需由 ZERO 人員確認。');
        const b=store.mutate(s=>{const bs=bookingStore(s),b=bs.bookings.get(id);if(!b||(!management&&b.ownerHash!==customer.hash))fail(404,'找不到此預約。');requireValue(!b.endedAt,'此筆服務已結束。');if(action==='change'){const slot=s.slots.find(x=>x.id===body.slotId);requireValue(slot&&Date.parse(slot.date+'T'+slot.time+':00+08:00')>now(),'請選擇未來時段。');}const next=action==='change'?bs.change(id,body.slotId):bs[action](id);next.updatedAt=new Date(now()).toISOString();if(action==='cancel')next.cancelledAt=next.updatedAt;if(action==='change'){next.pendingSince=next.updatedAt;const slot=s.slots.find(x=>x.id===next.slotId);next.slotDate=slot.date;next.slotTime=slot.time;}saveBookings(s,bs);return publicBooking(next);},management?'booking:'+action+':'+id:undefined);return send(200,b);
      }
      if(req.method==='POST'&&/^\/api\/manage\/bookings\/[^/]+\/end$/.test(path)){
        owner();store.mutate(s=>{const b=s.bookings.find(x=>x.id===path.split('/')[4]);requireValue(b&&b.status==='CONFIRMED'&&!b.endedAt,'僅能記錄已確認預約的實際結束。');const slot=s.slots.find(x=>x.id===b.slotId);requireValue(slot&&Date.parse(slot.date+'T'+slot.time+':00+08:00')<=now(),'尚未到預約時間。');b.endedAt=new Date(now()).toISOString();},'booking:end');return send(200,{ok:true});
      }
      if(req.method==='POST'&&path==='/api/manage/bookings'){
        owner();requireValue(['line','phone','onsite'].includes(body.channel)&&text(body.reference,80),'請選擇來源並填寫辨識稱呼。');
        const b=store.mutate(s=>requestBooking(s,{vehicleId:body.vehicleId,serviceId:body.serviceId,slotId:body.slotId,ownerHash:'assisted:'+randomBytes(32).toString('hex'),assisted:{channel:body.channel,reference:body.reference.trim()}},now()),'booking:assisted:create');return send(201,publicBooking(b));
      }
      if(req.method==='GET'&&path==='/api/manage'){owner();const s=store.read();return send(200,{...s,bookings:s.bookings.map(b=>({...publicBooking(b),...(b.assisted?{assisted:b.assisted}:{}),pendingReviewAt:b.status==='PENDING'?pendingReviewAt(b.pendingSince||b.createdAt):null})),audit:db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 30').all()});}
      if(req.method==='POST'&&path==='/api/manage/content'){owner();const c=validateContent(body.content);const saved=store.mutate(s=>{if(body.revision!==s.revision)fail(409,'資料已更新，請重新載入再儲存。');s.content=c;return {content:structuredClone(s.content),revision:s.revision+1};},'content:update');return send(200,{ok:true,...saved});}
      if(req.method==='POST'&&path==='/api/manage/service'){
        owner();const service=store.mutate(s=>{if(body.revision!==undefined&&body.revision!==s.revision)fail(409,'資料已更新，請重新載入再儲存。');return saveService(s,body);},body.id?'service:update:'+body.id:'service:create');return send(body.id?200:201,{ok:true,service});
      }
      if(req.method==='POST'&&path==='/api/manage/vehicle'){
        owner();const vehicle=store.mutate(s=>saveVehicle(s,body),body.id?'vehicle:update:'+body.id:'vehicle:create');return send(body.id?200:201,{ok:true,vehicle});
      }
      if(req.method==='POST'&&path==='/api/manage/slots/day'){
        owner();const result=store.mutate(s=>{if(body.revision!==s.revision)fail(409,'資料已更新，已保留正式狀態；請重新確認後再儲存。');return saveDailySlots(s,body,now());},'slots:day:'+body.date);return send(200,{ok:true,...result});
      }
      if(req.method==='POST'&&path==='/api/manage/slot'){
        owner();store.mutate(s=>{requireValue(typeof body.open==='boolean');const existing=s.slots.find(x=>x.id===body.id);if(existing){bookingStore(s).setSlotOpen(body.id,body.open);}else{requireValue(/^\d{4}-\d{2}-\d{2}$/.test(body.date)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time));const t=Date.parse(body.date+'T'+body.time+':00+08:00');requireValue(Number.isFinite(t)&&t>now()&&t<now()+366*86400000,'請選擇一年內的未來時間。');requireValue(!s.slots.some(x=>x.date===body.date&&x.time===body.time),'此時段已存在。');s.slots.push({id:body.date+'-'+body.time,date:body.date,time:body.time,status:body.open?'OPEN':'CLOSED',bookingId:null});s.slots.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));}},'slot:update');return send(200,{ok:true});
      }
      if(req.method==='GET'&&Object.hasOwn(publicFiles,path)){const name=publicFiles[path],content=await readFile(new URL('public/'+name,import.meta.url));res.writeHead(200,{'Content-Type':name.endsWith('.mjs')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8'});return res.end(production?productionText(name,content.toString('utf8')):content);}
      if(req.method==='GET'&&['/assets/approved-hero.jpg','/assets/approved-craft.jpg'].includes(path)){res.writeHead(200,{'Content-Type':'image/jpeg'});return res.end(await readFile(new URL('../proof'+path,import.meta.url)));}
      fail(404,'找不到此頁面。');
    }catch(e){send(e.status||409,{error:e.status?e.message:'目前無法完成操作，請重新整理後再試。'});}
  });
  if(production){const listen=server.listen.bind(server);server.listen=(port,host,callback)=>{
    if(!Number.isInteger(port)||port<1||port>65535||host!=='127.0.0.1')throw Error('Production upstream must bind explicitly to IPv4 loopback');
    return listen(port,host,callback);
  };}
  server.requestTimeout=15000;server.headersTimeout=10000;server.on('close',()=>{clearInterval(retentionTimer);store.close();});return {server,store};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const database=fileURLToPath(new URL('private/candidate.sqlite',import.meta.url));
  const {server}=createCandidate({database});server.listen(4180,'127.0.0.1',()=>console.log('ZERO controlled candidate: http://127.0.0.1:4180'));
}
