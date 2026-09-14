export function requireValue(ok,message='輸入內容不正確。'){if(!ok)throw Object.assign(new Error(message),{status:400});}
export const text=(v,max=100)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
export function safeURL(value,hosts){
  requireValue(text(value,1000),'請填寫完整 HTTPS 網址。');
  let u;try{u=new URL(value);}catch{requireValue(false,'網址格式不正確。');}
  requireValue(u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash,'請使用不含帳密的 HTTPS 網址。');
  requireValue(!/^(localhost|.*\.localhost|.*\.local|\[.*\]|[\d.]+)$/.test(u.hostname)&&u.hostname.includes('.'),'請使用公開網站網址。');
  if(hosts)requireValue(hosts.includes(u.hostname),'網址不屬於指定服務。');
  return u.href;
}
export function validateContent(c){
  requireValue(c&&c.featured&&Array.isArray(c.cases)&&c.cases.length<=20&&c.links);
  const cleanCase=(v)=>{requireValue(v&&text(v.title,70)&&typeof v.enabled==='boolean');return {title:v.title.trim(),url:safeURL(v.url),enabled:v.enabled};};
  const ids=new Set();const cases=c.cases.map(v=>{requireValue(text(v.id,80)&&!ids.has(v.id));ids.add(v.id);return {...cleanCase(v),id:v.id};});
  requireValue(/^@[a-zA-Z0-9_.-]{3,40}$/.test(c.links.lineAccount),'請填寫官方 LINE 帳號 ID（含 @）。');
  return {featured:cleanCase(c.featured),cases,links:{
    facebook:safeURL(c.links.facebook,['www.facebook.com','facebook.com']),instagram:safeURL(c.links.instagram,['www.instagram.com','instagram.com']),
    maps:safeURL(c.links.maps,['maps.app.goo.gl','www.google.com','maps.google.com']),line:safeURL(c.links.line,['lin.ee','line.me']),lineAccount:c.links.lineAccount}};
}

