import http from 'node:http';
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
const publicFiles={'/':'index.html','/index.html':'index.html','/app.mjs':'app.mjs','/ux.mjs':'ux.mjs','/style.css':'style.css','/admin':'admin.html','/admin.mjs':'admin.mjs','/admin.css':'admin.css','/review.html':'review.html','/review.mjs':'review.mjs','/review.css':'review.css'};
const publicBooking=({ownerHash,...b})=>b;
export function createCandidate({database,origin='http://127.0.0.1:4180',now=()=>Date.now()}={}){
  const parsed=new URL(origin);if(!['http:','https:'].includes(parsed.protocol)||!['127.0.0.1','localhost'].includes(parsed.hostname))throw Error('Candidate is restricted to loopback');
  const store=openStore(database),db=store.db;
  const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
  function limit(key,max,ms){const t=now(),old=db.prepare('SELECT * FROM limits WHERE key=?').get(key);if(old&&old.until>t){if(old.count>=max)fail(429,'操作過於頻繁，請稍後再試。');db.prepare('UPDATE limits SET count=count+1 WHERE key=?').run(key);}else db.prepare('INSERT OR REPLACE INTO limits VALUES(?,1,?)').run(key,t+ms);db.prepare('DELETE FROM limits WHERE until<?').run(t);}
  function session(req,name,role){const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))return;const h=hash(token),s=db.prepare('SELECT * FROM sessions WHERE hash=? AND role=? AND expires>?').get(h,role,now());return s;}
  const cookie=(name,token,age)=>`${name}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${parsed.protocol==='https:'?'; Secure':''}`;
  function issue(res,role){const token=randomBytes(32).toString('hex'),csrf=randomBytes(32).toString('hex'),age=role==='admin'?1800:2592000;const h=hash(token);db.prepare('DELETE FROM sessions WHERE expires<=?').run(now());db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(h,role,csrf,now()+age*1000);res.setHeader('Set-Cookie',cookie(role==='admin'?'zero_admin':'zero_customer',token,age));return {hash:h,csrf,role};}
  const server=http.createServer(async(req,res)=>{
    for(const [k,v] of Object.entries({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'SAMEORIGIN','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'; object-src 'none'"}))res.setHeader(k,v);
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
    try{
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
        limit('login:'+req.socket.remoteAddress,8,900000);requireValue(typeof body.password==='string'&&body.password.length<=256);
        const saved=db.prepare("SELECT value FROM settings WHERE key='admin-password'").get();
        if(!saved)fail(503,'管理帳號尚未設定。');
        if(!await verify(body.password,saved.value))fail(401,'登入資料不正確。');
        if(admin)db.prepare('DELETE FROM sessions WHERE hash=?').run(admin.hash);
        const next=issue(res,'admin');return send(200,{csrf:next.csrf});
      }
      if(req.method==='POST'&&path==='/api/admin/logout'){owner();db.prepare('DELETE FROM sessions WHERE hash=?').run(admin.hash);res.setHeader('Set-Cookie',cookie('zero_admin','',0));return send(200,{ok:true});}
      if(req.method==='GET'&&path==='/api/catalog'){
        const s=store.read(),taipei=new Date(now()).toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'});
        return send(200,{vehicles:s.vehicles,services:s.services,tierLabels,content:{...s.content,cases:s.content.cases.filter(x=>x.enabled).slice(0,2)},slots:s.slots.filter(x=>x.date>=taipei).map(({bookingId,...x})=>x)});
      }
      if(req.method==='POST'&&path==='/api/quote'){const s=store.read(),v=s.vehicles.find(x=>x.id===body.vehicleId),service=s.services.find(x=>x.id===body.serviceId);requireValue(v&&service);return send(200,{...priceFor(service,v),autoTier:classifyVehicle(v,false),note:service.note});}
      if(req.method==='GET'&&path==='/api/bookings/current'){if(!customer)fail(401,'請重新載入頁面。');return send(200,store.read().bookings.filter(x=>x.ownerHash===customer.hash).map(publicBooking));}
      if(req.method==='GET'&&/^\/api\/bookings\/[^/]+$/.test(path)){const b=store.read().bookings.find(x=>x.id===path.split('/').pop());if(!customer||!b||b.ownerHash!==customer.hash)fail(404,'找不到此預約。');return send(200,publicBooking(b));}
      if(req.method==='POST'&&path==='/api/bookings'){
        limit('request:'+req.socket.remoteAddress,20,3600000);
        const b=store.mutate(s=>{requireValue(!s.bookings.some(x=>x.ownerHash===customer.hash&&x.status!=='CANCELLED'),'已有處理中的需求，請先更改或撤回。');const v=s.vehicles.find(x=>x.id===body.vehicleId),service=s.services.find(x=>x.id===body.serviceId);requireValue(v&&service);const slot=s.slots.find(x=>x.id===body.slotId);requireValue(slot&&Date.parse(slot.date+'T'+slot.time+':00+08:00')>now(),'請選擇未來的開放時段。');const bs=bookingStore(s),b=bs.request(body.slotId,{slotDate:slot.date,slotTime:slot.time,ownerHash:customer.hash,vehicleName:v.brand+' '+v.model,serviceName:service.name,quote:priceFor(service,v),createdAt:new Date(now()).toISOString()});saveBookings(s,bs);return publicBooking(b);});return send(201,b);
      }
      if(req.method==='POST'&&/^\/api\/(manage\/)?bookings\/[^/]+\/(confirm|change|cancel)$/.test(path)){
        const management=path.startsWith('/api/manage/');if(management)owner();const parts=path.split('/'),action=parts.pop(),id=parts.pop();
        if(action==='confirm'&&!management)fail(403,'預約需由 ZERO 人員確認。');
        const b=store.mutate(s=>{const bs=bookingStore(s),b=bs.bookings.get(id);if(!b||(!management&&b.ownerHash!==customer.hash))fail(404,'找不到此預約。');if(action==='change'){const slot=s.slots.find(x=>x.id===body.slotId);requireValue(slot&&Date.parse(slot.date+'T'+slot.time+':00+08:00')>now(),'請選擇未來時段。');}const next=action==='change'?bs.change(id,body.slotId):bs[action](id);saveBookings(s,bs);return publicBooking(next);},management?'booking:'+action+':'+id:undefined);return send(200,b);
      }
      if(req.method==='GET'&&path==='/api/manage'){owner();const s=store.read();return send(200,{...s,bookings:s.bookings.map(publicBooking),audit:db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 30').all()});}
      if(req.method==='POST'&&path==='/api/manage/content'){owner();const c=validateContent(body.content);store.mutate(s=>{if(body.revision!==s.revision)fail(409,'資料已更新，請重新載入再儲存。');s.content=c;},'content:update');return send(200,{ok:true});}
      if(req.method==='POST'&&path==='/api/manage/service'){
        owner();store.mutate(s=>{const v=s.services.find(x=>x.id===body.id);requireValue(v&&text(body.name,70)&&text(body.note,300));const price=n=>Number.isInteger(n)&&n>=1&&n<=1000000;
          if(v.mode==='tier'){requireValue(body.prices&&Object.keys(tierLabels).every(k=>price(body.prices[k])));v.prices=Object.fromEntries(Object.keys(tierLabels).map(k=>[k,body.prices[k]]));}if(v.mode==='fixed'){requireValue(price(body.fixedPrice));v.fixedPrice=body.fixedPrice;}v.name=body.name.trim();v.note=body.note.trim();},'service:update');return send(200,{ok:true});
      }
      if(req.method==='POST'&&path==='/api/manage/vehicle'){
        owner();store.mutate(s=>{const v=s.vehicles.find(x=>x.id===body.id);requireValue(v&&text(body.brand,50)&&text(body.model,60)&&Number.isInteger(body.lengthMm)&&body.lengthMm>=2000&&body.lengthMm<=8000&&['passenger','mpv','van'].includes(body.kind)&&(!body.override||Object.hasOwn(tierLabels,body.override)));Object.assign(v,{brand:body.brand.trim(),model:body.model.trim(),lengthMm:body.lengthMm,kind:body.kind,ownerOverrideTier:body.override||undefined});},'vehicle:update');return send(200,{ok:true});
      }
      if(req.method==='POST'&&path==='/api/manage/slot'){
        owner();store.mutate(s=>{requireValue(typeof body.open==='boolean');const existing=s.slots.find(x=>x.id===body.id);if(existing){bookingStore(s).setSlotOpen(body.id,body.open);}else{requireValue(/^\d{4}-\d{2}-\d{2}$/.test(body.date)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time));const t=Date.parse(body.date+'T'+body.time+':00+08:00');requireValue(Number.isFinite(t)&&t>now()&&t<now()+366*86400000,'請選擇一年內的未來時間。');requireValue(!s.slots.some(x=>x.date===body.date&&x.time===body.time),'此時段已存在。');s.slots.push({id:body.date+'-'+body.time,date:body.date,time:body.time,status:body.open?'OPEN':'CLOSED',bookingId:null});s.slots.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));}},'slot:update');return send(200,{ok:true});
      }
      if(req.method==='GET'&&Object.hasOwn(publicFiles,path)){const name=publicFiles[path],content=await readFile(new URL('public/'+name,import.meta.url));res.writeHead(200,{'Content-Type':name.endsWith('.mjs')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8'});return res.end(content);}
      if(req.method==='GET'&&['/assets/approved-hero.jpg','/assets/approved-craft.jpg'].includes(path)){res.writeHead(200,{'Content-Type':'image/jpeg'});return res.end(await readFile(new URL('../proof'+path,import.meta.url)));}
      fail(404,'找不到此頁面。');
    }catch(e){send(e.status||409,{error:e.status?e.message:'目前無法完成操作，請重新整理後再試。'});}
  });
  server.requestTimeout=15000;server.headersTimeout=10000;server.on('close',()=>store.close());return {server,store};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const database=fileURLToPath(new URL('private/candidate.sqlite',import.meta.url));
  const {server}=createCandidate({database});server.listen(4180,'127.0.0.1',()=>console.log('ZERO controlled candidate: http://127.0.0.1:4180'));
}

