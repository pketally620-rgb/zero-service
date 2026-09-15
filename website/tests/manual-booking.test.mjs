import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createCandidate,passwordHash} from '../server.mjs';import {openStore} from '../store.mjs';
test('manual and guided entry share one transactional board, snapshots, states and private boundaries',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'zero-r45-')),database=join(dir,'db.sqlite'),origin='http://127.0.0.1:4201',app=createCandidate({database,origin,fixtures:true});
 app.store.db.prepare('INSERT INTO settings VALUES(?,?)').run('admin-password',await passwordHash('Synthetic-R45-Only!'));await new Promise(r=>app.server.listen(4201,'127.0.0.1',r));const admin={},customer={},stranger={};let saved;
 async function req(c,path,body,extra={}){const r=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:c.cookie||'','X-CSRF-Token':c.csrf||'',...extra},body:body===undefined?undefined:JSON.stringify(body)});if(r.headers.get('set-cookie'))c.cookie=r.headers.get('set-cookie').split(';')[0];return{status:r.status,data:await r.json()};}
 try{
  for(const c of [customer,stranger])c.csrf=(await req(c,'/api/session')).data.csrf;
  admin.csrf=(await req(admin,'/api/admin/login',{password:'Synthetic-R45-Only!'})).data.csrf;
  const cat=(await req(customer,'/api/catalog')).data,slots=cat.slots,vehicleId=cat.vehicles[0].id,input={channel:'line',reference:'合成 LINE 客人',vehicleId,serviceId:'wash',slotId:slots[0].id};
  assert.equal((await req(customer,'/api/manage/bookings',input)).status,403);assert.equal((await req(admin,'/api/manage/bookings',input,{'X-CSRF-Token':'bad'})).status,403);assert.equal((await req(admin,'/api/manage/bookings',input,{Origin:'https://wrong.example'})).status,403);
  assert.equal((await req(admin,'/api/manage/bookings',{...input,reference:''})).status,400);assert.equal((await req(admin,'/api/manage/bookings',{...input,channel:'other'})).status,400);
  assert.equal((await req(admin,'/api/manage/bookings',{...input,vehicleId:'unknown'})).status,400);
  await req(admin,'/api/manage/slot',{id:slots[1].id,open:false});assert.equal((await req(admin,'/api/manage/bookings',{...input,slotId:slots[1].id})).status,400);
  app.store.mutate(s=>s.slots.push({id:'past',date:'2000-01-01',time:'10:00',status:'OPEN',bookingId:null}));assert.equal((await req(admin,'/api/manage/bookings',{...input,slotId:'past'})).status,400);
  const price=(await req(admin,'/api/manage/quote',{vehicleId,serviceId:'wash'})).data;assert.equal(price.amount,1800);
  const manual=await req(admin,'/api/manage/bookings',input);assert.equal(manual.status,201);assert.equal(manual.data.status,'PENDING');assert.equal(manual.data.assisted,undefined);
  assert.ok(!(await req(customer,'/api/catalog')).data.slots.some(s=>s.id===input.slotId));assert.equal((await req(customer,'/api/bookings',input)).status,400);assert.equal((await req(admin,'/api/manage/bookings',input)).status,400);
  for(const c of [{},customer,stranger])assert.equal((await req(c,'/api/bookings/'+manual.data.id)).status,404);
  assert.deepEqual((await req(customer,'/api/bookings/current')).data,[]);assert.equal((await req(customer,'/api/bookings/'+manual.data.id+'/cancel',{})).status,404);
  const board=(await req(admin,'/api/manage')).data,stored=board.bookings.find(b=>b.id===manual.data.id);assert.equal(stored.assisted.reference,input.reference);assert.deepEqual(stored.quote,manual.data.quote);
  const svc=cat.services.find(s=>s.id==='wash');await req(admin,'/api/manage/service',{...svc,name:'改名',mode:'fixed',fixedPrice:9999,enabled:false});
  assert.equal((await req(admin,'/api/manage/bookings',{...input,slotId:slots[2].id})).status,400);
  assert.equal((await req(admin,'/api/manage/bookings/'+stored.id+'/confirm',{})).status,200);assert.equal((await req(admin,'/api/manage/bookings/'+stored.id+'/change',{slotId:slots[2].id})).data.status,'PENDING');
  assert.equal((await req(admin,'/api/manage/bookings/'+stored.id+'/confirm',{})).status,200);const after=(await req(admin,'/api/manage')).data.bookings.find(b=>b.id===stored.id);assert.equal(after.serviceName,stored.serviceName);assert.deepEqual(after.quote,stored.quote);
  assert.equal((await req(admin,'/api/manage/bookings/'+stored.id+'/cancel',{})).status,200);assert.ok((await req(customer,'/api/catalog')).data.slots.some(s=>s.id===slots[2].id));
  await req(admin,'/api/manage/service',{...svc,enabled:true});
  const raceInput={...input,slotId:slots[3].id};const race=await Promise.all([req(admin,'/api/manage/bookings',raceInput),req(customer,'/api/bookings',raceInput)]);assert.equal(race.filter(r=>r.status===201).length,1);
  const winner=race.find(r=>r.status===201).data;assert.equal((await req(admin,'/api/manage/bookings/'+winner.id+'/confirm',{})).status,200);
  for(const [i,channel,serviceId] of [[4,'phone','paint-coating'],[5,'onsite','correction']])assert.equal((await req(admin,'/api/manage/bookings',{...input,channel,serviceId,slotId:slots[i].id})).status,201);
  saved=app.store.read();assert.equal(saved.bookings.filter(b=>b.slotId===slots[3].id&&b.status==='CONFIRMED').length,1);assert.equal(saved.bookings.find(b=>b.assisted?.channel==='phone').quote.amount,16500);assert.equal(saved.bookings.find(b=>b.assisted?.channel==='onsite').quote.type,'assessment');
 }finally{await new Promise(r=>app.server.close(r));}
 const db=openStore(database);try{assert.deepEqual(db.read(),saved);}finally{db.close();rmSync(dir,{recursive:true});}
});
