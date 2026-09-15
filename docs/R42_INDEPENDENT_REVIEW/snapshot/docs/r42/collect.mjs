import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='docs/r42';mkdirSync(root+'/facts',{recursive:true});
const clean=s=>s.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const index=readFileSync(root+'/search.html','utf8');
const models=[...index.matchAll(/data-make="([^"]+)" data-model="([^"]+)" data-id="(\d+)"/g)].map(m=>({brand:clean(m[1]),model:clean(m[2]),sourceId:m[3]}));
const unique=[...new Map(models.map(m=>[m.sourceId,m])).values()];
writeFileSync(root+'/coverage-index.json',JSON.stringify({url:'https://newcar.u-car.com.tw/newcar/search',retrievedAt:new Date().toISOString(),models:unique},null,2));
const queue=[...unique];let done=0;
async function worker(){while(queue.length){const model=queue.shift(),file=root+'/facts/'+model.sourceId+'.json';if(existsSync(file)&&!JSON.parse(readFileSync(file)).error){done++;continue;}
 const url='https://newcar.u-car.com.tw/'+encodeURIComponent(model.brand)+'/'+encodeURIComponent(model.model)+'/'+model.sourceId+'/spec';
 try{const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('HTTP '+r.status);const html=await r.text();
 const table=html.match(/<table class="table_compare"[\s\S]*?<\/table>/)?.[0];if(!table)throw Error('Missing spec table');
 const variants=[...table.matchAll(/<p class="text_type">([\s\S]*?)<\/p>/g)].map(x=>clean(x[1]));
 function row(label){const tr=[...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].find(x=>x[1].includes('>'+label+'</td>'));if(!tr)throw Error('Missing '+label);
 const cells=[...tr[1].matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/g)];const values=cells.slice(1).flatMap(x=>Array(Number(x[1].match(/colspan="(\d+)"/)?.[1]||1)).fill(clean(x[2])));if(values.length!==variants.length)throw Error('Column mismatch '+label);return values;}
 const lengths=row('車長'),bodies=row('車身型式');let seats=[];try{seats=row('座位數');}catch{}
 const entries=variants.map((variant,i)=>({variant,lengthText:lengths[i],lengthMm:/^\d{4}\s*mm$/.test(lengths[i])?Number(lengths[i].replace(/\D/g,'')):null,bodyText:bodies[i],seatText:seats[i]||null}));
 writeFileSync(file,JSON.stringify({...model,url,retrievedAt:new Date().toISOString(),pageSha256:createHash('sha256').update(html).digest('hex'),entries},null,2));
 }catch(e){writeFileSync(file,JSON.stringify({...model,url,error:e.message},null,2));}
 done++;if(done%20===0)console.log('Reviewed spec pages '+done+'/'+unique.length);await new Promise(r=>setTimeout(r,300));
}}
await Promise.all([worker(),worker()]);console.log('Collection complete '+unique.length);
