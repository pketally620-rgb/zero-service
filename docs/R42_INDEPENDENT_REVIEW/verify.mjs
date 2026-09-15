import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {brandsFor,modelsFor} from './snapshot/website/public/ux.mjs';
import {classifyVehicle} from './snapshot/website/domain.mjs';
import {quoteFromMaster,validateMaster} from './snapshot/website/vehicle-master.mjs';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const sha=p=>createHash('sha256').update(readFileSync(new URL(p,import.meta.url))).digest('hex');
const master=load('snapshot/website/data/vehicle-master-r42.json'),original=load('snapshot/docs/r42/RELEASE_MANIFEST.json');
for(const [p,h] of Object.entries(original.files))assert.equal(sha('snapshot/'+p),h,p);
assert.equal(createHash('sha256').update(JSON.stringify(original.files)).digest('hex'),original.overlaySha256);
const trace=load('SOURCE_PROVENANCE_MANIFEST.json');assert.equal(trace.candidateSha256,sha('snapshot/website/data/vehicle-master-r42.json'));
const checks=load('snapshot/docs/r42/primary-checks.json').checks;
const normalize=s=>/^(?:\d{4}|\d,\d{3})\s*mm$/.test(s)?Number(s.replace(/\D/g,'')):null;
const decode=s=>s.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n));
validateMaster(master);assert.equal(trace.records.length,master.vehicles.length);
for(const v of master.vehicles){
 const row=trace.records.find(r=>r.id===v.id);assert.ok(row);assert.equal(row.lengthMm,v.lengthMm);assert.deepEqual(row.variants.map(x=>x.name),v.sourceVariants);
 for(const t of row.variants){let observed;
  if(t.method==='raw-mm-normalization'||t.method==='manufacturer-correction'){
   const fact=load(t.evidenceFile),raw=fact.entries.find(e=>decode(e.variant)===t.name);assert.ok(raw);assert.equal(raw.lengthText,t.rawLengthText);
   observed=normalize(raw.lengthText);
   if(t.method==='manufacturer-correction'){const c=checks.find(c=>c.sourceId===v.sourceId&&((c.result==='CORRECT_PHEV_LENGTH'&&c.variant===raw.variant)||(c.result==='FILL_MISSING_LENGTH'&&observed===null)));assert.ok(c);observed=c.lengthMm;}
  }else if(t.method==='historical-source-note'){const h=load(t.evidenceFile).find(h=>h.id===v.id);assert.ok(h?.sourceVariants.includes(t.name));observed=h.lengthMm;}
  else {const c=checks.find(c=>c.result==='SEPARATE_OFFICIAL_VARIANT_SET'&&c.variants.includes(t.name));assert.ok(c);observed=c.lengthMm;}
  assert.equal(observed,v.lengthMm,v.id+'/'+t.name);
 }
 assert.equal(classifyVehicle(v),v.zeroTier);
 for(const override of ['mid','large','special','business'])assert.equal(classifyVehicle({...v,ownerOverrideTier:override}),override);
}
const brands=brandsFor(master.vehicles);assert.equal(brands.length,46);
for(const b of brands){const rows=modelsFor(master.vehicles,b);assert.ok(rows.length);assert.ok(rows.every(v=>v.brand===b));}
assert.deepEqual(modelsFor(master.vehicles,'Unlisted brand'),[]);
assert.deepEqual(quoteFromMaster(master,'unknown-id',{mode:'tier',prices:{mid:1}}),{type:'unknown',action:'CONTACT_ZERO'});
const exceptions=load('snapshot/docs/r42/exceptions.json');for(const e of exceptions)assert.ok(!master.vehicles.some(v=>v.brand===e.brand&&v.baseModel===e.model&&v.sourceVariants.includes(e.variant)));
const integrity=load('INTEGRITY.json');for(const [p,h] of Object.entries(integrity.files))assert.equal(sha(p),h,p);
console.log(JSON.stringify({status:'PASS',integrityFiles:Object.keys(integrity.files).length,candidateUnchanged:true,records:master.vehicles.length,sourceVariants:trace.records.reduce((n,r)=>n+r.variants.length,0),sourceTraceability:'PASS',brandModel:'PASS',tier:'PASS',allFourOverrides:'PASS',unknown:'CONTACT_ZERO',exceptionOverlap:0,limitations:'Checks saved extracts and notes; linked sources still require independent spot checks.'},null,2));
