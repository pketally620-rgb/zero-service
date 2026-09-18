import http from 'node:http';
import test from 'node:test';import assert from 'node:assert/strict';import{mkdtemp,rm}from'node:fs/promises';import{tmpdir}from'node:os';import{join}from'node:path';import{createCandidate,passwordHash}from'../server.mjs';import{openStore}from'../store.mjs';
const origin='https://zerocraft.tw',trusted={'Host':'zerocraft.tw','X-Forwarded-Host':'zerocraft.tw','X-Forwarded-Proto':'https','X-Forwarded-For':'192.0.2.10'};
test('production activation: origin, proxy, cookies, auth, isolation and launch text',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'zero-activation-')),database=join(dir,'isolated.sqlite');const seed=openStore(database,{fixtures:true});seed.db.prepare('INSERT INTO settings VALUES(?,?)').run('admin-password',await passwordHash('Isolated-test-only-984!'));seed.close();
 for(const config of [{origin},{origin:'http://zerocraft.tw',trustedLocalProxy:true},{origin:'https://evil.example',trustedLocalProxy:true},{origin, trustedLocalProxy:true,fixtures:true}])assert.throws(()=>createCandidate({database,...config}));
 const app=createCandidate({database,origin,trustedLocalProxy:true});assert.throws(()=>app.server.listen(4291,'0.0.0.0'));assert.throws(()=>app.server.listen(4291));await new Promise(r=>app.server.listen(4291,'127.0.0.1',r));
 async function req(path,{headers={},body,client,raw=false}={}){return new Promise((resolve,reject)=>{const r=http.request({hostname:'127.0.0.1',port:4291,path,method:body===undefined?'GET':'POST',headers:{...trusted,Origin:origin,'Content-Type':'application/json',Connection:'close',...(client?{Cookie:client.cookie||'','X-CSRF-Token':client.csrf||''}:{}),...headers}},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>{const cookie=res.headers['set-cookie']?.[0];if(client&&cookie)client.cookie=cookie.split(';')[0];resolve({status:res.statusCode,headers:{get:k=>k==='set-cookie'?cookie:res.headers[k]},data:raw?text:JSON.parse(text)});});});r.on('error',reject);r.end(body===undefined?undefined:JSON.stringify(body));});}

 try{
  for(const headers of [{Host:'evil.example'},{'X-Forwarded-Host':'evil.example'},{'X-Forwarded-Proto':'http'},{'X-Forwarded-For':'192.0.2.1, 192.0.2.2'},{'X-Forwarded-For':'invalid'},{Forwarded:'for=192.0.2.1'},{'X-Forwarded-Proto':''}])assert.equal((await req('/api/catalog',{headers})).status,403);
  const direct=await fetch('http://127.0.0.1:4291/api/catalog',{headers:{Host:'zerocraft.tw'}});assert.equal(direct.status,403);await direct.text();
  const a={},b={},admin={};for(const client of[a,b]){const r=await req('/api/session',{client});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert.match(r.headers.get('set-cookie'),/; Secure/);client.csrf=r.data.csrf;}
  assert.equal((await req('/api/manage')).status,401);
  assert.equal((await req('/api/quote',{client:a,body:{},headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await req('/api/quote',{client:a,body:{},headers:{'X-CSRF-Token':'wrong'}})).status,403);
  assert.equal((await req('/api/manage/service',{client:a,body:{}})).status,403);
  const catalog=(await req('/api/catalog')).data,payload={slotId:catalog.slots[0].id,vehicleId:'tesla-model-y',serviceId:'wash'};
  const booking=await req('/api/bookings',{client:a,body:payload});assert.equal(booking.status,201);assert.equal(booking.data.status,'PENDING');assert.equal(booking.data.quote.amount,2100);
  assert.equal((await req('/api/bookings/'+booking.data.id,{client:b})).status,404);assert.equal((await req('/api/bookings',{client:b,body:payload})).status,400);
  const login=await req('/api/admin/login',{client:admin,body:{password:'Isolated-test-only-984!'}});assert.equal(login.status,200);admin.csrf=login.data.csrf;assert.match(login.headers.get('set-cookie'),/; Secure/);
  assert.equal((await req('/api/manage/bookings/'+booking.data.id+'/confirm',{client:admin,body:{}})).data.status,'CONFIRMED');
  assert.equal((await req('/api/admin/logout',{client:admin,body:{}})).status,200);assert.equal((await req('/api/manage',{client:admin})).status,401);
  for(const path of ['/','/app.mjs','/admin','/ux.mjs']){const r=await req(path,{raw:true});assert.equal(r.status,200);assert.doesNotMatch(r.data,/示範|請勿送出|請勿實際送出|預覽|體驗版/);}
  assert.match((await req('/app.mjs',{raw:true})).data,/ZERO 預約需求/);assert.match((await req('/',{raw:true})).data,/撤回預約不是立即刪除資料/);
  for(let i=0;i<8;i++)assert.equal((await req('/api/admin/login',{body:{password:'wrong'},headers:{'X-Forwarded-For':'192.0.2.20'}})).status,401);
  assert.equal((await req('/api/admin/login',{body:{password:'wrong'},headers:{'X-Forwarded-For':'192.0.2.20'}})).status,429);assert.equal((await req('/api/admin/login',{body:{password:'wrong'},headers:{'X-Forwarded-For':'192.0.2.21'}})).status,401);
 }finally{await new Promise(r=>app.server.close(r));await rm(dir,{recursive:true,force:true});}
});

import {spawnSync} from 'node:child_process';
test('production entry refuses absent or synthetic database before listening',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'zero-entry-')),database=join(dir,'fixture.sqlite');const seed=openStore(database,{fixtures:true});seed.close();
 try{for(const path of ['',database]){const r=spawnSync(process.execPath,['website/production.mjs'],{cwd:new URL('../..',import.meta.url),env:{...process.env,ZERO_DATABASE:path},encoding:'utf8',timeout:3000});assert.notEqual(r.status,0);assert.equal(r.error,undefined);assert.match(r.stderr,/Existing absolute ZERO_DATABASE required|Approved launch database required/);}}finally{await rm(dir,{recursive:true,force:true});}
});
