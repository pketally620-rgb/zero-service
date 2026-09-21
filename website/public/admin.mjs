import {slotDayState,slotCue} from './slot-state.mjs';
const $=s=>document.querySelector(s);let csrf,data,draft,slotDate='',slotDraftDate='',slotSelection=new Set(),vehicleBrand='',vehicleSearch='';
const names={OPEN:'可申請',PENDING:'等待確認',CONFIRMED:'已確認',CANCELLED:'已結束',CLOSED:'暫停開放'},tiers={mid:'中型車',large:'大型車',special:'特殊型車',business:'商務型車'};
async function api(path,body){const r=await fetch(path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf||''},body:JSON.stringify(body)});const d=await r.json();if(!r.ok){if(r.status===401){$('#workspace').hidden=true;$('#login').hidden=false;data=null;draft=null;for(const id of ['bookingRows','manualBooking','slotDayEditor','slotHistory','newService','serviceRows','vehicleFilter','newVehicle','vehicleRows','caseRows','linkFields'])$('#'+id).replaceChildren();}const error=Error(d.error);error.status=r.status;throw error;}return d;}
const act=fn=>async e=>{e?.preventDefault();try{await fn(e);}catch(err){$('#message').textContent=err.message;}};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
function field(parent,label,value,{type='text',options,max=300}={}){const l=el('label',label),n=el(options?'select':'input');if(options)for(const [v,t] of options)n.append(new Option(t,v));else{n.type=type;n.maxLength=max;}if(type==='checkbox')n.checked=!!value;else n.value=value??'';l.append(n);parent.append(l);return n;}
function button(parent,label,fn,cls='btn'){const b=el('button',label,cls);b.type='button';b.onclick=act(fn);parent.append(b);return b;}
async function save(path,body){await api(path,body);await load();$('#message').textContent='已儲存。';}
async function load({resetSlotDraft=false}={}){data=await api('/api/manage');draft=structuredClone(data.content);if(resetSlotDraft)slotDraftDate='';$('#login').hidden=true;$('#workspace').hidden=false;render();}
function render(){
 renderManualBooking();
 const bookings=$('#bookingRows');bookings.replaceChildren();if(!data.bookings.length)bookings.textContent='目前沒有預約需求。';
 for(const b of [...data.bookings].reverse()){const row=el('div',null,'panel');const slot=data.slots.find(x=>x.id===b.slotId);row.append(el('h3',`${b.id} · ${names[b.status]}`),el('p',`${b.vehicleName}／${b.serviceName}`),el('p',`${slot.date} ${slot.time} · ${b.quote.type==='amount'?'NT$ '+b.quote.amount:'現場評估'}`));
  if(b.assisted)row.append(el('p',({line:'LINE',phone:'電話',onsite:'現場'}[b.assisted.channel]||'人工')+' · '+b.assisted.reference));
  if(b.status==='PENDING')row.append(el('p','請於下一營業日結束前完成確認；仍未確認請取消並釋出時段。例假日由人員調整。'+(b.pendingReviewAt?' 一般截止：'+new Date(b.pendingReviewAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'')));
  if(b.status==='PENDING')button(row,'確認 '+b.id,()=>save('/api/manage/bookings/'+b.id+'/confirm',{}),'btn primary');
  if(b.endedAt)row.append(el('p','服務已結束；資料於結束後保留 90 天。'));
  if(b.status==='CONFIRMED'&&!b.endedAt&&Date.parse(slot.date+'T'+slot.time+':00+08:00')<=Date.now())button(row,'記錄服務已結束',()=>{if(confirm('確認此筆服務已實際結束？資料將於 90 天後刪除。'))return save('/api/manage/bookings/'+b.id+'/end',{});});
  if(b.status!=='CANCELLED'&&!b.endedAt){const sel=field(row,'改至時段','',{options:data.slots.filter(x=>x.status==='OPEN').map(x=>[x.id,x.date+' '+x.time])});button(row,'更改時段',()=>save('/api/manage/bookings/'+b.id+'/change',{slotId:sel.value})).disabled=!sel.options.length;button(row,'取消 '+b.id,()=>{if(confirm('取消後會釋出時段，確定取消？'))return save('/api/manage/bookings/'+b.id+'/cancel',{});});}bookings.append(row);}
 renderDailySlots();
 const services=$('#serviceRows');services.replaceChildren();for(const service of data.services)services.append(serviceEditor(service));
 const newService=$('#newService');newService.replaceChildren(serviceEditor());
 renderVehicles();
 renderContent();
}

const taipeiDate=(offset=0)=>new Date(Date.now()+offset).toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'});
const slotGridTimes=()=>{const rows=[];for(let hour=9;hour<18;hour++)for(const minute of ['00','30'])if(hour!==12)rows.push(String(hour).padStart(2,'0')+':'+minute);return rows;};
function renderDailySlots(){
 const date=$('#slotDate'),editor=$('#slotDayEditor'),history=$('#slotHistory'),today=taipeiDate(),max=taipeiDate(365*86400000);
 date.min=today;date.max=max;if(!slotDate||slotDate<today)slotDate=today;date.value=slotDate;date.onchange=()=>{slotDate=date.value;slotDraftDate='';renderDailySlots();};
 const rows=data.slots.filter(slot=>slot.date===slotDate),byTime=new Map(rows.map(slot=>[slot.time,slot])),persisted=slotDayState(data.slots,slotDate,[],Date.now()).persisted;
 if(slotDraftDate!==slotDate){slotSelection=new Set(persisted);slotDraftDate=slotDate;}
 const view=slotDayState(data.slots,slotDate,slotSelection,Date.now());slotSelection=new Set(view.proposed);
 editor.replaceChildren();const legend=el('div',null,'slot-legend');legend.setAttribute('aria-label','時段狀態圖例');for(const [symbol,label,kind] of [['✓','開啟','open'],['○','關閉','closed'],['🔒','已鎖定（有預約，不可更改）','locked']])legend.append(el('span',symbol+' '+label,'slot-legend-item '+kind));editor.append(legend);
 const summaries=el('div',null,'slot-summaries'),formal=el('section',null,'slot-summary persisted');formal.append(el('h3',`正式已儲存開放時段（${view.persisted.length}）`),el('p',view.persisted.length?view.persisted.join('、'):'此日期目前沒有正式開放時段。'));summaries.append(formal);
 const proposed=el('section',null,'slot-summary draft'+(view.dirty?' unsaved':''));if(view.dirty)proposed.append(el('h3','尚有未儲存變更'),el('p',`儲存後預計開放（${view.proposed.length}）：${view.proposed.length?view.proposed.join('、'):'無'}`));else proposed.append(el('h3','目前沒有未儲存變更'),el('p','畫面選擇與正式已儲存狀態一致。'));summaries.append(proposed);editor.append(summaries);
 const grid=el('div',null,'slot-grid');grid.setAttribute('aria-label',slotDate+' 可預約開始時間');
 for(const time of slotGridTimes()){
  const slot=byTime.get(time),past=Date.parse(slotDate+'T'+time+':00+08:00')<=Date.now(),cue=slotCue(slot,slotSelection.has(time),past),b=el('button',`${cue.symbol} ${time} · ${cue.kind==='locked'?(names[slot.status]||cue.label):cue.label}`,'slot-choice '+cue.kind);b.type='button';b.disabled=cue.kind==='locked'||cue.kind==='past';b.setAttribute('aria-pressed',String(slotSelection.has(time)));b.setAttribute('aria-label',`${time} ${cue.label}`);b.onclick=()=>{slotSelection.has(time)?slotSelection.delete(time):slotSelection.add(time);renderDailySlots();};grid.append(b);
 }
 editor.append(grid);const locked=rows.filter(slot=>slot.bookingId||!['OPEN','CLOSED'].includes(slot.status));if(locked.length)editor.append(el('p','已占用時段已鎖定：'+locked.map(slot=>slot.time+' '+names[slot.status]).join('、'),'muted'));
 const irregular=rows.filter(slot=>!slotGridTimes().includes(slot.time));if(irregular.length)editor.append(el('p','既有非半點時段保留：'+irregular.map(slot=>slot.time+' '+names[slot.status]).join('、'),'muted'));
 history.replaceChildren();const hidden=data.slots.filter(slot=>slot.status==='CLOSED'||slot.date<today);if(!hidden.length)history.textContent='目前沒有過去或暫停開放時段。';else for(const slot of hidden){const row=el('div',`${slot.date} ${slot.time} · ${names[slot.status]}`,'admin-row');history.append(row);}
}
$('#saveSlotDay').onclick=act(async()=>{if(!slotDate)throw Error('請先選擇日期。');const button=$('#saveSlotDay');button.disabled=true;try{const result=await api('/api/manage/slots/day',{date:slotDate,openTimes:[...slotSelection].sort(),revision:data.revision});await load({resetSlotDraft:true});$('#message').textContent=result.protectedSlots.length?'已儲存並重新載入正式狀態；有預約的時段仍保持鎖定。':'已儲存並重新載入正式狀態。';}catch(error){if(error.status===409){await load({resetSlotDraft:true});throw Error('資料已在其他操作中更新；已重新載入正式狀態，請重新確認。');}throw error;}finally{button.disabled=false;}});

function vehicleEditor(vehicle){
 const form=el('form',null,'vehicle-editor'),brand=field(form,'品牌',vehicle?.brand||''),model=field(form,'車款',vehicle?.model||''),length=field(form,'車長（mm）',vehicle?.lengthMm||'',{type:'number'}),kind=field(form,'類別',vehicle?.kind||'passenger',{options:[['passenger','乘用車'],['mpv','MPV'],['van','商用廂型車']]}),override=field(form,'ZERO 指定分類',vehicle?.ownerOverrideTier||'',{options:[['','依自動規則'],...Object.entries(tiers)]});
 for(const input of [brand,model,length])input.required=true;length.min='2000';length.max='8000';length.step='1';
 const submit=el('button',vehicle?'儲存此車款':'新增車款','btn primary');submit.type='submit';form.append(submit);
 const payload=enabled=>({id:vehicle?.id,brand:brand.value,model:model.value,lengthMm:Number(length.value),kind:kind.value,override:override.value,enabled});
 form.onsubmit=act(()=>save('/api/manage/vehicle',payload(vehicle?vehicle.enabled!==false:true)));
 if(vehicle){const toggle=button(form,vehicle.enabled===false?'恢復啟用':'停用車款',()=>{if(vehicle.enabled!==false&&!confirm('停用後，此車款不再接受新報價或預約；歷史預約仍保留。確定停用？'))return;return save('/api/manage/vehicle',payload(vehicle.enabled===false));});toggle.classList.add('secondary');}
 return form;
}
function renderVehicles(){
 const filter=$('#vehicleFilter'),rows=$('#vehicleRows'),newVehicle=$('#newVehicle'),brands=[...new Set(data.vehicles.map(vehicle=>vehicle.brand))].sort((a,b)=>a.localeCompare(b));filter.replaceChildren();
 const search=field(filter,'搜尋品牌或車款',vehicleSearch),brand=field(filter,'品牌',vehicleBrand,{options:[['','全部品牌'],...brands.map(name=>[name,name])]});search.placeholder='例如 Tesla、Model Y';
 function draw(){vehicleSearch=search.value.trim();vehicleBrand=brand.value;rows.replaceChildren();let matches=data.vehicles.filter(vehicle=>(!vehicleBrand||vehicle.brand===vehicleBrand)&&(!vehicleSearch||(vehicle.brand+' '+vehicle.model).toLocaleLowerCase().includes(vehicleSearch.toLocaleLowerCase())));
  if(!vehicleBrand&&!vehicleSearch){rows.append(el('p',`共 ${data.vehicles.length} 筆車款；請選擇品牌或輸入搜尋。`));const choices=el('div',null,'brand-choices');for(const name of brands){const count=data.vehicles.filter(vehicle=>vehicle.brand===name).length;button(choices,`${name}（${count}）`,()=>{brand.value=name;draw();});}rows.append(choices);return;}
  if(!matches.length){rows.textContent='找不到符合條件的車款。';return;}
  rows.append(el('p',`顯示 ${matches.length} 筆車款。`));for(const vehicle of matches){const box=el('details',null,'panel');box.append(el('summary',vehicle.brand+' '+vehicle.model+(vehicle.enabled===false?' · 已停用':'')),vehicleEditor(vehicle));rows.append(box);}
 }
 search.oninput=draw;brand.onchange=draw;newVehicle.replaceChildren(vehicleEditor());draw();
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
$('#contentForm').onsubmit=act(async()=>{const saved=await api('/api/manage/content',{revision:data.revision,content:draft});await load();if(JSON.stringify(data.content)!==JSON.stringify(saved.content))throw Error('案例資料未能確認為最新狀態，請重新載入。');$('#message').textContent='案例與連結已儲存並確認為最新狀態。';});
$('#login').onsubmit=act(async e=>{csrf=(await api('/api/admin/login',{password:e.target.elements.password.value})).csrf;e.target.reset();await load();$('#message').textContent='已登入。';});
$('#reload').onclick=act(load);$('#logout').onclick=act(async()=>{await api('/api/admin/logout',{});location.reload();});
try{csrf=(await api('/api/admin/session')).csrf;await load();}catch{}

function renderManualBooking(){
 const host=$('#manualBooking');host.replaceChildren();const form=el('form');host.append(form);
 form.append(el('p','建立後先等待確認，立即占用同一份預約看板的時段；確認完成後請使用看板的確認按鈕。'));
 const channel=field(form,'客人來源','line',{options:[['line','LINE'],['phone','電話'],['onsite','現場']]}),reference=field(form,'辨識稱呼（僅管理人員可見）','',{max:80});reference.required=true;
 form.append(el('p','填寫足以對應對話的稱呼即可，請勿填寫敏感個資。找不到或不確定車款時，先確認車款資料，不套用猜測價格。'));
 const availableVehicles=data.vehicles.filter(v=>v.enabled!==false),brand=field(form,'品牌','',{options:[['','請選擇品牌'],...[...new Set(availableVehicles.map(v=>v.brand))].map(b=>[b,b])]}),vehicle=field(form,'車款','',{options:[['','請先選品牌']]}),scope=el('p');form.append(scope);
 const service=field(form,'服務','',{options:[['','請選擇服務'],...data.services.filter(s=>s.enabled!==false).map(s=>[s.id,s.name])]}),slot=field(form,'開放時段','',{options:[['','請選擇時段'],...data.slots.filter(s=>s.status==='OPEN'&&!s.bookingId&&Date.parse(s.date+'T'+s.time+':00+08:00')>Date.now()).map(s=>[s.id,s.date+' '+s.time])]}),quote=el('p');quote.setAttribute('role','status');form.append(quote);
 for(const input of [brand,vehicle,service,slot])input.required=true;
 const submit=el('button','建立待確認需求','btn primary');submit.type='submit';submit.disabled=true;form.append(submit);let version=0;
 async function update(){const current=++version;submit.disabled=true;const selected=data.vehicles.find(v=>v.id===vehicle.value);scope.textContent=selected?.applicability?.replace(/^\d{4}-\d{2}-\d{2} 查證規格；/,'')||'';if(selected?.sourceVariants?.length)scope.textContent+=' 適用：'+selected.sourceVariants.join('／');if(!vehicle.value||!service.value){quote.textContent='選擇車款與服務後顯示基準價格。';return;}try{const q=await api('/api/manage/quote',{vehicleId:vehicle.value,serviceId:service.value});if(version!==current)return;quote.textContent=(tiers[q.tier]||'')+' · '+(q.type==='amount'?'NT$ '+q.amount:'現場評估')+' · '+q.note;submit.disabled=!slot.value;}catch(e){if(version===current)quote.textContent=e.message;}}
 brand.onchange=()=>{vehicle.replaceChildren(new Option('請選擇車款',''),...availableVehicles.filter(v=>v.brand===brand.value).map(v=>new Option(v.model,v.id)));vehicle.disabled=!brand.value;update();};vehicle.disabled=true;vehicle.onchange=update;service.onchange=update;slot.onchange=update;update();
 form.onsubmit=act(async()=>{submit.disabled=true;try{const result=await api('/api/manage/bookings',{channel:channel.value,reference:reference.value,vehicleId:vehicle.value,serviceId:service.value,slotId:slot.value});await load();$('#message').textContent='已建立 '+result.id+'，等待確認；時段已同步保留。';}finally{if(form.isConnected)await update();}});
}
