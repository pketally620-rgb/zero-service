import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {validateMaster,prepareVehicleMaster,quoteFromMaster} from '../vehicle-master.mjs';import {classifyVehicle,services} from '../domain.mjs';import {openStore} from '../store.mjs';
const master=JSON.parse(readFileSync(new URL('../data/vehicle-master-r42.json',import.meta.url)));
test('source-supported master: unique provenance, exact grouping, thresholds, overrides and unknown',()=>{
 validateMaster(master);assert.ok(master.vehicles.length>400);assert.ok(new Set(master.vehicles.map(v=>v.brand)).size>=40);
 for(const v of master.vehicles){assert.equal(v.zeroTier,classifyVehicle(v));assert.equal(classifyVehicle({...v,ownerOverrideTier:'business'}),'business');assert.ok(v.sources.every(s=>s.retrievedAt));assert.ok(!['corolla-cross','lexus-nx','tesla-model-y','porsche-cayenne','toyota-alphard'].includes(v.id));}
 for(const [n,t] of [[4630,'mid'],[4631,'large'],[4850,'large'],[4851,'special']])assert.equal(classifyVehicle({lengthMm:n,kind:'passenger'}),t);
 const altis=master.vehicles.filter(v=>v.baseModel==='Corolla Altis');assert.ok(altis.some(v=>v.lengthMm===4630&&v.zeroTier==='mid'));assert.ok(altis.some(v=>v.lengthMm===4635&&v.zeroTier==='large'));
 assert.ok(master.vehicles.some(v=>v.baseModel==='RAV4'&&v.lengthMm===4645&&v.zeroTier==='large'));
 assert.ok(master.vehicles.some(v=>v.baseModel==='Alphard'&&v.lengthMm===5000&&v.zeroTier==='business'));
 assert.ok(master.vehicles.some(v=>v.baseModel==='CR-V'&&v.years?.includes(2012)&&v.zeroTier==='mid'));
 assert.deepEqual(quoteFromMaster(master,'unlisted-or-old-model',services[0]),{type:'unknown',action:'CONTACT_ZERO'});
 const bad=structuredClone(master);bad.vehicles[0].lengthMm=null;assert.throws(()=>validateMaster(bad));
});
test('controlled preparation preserves override and business data, refuses fixture DB',()=>{
 const dir=mkdtempSync(join(tmpdir(),'zero-r42-'));const s=openStore(join(dir,'launch'));const fixture=openStore(join(dir,'fixture'),{fixtures:true});try{
  assert.throws(()=>prepareVehicleMaster(fixture,master));prepareVehicleMaster(s,master);assert.equal(s.read().vehicles.length,master.vehicles.length);assert.equal(s.read().slots.length,0);assert.equal(s.read().bookings.length,0);
  const id=master.vehicles[0].id;s.mutate(d=>{d.vehicles[0].ownerOverrideTier='business';d.services[0].prices.mid=1900;});prepareVehicleMaster(s,master);assert.equal(s.read().vehicles.find(v=>v.id===id).ownerOverrideTier,'business');assert.equal(s.read().services[0].prices.mid,1900);
 }finally{s.close();fixture.close();rmSync(dir,{recursive:true});}
});
