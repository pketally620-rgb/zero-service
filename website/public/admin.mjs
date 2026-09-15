const $=s=>document.querySelector(s);let csrf,data,draft;
const names={OPEN:'可申請',PENDING:'等待確認',CONFIRMED:'已確認',CANCELLED:'已結束',CLOSED:'暫停開放'},tiers={mid:'中型車',large:'大型車',special:'特殊型車',business:'商務型車'};
async function api(path,body){const r=await fetch(path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf||''},body:JSON.stringify(body)});const d=await r.json();if(!r.ok){if(r.status===401){$('#workspace').hidden=true;$('#login').hidden=false;data=null;draft=null;for(const id of ['bookingRows','slotRows','newService','serviceRows','vehicleRows','caseRows','linkFields'])$('#'+id).replaceChildren();}throw Error(d.error);}return d;}
const act=fn=>async e=>{e?.preventDefault();try{await fn(e);}catch(err){$('#message').textContent=err.message;}};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
function field(parent,label,value,{type='text',options,max=300}={}){const l=el('label',label),n=el(options?'select':'input');if(options)for(const [v,t] of options)n.append(new Option(t,v));else{n.type=type;n.maxLength=max;}if(type==='checkbox')n.checked=!!value;else n.value=value??'';l.append(n);parent.append(l);return n;}
function button(parent,label,fn,cls='btn'){const b=el('button',label,cls);b.type='button';b.onclick=act(fn);parent.append(b);return b;}
async function save(path,body){await api(path,body);await load();$('#message').textContent='已儲存。';}
async function load(){data=await api('/api/manage');draft=structuredClone(data.content);$('#login').hidden=true;$('#workspace').hidden=false;render();}
function render(){
 const bookings=$('#bookingRows');bookings.replaceChildren();if(!data.bookings.length)bookings.textContent='目前沒有預約需求。';
 for(const b of [...data.bookings].reverse()){const row=el('div',null,'panel');const slot=data.slots.find(x=>x.id===b.slotId);row.append(el('h3',`${b.id} · ${names[b.status]}`),el('p',`${b.vehicleName}／${b.serviceName}`),el('p',`${slot.date} ${slot.time} · ${b.quote.type==='amount'?'NT$ '+b.quote.amount:'現場評估'}`));
  if(b.status==='PENDING')row.append(el('p','請於下一營業日結束前完成確認；仍未確認請取消並釋出時段。例假日由人員調整。'+(b.pendingReviewAt?' 一般截止：'+new Date(b.pendingReviewAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'')));
  if(b.status==='PENDING')button(row,'確認 '+b.id,()=>save('/api/manage/bookings/'+b.id+'/confirm',{}),'btn primary');
  if(b.endedAt)row.append(el('p','服務已結束；資料於結束後保留 90 天。'));
  if(b.status==='CONFIRMED'&&!b.endedAt&&Date.parse(slot.date+'T'+slot.time+':00+08:00')<=Date.now())button(row,'記錄服務已結束',()=>{if(confirm('確認此筆服務已實際結束？資料將於 90 天後刪除。'))return save('/api/manage/bookings/'+b.id+'/end',{});});
  if(b.status!=='CANCELLED'&&!b.endedAt){const sel=field(row,'改至時段','',{options:data.slots.filter(x=>x.status==='OPEN').map(x=>[x.id,x.date+' '+x.time])});button(row,'更改時段',()=>save('/api/manage/bookings/'+b.id+'/change',{slotId:sel.value})).disabled=!sel.options.length;button(row,'取消 '+b.id,()=>{if(confirm('取消後會釋出時段，確定取消？'))return save('/api/manage/bookings/'+b.id+'/cancel',{});});}bookings.append(row);}
 const slots=$('#slotRows');slots.replaceChildren();for(const s of data.slots){const row=el('div',null,'admin-row');row.append(el('span',`${s.date} ${s.time} · ${names[s.status]} `));if(['OPEN','CLOSED'].includes(s.status))button(row,s.status==='OPEN'?'暫停開放':'開放申請',()=>save('/api/manage/slot',{id:s.id,open:s.status!=='OPEN'}));slots.append(row);}
 const services=$('#serviceRows');services.replaceChildren();for(const service of data.services)services.append(serviceEditor(service));
 const newService=$('#newService');newService.replaceChildren(serviceEditor());
 const vehicles=$('#vehicleRows');vehicles.replaceChildren();for(const v of data.vehicles){const box=el('details',null,'panel');box.append(el('summary',v.brand+' '+v.model));const f=el('form');const brand=field(f,'品牌',v.brand),model=field(f,'車款',v.model),length=field(f,'車長（mm）',v.lengthMm,{type:'number'}),kind=field(f,'類別',v.kind,{options:[['passenger','乘用車'],['mpv','MPV'],['van','商用廂型車']]}),override=field(f,'ZERO 指定分類',v.ownerOverrideTier||'',{options:[['','依自動規則'],...Object.entries(tiers)]});f.append(el('button','儲存此車款','btn primary'));f.onsubmit=act(()=>save('/api/manage/vehicle',{id:v.id,brand:brand.value,model:model.value,lengthMm:Number(length.value),kind:kind.value,override:override.value}));box.append(f);vehicles.append(box);}
 renderContent();
}

function serviceEditor(s){
 const box=el('form',null,'panel');box.append(el('h3',s?s.name+' · '+(s.enabled===false?'已停用':'已啟用'):'新增服務'));
 const name=field(box,'服務名稱',s?.name||'',{max:70}),note=field(box,'價格說明',s?.note||'',{max:300});name.required=true;note.required=true;
 const mode=field(box,'計價方式',s?.mode||'tier',{options:[['tier','依車型分級'],['fixed','固定價格'],['assessment','現場評估']]}),priceBox=el('div');box.append(priceBox);
 let prices={},fixed;const values={...s?.prices};let fixedValue=s?.fixedPrice;
 function pricing(){if(fixed)fixedValue=fixed.value;for(const [k,input] of Object.entries(prices))values[k]=input.value;priceBox.replaceChildren();prices={};fixed=null;
  if(mode.value==='tier')for(const [k,label] of Object.entries(tiers))prices[k]=field(priceBox,label+'（NT$）',values[k]??'',{type:'number'});
  if(mode.value==='fixed')fixed=field(priceBox,'固定基準價（NT$）',fixedValue??'',{type:'number'});
  if(mode.value==='assessment')priceBox.append(el('p','不顯示固定金額，由 ZERO 依實車狀況評估。'));
  for(const input of [...Object.values(prices),...(fixed?[fixed]:[])]){input.required=true;input.min='1';input.max='1000000';input.step='1';}
 }mode.onchange=pricing;pricing();
 const enabled=field(box,'啟用於客戶服務選單',s?s.enabled!==false:false,{type:'checkbox'});
 box.append(el('p','停用後不接受新的此服務需求；既有預約的名稱、報價與處理流程保留。'));
 const submit=el('button',s?'儲存此服務':'新增服務','btn primary');submit.type='submit';box.append(submit);
 box.onsubmit=act(async()=>{submit.disabled=true;try{await save('/api/manage/service',{id:s?.id,revision:data.revision,name:name.value,note:note.value,mode:mode.value,enabled:enabled.checked,prices:Object.fromEntries(Object.entries(prices).map(([k,v])=>[k,Number(v.value)])),fixedPrice:fixed?Number(fixed.value):undefined});}finally{submit.disabled=false;}});return box;
}

function caseFields(box,item){const title=field(box,'標題',item.title,{max:70}),url=field(box,'HTTPS 網址',item.url,{type:'url',max:1000}),enabled=field(box,'啟用',item.enabled,{type:'checkbox'});title.oninput=()=>item.title=title.value;url.oninput=()=>item.url=url.value;enabled.onchange=()=>item.enabled=enabled.checked;}
function renderContent(){const feature=$('#featured');feature.replaceChildren();caseFields(feature,draft.featured);const rows=$('#caseRows');rows.replaceChildren();draft.cases.forEach((c,i)=>{const box=el('div',null,'case-editor');box.append(el('h3','案例 '+(i+1)));caseFields(box,c);button(box,'上移',()=>{[draft.cases[i-1],draft.cases[i]]=[draft.cases[i],draft.cases[i-1]];renderContent();}).disabled=i===0;button(box,'下移',()=>{[draft.cases[i+1],draft.cases[i]]=[draft.cases[i],draft.cases[i+1]];renderContent();}).disabled=i===draft.cases.length-1;button(box,'移除',()=>{draft.cases.splice(i,1);renderContent();});rows.append(box);});const links=$('#linkFields');links.replaceChildren();for(const [key,label] of Object.entries({facebook:'Facebook',instagram:'Instagram',maps:'Google Maps',line:'官方 LINE 連結',lineAccount:'官方 LINE 帳號 ID（含 @）'})){const input=field(links,label,draft.links[key],{type:key==='lineAccount'?'text':'url',max:1000});input.oninput=()=>draft.links[key]=input.value;}}
$('#addCase').onclick=()=>{if(draft.cases.length>=20){$('#message').textContent='最多可儲存 20 筆案例。';return;}draft.cases.push({id:crypto.randomUUID(),title:'新案例',url:'',enabled:false});renderContent();};
$('#contentForm').onsubmit=act(()=>save('/api/manage/content',{revision:data.revision,content:draft}));
$('#newSlot').onsubmit=act(e=>save('/api/manage/slot',{date:e.target.elements.date.value,time:e.target.elements.time.value,open:true}));
$('#login').onsubmit=act(async e=>{csrf=(await api('/api/admin/login',{password:e.target.elements.password.value})).csrf;e.target.reset();await load();$('#message').textContent='已登入。';});
$('#reload').onclick=act(load);$('#logout').onclick=act(async()=>{await api('/api/admin/logout',{});location.reload();});
try{csrf=(await api('/api/admin/session')).csrf;await load();}catch{}
