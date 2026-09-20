import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,dirname,resolve,basename} from 'node:path';
import {createCandidate,passwordHash} from '../server.mjs';import {openStore} from '../store.mjs';
const origin='http://127.0.0.1:4191';
test('controlled candidate: auth, isolation, persistence, operations and recovery',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'zero-v1-test-')),file=join(dir,'db.sqlite');let app=createCandidate({database:file,origin,fixtures:true});
 app.store.db.prepare('INSERT INTO settings VALUES(?,?)').run('admin-password',await passwordHash('Test-only-long-password-983!'));
 async function start(){await new Promise(r=>app.server.listen(4191,'127.0.0.1',r));return 'http://127.0.0.1:'+app.server.address().port;}let base=await start();
 const client=()=>({cookie:'',csrf:''});const a=client(),b=client(),owner=client(),anon=client();
 async function request(c,path,body,extra={}){const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Host:'127.0.0.1:4191',Origin:origin,Cookie:c.cookie,'Content-Type':'application/json','X-CSRF-Token':c.csrf,...extra},body:body===undefined?undefined:JSON.stringify(body)});const cookie=r.headers.get('set-cookie');if(cookie)c.cookie=cookie.split(';')[0];const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:r.status,data,headers:r.headers};}
 try{
  for(const c of [a,b])c.csrf=(await request(c,'/api/session')).data.csrf;
  assert.notEqual(a.cookie,b.cookie);assert.equal((await request(anon,'/api/manage')).status,401);
  assert.equal((await request(anon,'/private/candidate.sqlite')).status,404);assert.equal((await request(anon,'/server.mjs')).status,404);
  assert.equal((await request(a,'/api/manage/content',{})).status,403);
  assert.equal((await request(a,'/api/quote',{}, {Origin:'https://evil.example'})).status,403);
  assert.equal((await request(a,'/api/quote',{}, {'X-CSRF-Token':'wrong'})).status,403);
  
  const catalog=(await request(a,'/api/catalog')).data;
  assert.ok(!JSON.stringify(catalog).includes('ownerHash'));assert.ok(!JSON.stringify(catalog).includes('bookings'));
  for(const [id,tier,amount] of [['corolla-cross','mid',1800],['lexus-nx','large',2100],['porsche-cayenne','special',2500],['tesla-model-y','large',2100],['toyota-alphard','business',3000]]){const q=(await request(a,'/api/quote',{vehicleId:id,serviceId:'wash'})).data;assert.equal(q.tier,tier);assert.equal(q.amount,amount);}
  const payload={slotId:catalog.slots[0].id,vehicleId:'tesla-model-y',serviceId:'wash'};
  const race=await Promise.all([request(a,'/api/bookings',payload),request(b,'/api/bookings',payload)]);assert.equal(race.filter(x=>x.status===201).length,1);
  const creator=race[0].status===201?a:b,other=creator===a?b:a,booking=race.find(x=>x.status===201).data;assert.ok(!booking.ownerHash);
  assert.equal((await request(other,'/api/bookings/'+booking.id)).status,404);assert.deepEqual((await request(other,'/api/bookings/current')).data,[]);
  assert.equal((await request(other,'/api/bookings/'+booking.id+'/cancel',{})).status,404);
  assert.equal((await request(creator,'/api/bookings/'+booking.id+'/confirm',{})).status,403);
  const login=await request(owner,'/api/admin/login',{password:'Test-only-long-password-983!'});assert.equal(login.status,200);owner.csrf=login.data.csrf;assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  assert.equal((await request(owner,'/api/manage',undefined)).status,200);
  assert.equal((await request(owner,'/api/manage/bookings/'+booking.id+'/confirm',{})).data.status,'CONFIRMED');
  assert.equal((await request(owner,'/api/manage/slot',{id:booking.slotId,open:false})).status,409);
  const changed=await request(creator,'/api/bookings/'+booking.id+'/change',{slotId:catalog.slots[1].id});assert.equal(changed.data.status,'PENDING');
  const v=catalog.vehicles[0];assert.equal((await request(owner,'/api/manage/vehicle',{...v,override:'special',enabled:true})).status,200);assert.equal((await request(a,'/api/quote',{vehicleId:v.id,serviceId:'wash'})).data.amount,2500);
  const service=catalog.services[0];service.prices.large=2200;assert.equal((await request(owner,'/api/manage/service',service)).status,200);assert.equal((await request(creator,'/api/bookings/'+booking.id)).data.quote.amount,2100);
  let management=(await request(owner,'/api/manage')).data;const content=management.content;content.featured.enabled=false;content.cases.push({id:'third',title:'第三案例',url:'https://www.instagram.com/p/DIyYGx8S_6j/',enabled:true});content.cases.reverse();
  assert.equal((await request(owner,'/api/manage/content',{revision:management.revision,content})).status,200);assert.equal((await request(owner,'/api/manage/content',{revision:management.revision,content})).status,409);
  management=(await request(owner,'/api/manage')).data;content.featured.url='javascript:alert(1)';assert.equal((await request(owner,'/api/manage/content',{revision:management.revision,content})).status,400);
  const publicContent=(await request(a,'/api/catalog')).data.content;assert.equal(publicContent.cases.length,3);assert.equal(publicContent.cases[0].id,'third');assert.equal(publicContent.featured.enabled,false);
  const backup=join(dir,'backup.sqlite');await app.store.backup(backup);const recovered=openStore(backup);assert.equal(recovered.db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(recovered.read().bookings[0].status,'PENDING');recovered.close();
  await new Promise(r=>app.server.close(r));app=createCandidate({database:file,origin});base=await start();assert.equal((await request(creator,'/api/bookings/'+booking.id)).data.status,'PENDING');assert.equal((await request(owner,'/api/manage')).status,200);
  assert.equal((await request(creator,'/api/bookings/'+booking.id+'/cancel',{})).data.status,'CANCELLED');assert.equal((await request(creator,'/api/bookings/'+booking.id+'/change',{slotId:catalog.slots[2].id})).status,409);
  assert.equal((await request(owner,'/api/admin/logout',{})).status,200);assert.equal((await request(owner,'/api/manage')).status,401);
  for(let i=0;i<7;i++)await request(anon,'/api/admin/login',{password:'wrong'});assert.equal((await request(anon,'/api/admin/login',{password:'wrong'})).status,429);
 }finally{if(app.server.listening)await new Promise(r=>app.server.close(r));assert.equal(dirname(resolve(dir)),resolve(tmpdir()));assert.ok(basename(dir).startsWith('zero-v1-test-'));await rm(dir,{recursive:true,force:true});}
});
