import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {openStore} from '../store.mjs';import {retain,rotateAdminHash,pendingReviewAt} from '../policy.mjs';import {createCandidate,passwordHash} from '../server.mjs';
test('launch seed, retention boundaries, pending preservation and credential revocation',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'zero-r41-'));const store=openStore(join(dir,'db'));const now=Date.parse('2026-09-15T12:00:00Z'),day=86400000;
 try{const s=store.read();assert.equal(s.vehicles.length,0);assert.equal(s.slots.length,0);assert.equal(s.bookings.length,0);assert.deepEqual(s.services[0].prices,{mid:1800,large:2100,special:2500,business:3000});assert.equal(s.content.links.lineAccount,'@udu6260e');
 store.mutate(s=>{s.bookings=[{id:'expired',status:'CANCELLED',cancelledAt:new Date(now-90*day).toISOString()},{id:'recent',status:'CANCELLED',cancelledAt:new Date(now-89*day).toISOString()},{id:'pending',status:'PENDING',createdAt:new Date(now-100*day).toISOString()},{id:'unknown',status:'CANCELLED'},{id:'ended',status:'CONFIRMED',endedAt:new Date(now-90*day).toISOString()}];});
 store.db.prepare('INSERT INTO audit(time,action) VALUES(?,?)').run(new Date(now-30*day).toISOString(),'test');store.db.prepare('INSERT INTO limits VALUES(?,?,?)').run('synthetic',1,now-1);
 store.db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run('admin','admin','a',now+day);store.db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run('customer','customer','c',now+day);
 const r=retain(store,now);assert.equal(r.bookings,2);assert.equal(r.audit,1);assert.equal(r.limits,1);assert.equal(r.missingTerminalAnchor,1);assert.ok(store.read().bookings.some(b=>b.id==='pending'));
 assert.equal(rotateAdminHash(store,await passwordHash('controlled-new-secret'),now).revoked,1);assert.equal(store.db.prepare("select count(*) n from sessions where role='customer'").get().n,1);
 assert.equal(pendingReviewAt('2026-09-12T03:00:00Z'),'2026-09-14T10:00:00.000Z');
 }finally{store.close();rmSync(dir,{recursive:true});}
});
test('rotation rejects obsolete login/session; launch catalog exposes only opened slots; actual end retention anchor',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'zero-r41-api-'));let now=Date.now();const origin='http://127.0.0.1:4193';const app=createCandidate({database:join(dir,'db'),origin,now:()=>now});
 const req=async(path,body,cookie='',csrf='')=>{const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 try{rotateAdminHash(app.store,await passwordHash('controlled-old'));await new Promise(r=>app.server.listen(4193,'127.0.0.1',r));const old=await req('/api/admin/login',{password:'controlled-old'});assert.equal(old.status,200);rotateAdminHash(app.store,await passwordHash('controlled-new'));assert.equal((await req('/api/manage',null,old.cookie)).status,401);assert.equal((await req('/api/admin/login',{password:'controlled-old'})).status,401);const current=await req('/api/admin/login',{password:'controlled-new'});assert.equal(current.status,200);
 const date=new Date(now+86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'});assert.equal((await req('/api/manage/slot',{date,time:'10:00',open:true},current.cookie,current.data.csrf)).status,200);assert.equal((await req('/api/manage/slot',{date,time:'11:00',open:false},current.cookie,current.data.csrf)).status,200);const catalog=(await req('/api/catalog')).data;assert.equal(catalog.slots.length,1);assert.equal(catalog.vehicles.length,0);
 app.store.mutate(s=>{s.bookings=[{id:'controlled',status:'CONFIRMED',slotId:date+'-10:00'}];});now+=2*86400000;
 assert.equal((await req('/api/admin/login',{password:'controlled-new'})).status,200);const fresh=await req('/api/admin/login',{password:'controlled-new'});
 assert.equal((await req('/api/manage/bookings/controlled/end',{},fresh.cookie,fresh.data.csrf)).status,200);assert.equal(app.store.read().bookings[0].endedAt,new Date(now).toISOString());assert.equal((await req('/api/manage/bookings/controlled/cancel',{},fresh.cookie,fresh.data.csrf)).status,400);
 }finally{await new Promise(r=>app.server.close(r));rmSync(dir,{recursive:true});}
});
