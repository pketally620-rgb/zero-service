import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createCandidate,passwordHash} from '../server.mjs';
import {officialOpenTimes,slotDayState,slotCue} from '../public/slot-state.mjs';

const now=Date.parse('2026-09-21T10:00:00+08:00'),day='2026-09-22',port=4200,origin=`http://127.0.0.1:${port}`;

test('UAT-06 state model separates persisted OPEN, unsaved draft, CLOSED and LOCKED without color',()=>{
 const slots=[
  {id:day+'-09:00',date:day,time:'09:00',status:'OPEN',bookingId:null},
  {id:day+'-09:30',date:day,time:'09:30',status:'CLOSED',bookingId:null},
  {id:day+'-10:00',date:day,time:'10:00',status:'PENDING',bookingId:'PB-LOCKED'}
 ];
 assert.deepEqual(officialOpenTimes(slots,day,now),['09:00']);
 assert.deepEqual(slotDayState(slots,day,['09:00','09:30','10:00'],now),{persisted:['09:00'],proposed:['09:00','09:30'],dirty:true});
 assert.deepEqual(slotDayState(slots,day,['09:00'],now),{persisted:['09:00'],proposed:['09:00'],dirty:false});
 assert.deepEqual(slotCue(slots[0],true,false),{kind:'open',symbol:'✓',label:'開啟'});
 assert.deepEqual(slotCue(slots[1],false,false),{kind:'closed',symbol:'○',label:'關閉'});
 assert.deepEqual(slotCue(slots[2],true,false),{kind:'locked',symbol:'🔒',label:'已鎖定'});
});

test('UAT-06 daily save reload truth rejects stale draft and preserves booking-owned slot',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'zero-uat06-')),database=join(dir,'candidate.sqlite');
 const app=createCandidate({database,origin,fixtures:true,now:()=>now});
 app.store.db.prepare('INSERT INTO settings VALUES(?,?)').run('admin-password',await passwordHash('UAT06-test-password-574!'));
 const owner={cookie:'',csrf:''},customer={cookie:'',csrf:''};
 async function request(client,path,body){const response=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{Host:`127.0.0.1:${port}`,Origin:origin,Connection:'close',Cookie:client.cookie,'Content-Type':'application/json','X-CSRF-Token':client.csrf},body:body===undefined?undefined:JSON.stringify(body)});const cookie=response.headers.get('set-cookie');if(cookie)client.cookie=cookie.split(';')[0];return {status:response.status,data:await response.json()};}
 try{
  await new Promise(resolve=>app.server.listen(port,'127.0.0.1',resolve));
  customer.csrf=(await request(customer,'/api/session')).data.csrf;
  const login=await request(owner,'/api/admin/login',{password:'UAT06-test-password-574!'});owner.csrf=login.data.csrf;
  let management=(await request(owner,'/api/manage')).data;
  let saved=await request(owner,'/api/manage/slots/day',{date:day,openTimes:['09:00','09:30','10:00'],revision:management.revision});
  assert.equal(saved.status,200);assert.deepEqual(saved.data.openTimes,['09:00','09:30','10:00']);
  management=(await request(owner,'/api/manage')).data;const preBookingRevision=management.revision;
  const booking=await request(customer,'/api/bookings',{slotId:day+'-10:00',vehicleId:'tesla-model-y',serviceId:'wash'});assert.equal(booking.status,201);
  const stale=await request(owner,'/api/manage/slots/day',{date:day,openTimes:[],revision:preBookingRevision});assert.equal(stale.status,409);
  management=(await request(owner,'/api/manage')).data;assert.equal(management.slots.find(slot=>slot.id===day+'-10:00').bookingId,booking.data.id);
  saved=await request(owner,'/api/manage/slots/day',{date:day,openTimes:['09:30'],revision:management.revision});assert.equal(saved.status,200);assert.deepEqual(saved.data.openTimes,['09:30']);assert.deepEqual(saved.data.protectedSlots,[{id:day+'-10:00',time:'10:00',status:'PENDING'}]);
  management=(await request(owner,'/api/manage')).data;
  assert.equal(management.slots.find(slot=>slot.id===day+'-09:00').status,'CLOSED');
  assert.equal(management.slots.find(slot=>slot.id===day+'-10:00').bookingId,booking.data.id);
  assert.deepEqual(officialOpenTimes(management.slots,day,now),['09:30']);
  assert.equal((await request(customer,'/api/bookings',{slotId:day+'-10:00',vehicleId:'tesla-model-y',serviceId:'wash'})).status,400);
 }finally{if(app.server.listening)await new Promise(resolve=>app.server.close(resolve));await rm(dir,{recursive:true,force:true});}
});
