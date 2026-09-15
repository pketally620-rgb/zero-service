import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createCandidate,passwordHash} from '../server.mjs';import {openStore} from '../store.mjs';
test('service lifecycle: authorization, modes, disabled stale requests, immutable booking and persistence',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'zero-r43-')),database=join(dir,'db.sqlite');const app=createCandidate({database,fixtures:true});
 app.store.db.prepare('INSERT INTO settings VALUES(?,?)').run('admin-password',await passwordHash('Synthetic-R43-Test-Only!'));
 await new Promise(r=>app.server.listen(4180,'127.0.0.1',r));const owner={},customer={},other={};
 async function req(c,path,body,extra={}){const r=await fetch('http://127.0.0.1:4180'+path,{method:body===undefined?'GET':'POST',headers:{Origin:'http://127.0.0.1:4180','Content-Type':'application/json',Cookie:c.cookie||'','X-CSRF-Token':c.csrf||'',...extra},body:body===undefined?undefined:JSON.stringify(body)});if(r.headers.get('set-cookie'))c.cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,data:await r.json()};}
 let saved;
 try{
  customer.csrf=(await req(customer,'/api/session')).data.csrf;other.csrf=(await req(other,'/api/session')).data.csrf;
  const form={name:'測試服務',note:'受控測試說明',mode:'tier',enabled:true,prices:{mid:1800,large:2100,special:2500,business:3000}};
  assert.equal((await req(customer,'/api/manage/service',form)).status,403);
  owner.csrf=(await req(owner,'/api/admin/login',{password:'Synthetic-R43-Test-Only!'})).data.csrf;
  assert.equal((await req(owner,'/api/manage/service',form,{'X-CSRF-Token':'invalid'})).status,403);
  assert.equal((await req(owner,'/api/manage/service',form,{Origin:'https://wrong.example'})).status,403);
  assert.equal((await req(owner,'/api/manage/service',{...form,prices:{mid:-1}})).status,400);
  const created=await req(owner,'/api/manage/service',form);assert.equal(created.status,201);const id=created.data.service.id;
  const catalog=(await req(customer,'/api/catalog')).data;const vehicleId=catalog.vehicles[0].id;
  assert.equal((await req(customer,'/api/quote',{vehicleId,serviceId:id})).data.amount,1800);
  const booked=await req(customer,'/api/bookings',{vehicleId,serviceId:id,slotId:catalog.slots[0].id});assert.equal(booked.status,201);const old=structuredClone(app.store.read().bookings[0]);
  const edit={id,name:'已修改服務',note:'新價格',mode:'fixed',fixedPrice:9999,enabled:false};assert.equal((await req(owner,'/api/manage/service',edit)).status,200);
  assert.deepEqual(app.store.read().bookings[0],old);
  assert.ok(!(await req(customer,'/api/catalog')).data.services.some(s=>s.id===id));
  assert.equal((await req(customer,'/api/quote',{vehicleId,serviceId:id})).status,400);
  assert.equal((await req(other,'/api/bookings',{vehicleId,serviceId:id,slotId:catalog.slots[1].id})).status,400);
  assert.equal((await req(owner,'/api/manage/bookings/'+old.id+'/confirm',{})).status,200);
  assert.equal((await req(customer,'/api/bookings/'+old.id+'/change',{slotId:catalog.slots[1].id})).status,200);
  const historical=(await req(customer,'/api/bookings/'+old.id)).data;assert.equal(historical.serviceName,old.serviceName);assert.deepEqual(historical.quote,old.quote);
  assert.equal((await req(owner,'/api/manage/service',{...edit,enabled:true})).status,200);assert.equal((await req(customer,'/api/quote',{vehicleId,serviceId:id})).data.amount,9999);
  assert.equal((await req(owner,'/api/manage/service',{...edit,mode:'assessment',enabled:true})).status,200);assert.equal((await req(customer,'/api/quote',{vehicleId,serviceId:id})).data.type,'assessment');
  assert.equal((await req(owner,'/api/manage/service',{...edit,revision:0})).status,409);
  for(const s of app.store.read().services)assert.equal((await req(owner,'/api/manage/service',{...s,enabled:false})).status,200);
  assert.deepEqual((await req(customer,'/api/catalog')).data.services,[]);saved=app.store.read();
 }finally{await new Promise(r=>app.server.close(r));}
 const reopened=openStore(database);try{assert.deepEqual(reopened.read(),saved);}finally{reopened.close();rmSync(dir,{recursive:true});}
});
