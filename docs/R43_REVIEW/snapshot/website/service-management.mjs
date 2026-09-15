import {randomUUID} from 'node:crypto';
import {requireValue,text} from './validation.mjs';
export const serviceEnabled=s=>s.enabled!==false;
export function saveService(state,input){
 const existing=input.id?state.services.find(s=>s.id===input.id):null;
 requireValue(!input.id||existing,'找不到此服務。');
 const mode=input.mode??existing?.mode,enabled=input.enabled??existing?.enabled??true;
 requireValue(text(input.name,70)&&text(input.note,300),'請填寫服務名稱與價格說明。');
 requireValue(['tier','fixed','assessment'].includes(mode)&&typeof enabled==='boolean');
 const price=n=>Number.isInteger(n)&&n>=1&&n<=1000000;
 const next={id:existing?.id||'service-'+randomUUID(),name:input.name.trim(),note:input.note.trim(),mode,enabled};
 if(mode==='tier'){requireValue(input.prices&&['mid','large','special','business'].every(k=>price(input.prices[k])),'請填寫四種車型的整數價格（1–1,000,000）。');next.prices=Object.fromEntries(['mid','large','special','business'].map(k=>[k,input.prices[k]]));}
 if(mode==='fixed'){requireValue(price(input.fixedPrice),'請填寫整數價格（1–1,000,000）。');next.fixedPrice=input.fixedPrice;}
 if(existing)state.services[state.services.indexOf(existing)]=next;else state.services.push(next);
 return next;
}
