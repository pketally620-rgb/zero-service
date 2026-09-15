import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';import {createHash} from 'node:crypto';import {classifyVehicle} from '../../website/domain.mjs';
const root='docs/r42',checks=JSON.parse(readFileSync(root+'/primary-checks.json')).checks;
const index=JSON.parse(readFileSync(root+'/coverage-index.json'));
const decode=s=>s.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
const vehicles=[],exceptions=[],corrections=[];
const lengths=s=>/^(?:\d{4}|\d,\d{3})\s*mm$/.test(s)?Number(s.replace(/\D/g,'')):null;
const ordinary=new Set(['轎車/Sedan','跑車/Sports Car','敞篷車/Convertibles','掀背/Hatchback','運動休旅車/SUV','旅行車/Wagons','轎跑車/Coupes']);
for(const f of readdirSync(root+'/facts').sort()){
 const p=JSON.parse(readFileSync(root+'/facts/'+f));p.brand=decode(p.brand);p.model=decode(p.model);
 const relevant=checks.filter(c=>c.sourceId===p.sourceId||(c.brand===p.brand&&c.model===p.model));const groups=new Map();
 for(const entry of p.entries||[]){let lengthMm=lengths(entry.lengthText),kind=ordinary.has(entry.bodyText)?'passenger':entry.bodyText==='廂型車/Van'?'van':null;
 const refs=[{url:p.url,retrievedAt:p.retrievedAt,pageSha256:p.pageSha256,type:'Taiwan automotive publication',field:'length/body/variant'}];
 for(const c of relevant){if(c.result==='CORRECT_PHEV_LENGTH'&&entry.variant===c.variant||c.result==='FILL_MISSING_LENGTH'&&!lengthMm){corrections.push({sourceId:p.sourceId,variant:entry.variant,was:lengthMm,now:c.lengthMm,url:c.url});lengthMm=c.lengthMm;refs.push({url:c.url,retrievedAt:'2026-09-15',type:'manufacturer',field:'length'});}if(c.result==='BODY_RESOLVED'){kind=c.kind;refs.push({url:c.url,retrievedAt:'2026-09-15',type:'manufacturer',field:'body'});}}
 if(!lengthMm||lengthMm<2000||lengthMm>8000||!kind){exceptions.push({brand:p.brand,model:p.model,variant:entry.variant,lengthText:entry.lengthText,bodyText:entry.bodyText,reason:!lengthMm?'UNVERIFIED_LENGTH':'BODY_REQUIRES_CONFIRMATION',url:p.url});continue;}
 const key=lengthMm+'-'+kind;if(!groups.has(key))groups.set(key,{lengthMm,kind,bodyText:entry.bodyText,variants:[],sources:refs});groups.get(key).variants.push(decode(entry.variant));
 }
 for(const [key,g] of groups){const model=p.model+(groups.size>1?' · '+g.variants[0]+(g.variants.length>1?' 等':''):'');const v={id:'vm-'+p.sourceId+'-'+key,brand:p.brand,model,baseModel:p.model,lengthMm:g.lengthMm,kind:g.kind,bodyType:g.bodyText,sourceVariants:g.variants,applicability:'2026-09-15 查證規格；僅適用所列版本。舊款、改裝或不確定版本請聯繫 ZERO。',years:null,generation:null,sourceId:p.sourceId,sources:g.sources,verification:'SOURCE_SUPPORTED',ownerOverrideTier:null};v.zeroTier=classifyVehicle(v);vehicles.push(v);}
}
const sentra=checks.find(c=>c.result==='SEPARATE_OFFICIAL_VARIANT_SET');vehicles.push({id:'vm-nissan-sentra-official-4648',brand:'Nissan',model:'Sentra · 尊爵系列',baseModel:'Sentra',lengthMm:sentra.lengthMm,kind:'passenger',bodyType:'轎車',sourceVariants:sentra.variants,applicability:'僅適用尊爵版／尊爵智駕版／尊爵BOSE版；初綻／盛綻／極綻版本未核對，不套用。',years:null,generation:null,sourceId:'official-sentra',sources:[{url:sentra.url,retrievedAt:'2026-09-15',type:'manufacturer',field:'length/body/variant'}],verification:'SOURCE_SUPPORTED',ownerOverrideTier:null,zeroTier:'large'});
for(const h of JSON.parse(readFileSync(root+'/historical.json'))){h.zeroTier=classifyVehicle(h);vehicles.push(h);}
for(const v of vehicles)if(v.model.length>60)v.model=v.model.replaceAll(' with EQ technology',' EQ');
vehicles.sort((a,b)=>a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model));
const byBrand={};for(const p of index.models){const b=decode(p.brand);byBrand[b]??={indexed:0,supportedModels:0,rows:0};byBrand[b].indexed++;}
for(const b of Object.keys(byBrand)){const rows=vehicles.filter(v=>v.brand===b);byBrand[b].supportedModels=new Set(rows.map(v=>v.baseModel)).size;byBrand[b].rows=rows.length;}
const master={schema:1,candidate:'R4.2',authority:'https://github.com/pketally620-rgb/zero-service/issues/5#issuecomment-5678080832',asOf:'2026-09-15',scope:'Taiwan current-market source snapshot, not historical fleet coverage',fallback:'UNKNOWN_NOT_FOUND_CONTACT_ZERO_NO_AUTOMATIC_QUOTE',thresholds:{midMax:4630,largeMax:4850},vehicles};
mkdirSync('website/data',{recursive:true});const bytes=JSON.stringify(master,null,2)+'\n';writeFileSync('website/data/vehicle-master-r42.json',bytes);
const report={indexedModels:index.models.length,indexedBrands:Object.keys(byBrand).length,supportedModels:new Set(vehicles.map(v=>v.brand+'|'+v.baseModel)).size,rows:vehicles.length,supportedBrands:new Set(vehicles.map(v=>v.brand)).size,sourceVariants:vehicles.reduce((n,v)=>n+v.sourceVariants.length,0),exceptionVariants:exceptions.length,byBrand,corrections,sha256:createHash('sha256').update(bytes).digest('hex')};
writeFileSync(root+'/summary.json',JSON.stringify(report,null,2));writeFileSync(root+'/exceptions.json',JSON.stringify(exceptions,null,2));console.log(JSON.stringify(report));
