import {writeFile} from 'node:fs/promises';
const urls=['https://www.instagram.com/p/DIyYGx8S_6j/','https://www.instagram.com/p/DSthtORkoGq/','https://www.instagram.com/p/DSeURmLEjlu/'];
const results=[];for(const url of urls){try{const r=await fetch(url,{signal:AbortSignal.timeout(15000)}),h=await r.text();results.push({url,status:r.status,final:r.url,title:h.match(/<title[^>]*>([^<]*)/i)?.[1],description:h.match(/name="description" content="([^"]*)/)?.[1]});}catch(e){results.push({url,error:e.message});}}
await writeFile(new URL('evidence/case-destinations.json',import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));console.log(JSON.stringify(results,null,2));

