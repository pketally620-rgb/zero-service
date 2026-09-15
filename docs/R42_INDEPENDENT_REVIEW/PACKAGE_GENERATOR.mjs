import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
const root='r42-evidence-checkout/docs/R42_INDEPENDENT_REVIEW';
mkdirSync(root,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(readFileSync(p));
const old=read('docs/r42/RELEASE_MANIFEST.json');
for(const [p,h] of Object.entries(old.files))if(sha(readFileSync(p))!==h)throw Error('Frozen candidate changed: '+p);
const paths=[...Object.keys(old.files),'website/domain.mjs','website/store.mjs','website/policy.mjs','website/server.mjs','website/validation.mjs','website/public/ux.mjs','website/tests/candidate.test.mjs','website/tests/policy.test.mjs','docs/r42/collect.mjs','docs/r42/coverage-index.json','docs/r42/summary.json','docs/r42/RESULT.md','docs/r42/RELEASE_MANIFEST.json',...readdirSync('docs/r42/facts').map(n=>'docs/r42/facts/'+n)];
for(const p of paths){const to=join(root,'snapshot',p);mkdirSync(dirname(to),{recursive:true});copyFileSync(p,to);}
const master=read('website/data/vehicle-master-r42.json'),checks=read('docs/r42/primary-checks.json').checks,historical=read('docs/r42/historical.json');
const decode=s=>s.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n));
const facts=new Map(readdirSync('docs/r42/facts').map(n=>{const f=read('docs/r42/facts/'+n);return[f.sourceId,{file:'snapshot/docs/r42/facts/'+n,f}];}));
const records=master.vehicles.map(v=>{
 const origin=facts.get(v.sourceId),h=historical.find(x=>x.id===v.id);
 const variants=v.sourceVariants.map(name=>{
  if(h){if(h.lengthMm!==v.lengthMm)throw Error(v.id);return {name,method:'historical-source-note',evidenceFile:'snapshot/docs/r42/historical.json',lengthMm:h.lengthMm,sources:h.sources};}
  if(!origin){const c=checks.find(x=>x.result==='SEPARATE_OFFICIAL_VARIANT_SET'&&x.variants.includes(name));if(!c||c.lengthMm!==v.lengthMm)throw Error(v.id);return{name,method:'separate-official-variant',evidenceFile:'snapshot/docs/r42/primary-checks.json',lengthMm:c.lengthMm,source:c.url};}
  const e=origin.f.entries.find(x=>decode(x.variant)===name);if(!e)throw Error('No raw variant '+v.id+' '+name);
  const raw=/^(?:\d{4}|\d,\d{3})\s*mm$/.test(e.lengthText)?Number(e.lengthText.replace(/\D/g,'')):null;
  const correction=checks.find(c=>c.sourceId===v.sourceId&&((c.result==='CORRECT_PHEV_LENGTH'&&c.variant===e.variant)||(c.result==='FILL_MISSING_LENGTH'&&raw===null)));
  if((correction?.lengthMm??raw)!==v.lengthMm)throw Error('Unbacked dimension '+v.id+' '+name);
  return {name,method:correction?'manufacturer-correction':'raw-mm-normalization',evidenceFile:origin.file,rawLengthText:e.lengthText,rawBodyText:e.bodyText,rawLengthMm:raw,lengthMm:v.lengthMm,...(correction?{correctionFile:'snapshot/docs/r42/primary-checks.json',correction}:{}),source:origin.f.url};
 });
 return{id:v.id,brand:v.brand,model:v.model,lengthMm:v.lengthMm,kind:v.kind,zeroTier:v.zeroTier,applicability:v.applicability,variants,sources:v.sources};
});
const exceptions=read('docs/r42/exceptions.json');
for(const e of exceptions)if(records.some(r=>r.brand===e.brand&&master.vehicles.find(v=>v.id===r.id).baseModel===e.model&&r.variants.some(v=>v.name===e.variant)))throw Error('Unresolved version included '+e.model);
writeFileSync(join(root,'SOURCE_PROVENANCE_MANIFEST.json'),JSON.stringify({candidateSha256:old.files['website/data/vehicle-master-r42.json'],limitations:'Traceability audit of saved factual extracts and cited primary/historical notes. Page hashes identify prior captures but full 381 HTML pages are not archived; not independent proof of source truth. Manufacturer/historical note values require linked-source spot checks.',records},null,2));
writeFileSync(join(root,'NO_GUESSED_DIMENSIONS_AUDIT.json'),JSON.stringify({result:'PASS_TRACEABILITY',records:records.length,variants:records.flatMap(r=>r.variants).length,unbackedDimensions:0,unresolvedVariants:exceptions.length,unresolvedVariantOverlap:0,methods:records.flatMap(r=>r.variants).reduce((a,v)=>(a[v.method]=(a[v.method]||0)+1,a),{}),candidateHashesUnchanged:true,scope:'Existing evidence only; no re-scrape, dataset rebuild or new vehicle values.'},null,2));
copyFileSync('docs/r42/package-evidence.mjs',join(root,'PACKAGE_GENERATOR.mjs'));
console.log(JSON.stringify({packagedFiles:paths.length,records:records.length,variants:records.flatMap(r=>r.variants).length,candidateUnchanged:true}));
