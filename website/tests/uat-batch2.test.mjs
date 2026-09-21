import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createCandidate,passwordHash} from '../server.mjs';

const port=4198;
const origin=`http://127.0.0.1:${port}`;
const now=Date.parse('2026-09-20T10:00:00+08:00');
const day='2026-09-22';

test('Owner UAT Batch 2: daily slots, vehicle lifecycle, case order and restart currentness',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'zero-uat-batch2-'));
 const database=join(dir,'candidate.sqlite');
 let app=createCandidate({database,origin,fixtures:true,now:()=>now});
 app.store.db.prepare('INSERT INTO settings VALUES(?,?)').run('admin-password',await passwordHash('Batch2-test-password-371!'));
 let base;
 const client=()=>({cookie:'',csrf:''});
 const owner=client(),customer=client();
 async function start(){await new Promise(resolve=>app.server.listen(port,'127.0.0.1',resolve));base=origin;}
 async function stop(){if(app.server.listening)await new Promise(resolve=>app.server.close(resolve));}
 async function request(client,path,body){
  let response;try{response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Host:`127.0.0.1:${port}`,Origin:origin,Connection:'close',Cookie:client.cookie,'Content-Type':'application/json','X-CSRF-Token':client.csrf},body:body===undefined?undefined:JSON.stringify(body)});}catch(error){throw new Error(`request failed: ${path}`,{cause:error});}
  const cookie=response.headers.get('set-cookie');if(cookie)client.cookie=cookie.split(';')[0];
  const data=await response.json();return {status:response.status,data};
 }
 try{
  await start();
  customer.csrf=(await request(customer,'/api/session')).data.csrf;
  const login=await request(owner,'/api/admin/login',{password:'Batch2-test-password-371!'});assert.equal(login.status,200);owner.csrf=login.data.csrf;
  async function saveDay(date,openTimes){const revision=(await request(owner,'/api/manage')).data.revision;return request(owner,'/api/manage/slots/day',{date,openTimes,revision});}

  // UAT-03: one date, multi-select half-hour times and one save.
  let result=await saveDay(day,['09:00','09:30','10:00']);
  assert.equal(result.status,200);assert.deepEqual(result.data.openTimes,['09:00','09:30','10:00']);
  let catalog=(await request(customer,'/api/catalog')).data;
  assert.deepEqual(catalog.slots.filter(slot=>slot.date===day).map(slot=>slot.time),['09:00','09:30','10:00']);
  result=await saveDay(day,['09:00','10:00']);
  assert.equal(result.status,200);
  catalog=(await request(customer,'/api/catalog')).data;
  assert.deepEqual(catalog.slots.filter(slot=>slot.date===day).map(slot=>slot.time),['09:00','10:00']);
  assert.equal((await saveDay(day,['09:15'])).status,400);

  // An occupied slot remains protected when the day's editable selections change.
  const booking=(await request(customer,'/api/bookings',{slotId:`${day}-10:00`,vehicleId:'tesla-model-y',serviceId:'wash'})).data;
  result=await saveDay(day,[]);
  assert.equal(result.status,200);assert.deepEqual(result.data.protectedSlots,[{id:`${day}-10:00`,time:'10:00',status:'PENDING'}]);
  const state=(await request(owner,'/api/manage')).data;
  assert.equal(state.slots.find(slot=>slot.id===`${day}-09:00`).status,'CLOSED');
  assert.equal(state.slots.find(slot=>slot.id===`${day}-10:00`).bookingId,booking.id);
  assert.equal((await request(customer,'/api/bookings',{slotId:`${day}-10:00`,vehicleId:'tesla-model-y',serviceId:'wash'})).status,400);

  // UAT-04: explicit add, disable, eligibility removal, preserved history, restore.
  const created=(await request(owner,'/api/manage/vehicle',{brand:'Test Brand',model:'Owner Model',lengthMm:4510,kind:'passenger',override:'',enabled:true}));
  assert.equal(created.status,201);const vehicle=created.data.vehicle;
  await saveDay('2026-09-23',['09:00','09:30']);
  const historical=(await request(owner,'/api/manage/bookings',{channel:'line',reference:'Batch 2',slotId:'2026-09-23-09:00',vehicleId:vehicle.id,serviceId:'wash'})).data;
  assert.equal(historical.vehicleName,'Test Brand Owner Model');
  assert.equal((await request(owner,'/api/manage/vehicle',{...vehicle,override:'',enabled:false})).status,200);
  catalog=(await request(customer,'/api/catalog')).data;assert.equal(catalog.vehicles.some(item=>item.id===vehicle.id),false);
  assert.equal((await request(customer,'/api/quote',{vehicleId:vehicle.id,serviceId:'wash'})).status,400);
  assert.equal((await request(owner,'/api/manage/bookings',{channel:'phone',reference:'Disabled',slotId:'2026-09-23-09:30',vehicleId:vehicle.id,serviceId:'wash'})).status,400);
  assert.equal((await request(owner,'/api/manage')).data.bookings.find(item=>item.id===historical.id).vehicleName,'Test Brand Owner Model');
  assert.equal((await request(owner,'/api/manage/vehicle',{...vehicle,override:'',enabled:true})).status,200);
  catalog=(await request(customer,'/api/catalog')).data;assert.equal(catalog.vehicles.some(item=>item.id===vehicle.id),true);

  // UAT-05 / UAT-01: persisted order is the only order; public exposes up to five actual enabled cases.
  let management=(await request(owner,'/api/manage')).data;
  const cases=Array.from({length:6},(_,index)=>({id:`case-${index+1}`,title:`案例 ${index+1}`,url:`https://www.instagram.com/p/case${index+1}/`,enabled:true}));
  const content={...management.content,cases};
  result=await request(owner,'/api/manage/content',{revision:management.revision,content});
  assert.equal(result.status,200);assert.deepEqual(result.data.content.cases.map(item=>item.id),cases.map(item=>item.id));
  assert.equal((await request(owner,'/api/manage/content',{revision:management.revision,content})).status,409);
  management=(await request(owner,'/api/manage')).data;assert.deepEqual(management.content.cases.map(item=>item.id),cases.map(item=>item.id));
  catalog=(await request(customer,'/api/catalog')).data;assert.deepEqual(catalog.content.cases.map(item=>item.id),cases.slice(0,5).map(item=>item.id));

  // Same SQLite state and sessions remain current across application restart.
  await stop();app=createCandidate({database,origin,now:()=>now});await start();
  management=(await request(owner,'/api/manage')).data;assert.deepEqual(management.content.cases.map(item=>item.id),cases.map(item=>item.id));
  catalog=(await request(customer,'/api/catalog')).data;assert.deepEqual(catalog.content.cases.map(item=>item.id),cases.slice(0,5).map(item=>item.id));
  assert.equal(management.bookings.find(item=>item.id===historical.id).vehicleName,'Test Brand Owner Model');
 }finally{await stop();await rm(dir,{recursive:true,force:true});}
});
