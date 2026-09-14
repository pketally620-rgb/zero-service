import { brandsFor, modelsFor, lineHandoffUrl, LINE_PROFILE_URL, bookingWording } from './ux.mjs';
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat('zh-TW',{style:'currency',currency:'TWD',maximumFractionDigits:0}).format(n);
const stateNames={OPEN:'可申請',PENDING:'等待 ZERO 人員確認',CONFIRMED:'預約已確認',CANCELLED:'已結束',CLOSED:'暫停開放'};
let catalog, currentBooking, timer, priceRevision=0;
async function api(path,body){const r=await fetch(path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(`${r.status} · ${d.error}`);return d;}
function toast(text){$('#toast').textContent=text;clearTimeout(timer);timer=setTimeout(()=>$('#toast').textContent='',6000);}
function action(fn){return async e=>{e?.preventDefault();try{await fn(e);}catch(error){toast(/^\d{3} ·/.test(error.message)?(/slot not open|new slot not open/.test(error.message)?'這個時段目前無法申請，請選擇其他時間。':'操作未完成，請稍後再試。'):error.message);}};}
function options(el,rows,label){const old=el.value;el.replaceChildren(...rows.map(x=>new Option(label(x),x.id)));if(rows.some(x=>x.id===old))el.value=old;}
async function refresh(){catalog=await api('/api/catalog');options($('#service'),catalog.services,x=>x.name);renderVehicleSelectors();options($('#adminVehicle'),catalog.vehicles,x=>`${x.brand} ${x.model}`);options($('#adminSlot'),catalog.slots,x=>`${x.date} ${x.time} · ${stateNames[x.status]}`);$('#adminPrice').value=catalog.services[0].prices.mid;$('#session').textContent=`目前身分：${catalog.actor.type==='customer'?'Customer '+catalog.actor.customerId:catalog.actor.type==='owner'?'Owner':'Public'}`;vehicleFields();renderSlots();await renderPrice();}
function modelOptions(selectedId='') {
  const brand=$('#brand').value;
  const model=$('#vehicle');
  model.replaceChildren(new Option(brand?'請選擇車款':'請先選擇品牌',''),...modelsFor(catalog.vehicles,brand).map(v=>new Option(v.model,v.id)));
  model.disabled=!brand;
  if(modelsFor(catalog.vehicles,brand).some(v=>v.id===selectedId))model.value=selectedId;
}
function renderVehicleSelectors(){
  const brand=$('#brand'), oldBrand=brand.value, oldModel=$('#vehicle').value;
  brand.replaceChildren(new Option('請選擇品牌',''),...brandsFor(catalog.vehicles).map(name=>new Option(name,name)));
  if(brandsFor(catalog.vehicles).includes(oldBrand))brand.value=oldBrand;
  modelOptions(oldModel);
}
async function renderPrice(){
  const revision=++priceRevision, vehicleId=$('#vehicle').value, serviceId=$('#service').value;
  const box=$('#price');
  if(!vehicleId){box.textContent=$('#brand').value?'選擇車款後，顯示適用價格。':'先選品牌，再選車款。';$('#rule').textContent='';return;}
  box.textContent='正在更新價格…';$('#rule').textContent='';
  const q=await api('/api/quote',{vehicleId,serviceId});
  if(revision!==priceRevision)return;
  box.replaceChildren();const tier=document.createElement('div');tier.className='small muted';tier.textContent=catalog.tierLabels[q.tier]+' · 基準價格';
  const amount=document.createElement('div');amount.className='amount';amount.textContent=q.type==='amount'?money(q.amount):'現場評估';
  const note=document.createElement('p');note.className='small muted';note.textContent=q.note;box.append(tier,amount,note);
  $('#rule').textContent='自動分類：'+catalog.tierLabels[q.autoTier]+(catalog.vehicles.find(x=>x.id===vehicleId).ownerOverrideTier?' → ZERO 核定分類：'+catalog.tierLabels[q.tier]:'');
}

function renderSlots(){$('#vehicleRequired').hidden=!!$('#vehicle').value;const box=$('#slots');box.replaceChildren();for(const slot of catalog.slots){const b=document.createElement('button');b.className='slot';b.disabled=slot.status!=='OPEN'||!$('#vehicle').value;const title=document.createElement('b');title.textContent=`${slot.date.slice(5).replace('-','/')} ${slot.time}`;const status=document.createElement('small');status.textContent=stateNames[slot.status];b.append(title,status);b.onclick=action(async()=>{if(!$('#vehicle').value)throw Error('請先選擇品牌與車款。');if(currentBooking && currentBooking.status!=='CANCELLED')throw Error('已有處理中的需求，請在下方摘要中更改時段或結束這筆需求。');currentBooking=await api('/api/bookings',{slotId:slot.id,vehicleId:$('#vehicle').value,serviceId:$('#service').value});await refresh();renderBooking();});box.append(b);}}
function summaryText(b){const slot=catalog.slots.find(s=>s.id===b.slotId);return `【ZERO 示範資料・請勿送出】\n編號：${b.id}\n服務：${b.serviceName}\n車款：${b.vehicleName}\n分類：${catalog.tierLabels[b.quote.tier]}\n送出時基準價：${b.quote.type==='amount'?money(b.quote.amount):'現場評估'}\n時段：${slot.date} ${slot.time}\n狀態：${bookingWording(b).status}\n${bookingWording(b).detail}`;}
function renderBooking(){const b=currentBooking,copyText=bookingWording(b),box=$('#summary');box.innerHTML='<h3>你的預約摘要</h3>';const status=document.createElement('span');status.className='status';status.textContent=copyText.status;const ta=document.createElement('textarea');ta.rows=9;ta.readOnly=true;ta.setAttribute('aria-label','LINE 預約摘要');ta.value=summaryText(b);const detail=document.createElement('p');detail.className='small muted';detail.textContent=copyText.detail;box.append(status,detail,ta);const note=document.createElement('p');note.className='small muted';note.textContent=b.status==='CANCELLED'?'如需安排其他時間，請重新選擇時段。':'金額保留送出時的基準價。'+copyText.lineNote;box.append(note);
if(b.status!=='CANCELLED'){
  const actions=document.createElement('div');actions.className='actions';
  const line=document.createElement('a');line.id='lineHandoff';line.className='btn primary';line.href=lineHandoffUrl(ta.value);line.target='_blank';line.rel='noopener noreferrer';line.textContent='前往 LINE 完成確認';actions.append(line);box.append(actions);
  const guide=document.createElement('p');guide.className='small muted';guide.textContent='此為示範操作，請勿實際送出訊息。';box.append(guide);
  const fallback=document.createElement('details');const heading=document.createElement('summary');heading.textContent='LINE 沒有自動帶入預約資料？';fallback.append(heading);
  const help=document.createElement('p');help.className='small muted';help.textContent='若 LINE 對話框沒有預約資料，請按下方按鈕，再於 ZERO 官方 LINE 貼上資料，確認後送出。';fallback.append(help);
  const copy=document.createElement('button');copy.id='lineFallback';copy.className='btn';copy.textContent='複製並開啟 LINE';
  const feedback=document.createElement('p');feedback.className='small';feedback.setAttribute('role','status');
  copy.onclick=async()=>{
    try{
      await navigator.clipboard.writeText(ta.value);
      const next=window.open(LINE_PROFILE_URL,'_blank');if(next)next.opener=null;
      feedback.textContent='預約內容已複製。請在 ZERO 官方 LINE 對話框貼上，確認後送出。示範資料請勿實際送出。';
      if(!next){const reopen=document.createElement('a');reopen.className='btn';reopen.href=LINE_PROFILE_URL;reopen.target='_blank';reopen.rel='noopener noreferrer';reopen.textContent='LINE 未開啟？按此繼續';feedback.append(reopen);}
    }catch(error){feedback.textContent='尚未成功複製預約資料，請重試，或使用「前往 LINE 完成確認」。';}
  };
  fallback.append(copy,feedback);box.append(fallback);
}
if(b.status==='CANCELLED')return;const actionNote=document.createElement('p');actionNote.className='small muted';actionNote.textContent=copyText.actionNote;box.append(actionNote);const label=document.createElement('label');label.textContent=copyText.slotLabel;const changeSelect=document.createElement('select');changeSelect.id='changeSlot';options(changeSelect,catalog.slots.filter(s=>s.status==='OPEN'),s=>`${s.date} ${s.time}`);label.append(changeSelect);box.append(label);const change=document.createElement('button');change.className='btn';change.textContent=copyText.change;change.disabled=!changeSelect.options.length;change.onclick=action(async()=>{currentBooking=await api(`/api/bookings/${b.id}/change`,{slotId:changeSelect.value,capability:b.capability});await refresh();renderBooking();});const cancel=document.createElement('button');cancel.className='btn';cancel.textContent=copyText.cancel;cancel.onclick=action(async()=>{currentBooking=await api(`/api/bookings/${b.id}/cancel`,{capability:b.capability});await refresh();renderBooking();});const end=document.createElement('div');end.className='actions';end.append(change,cancel);box.append(end);}
function vehicleFields(){const v=catalog.vehicles.find(x=>x.id===$('#adminVehicle').value);$('#lengthMm').value=v.lengthMm;$('#kind').value=v.kind;$('#override').value=v.ownerOverrideTier||'';}
async function managed(path,body,message){await api(path,body);await refresh();$('#adminStatus').textContent=message;toast(message);}
$('#service').onchange=action(renderPrice);
$('#vehicle').onchange=action(async()=>{renderSlots();await renderPrice();});
$('#brand').onchange=action(async()=>{modelOptions();renderSlots();await renderPrice();});
for(const el of document.querySelectorAll('[data-service]'))el.onclick=action(async()=>{$('#service').value=el.dataset.service;await renderPrice();location.hash='pricing';});
$('#adminVehicle').onchange=vehicleFields;
$('#savePrice').onclick=action(()=>managed('/api/manage/price',{price:Number($('#adminPrice').value)},'價格已儲存；既有預約基準價不變。'));
$('#saveSlot').onclick=action(()=>managed('/api/manage/slot',{slotId:$('#adminSlot').value,open:$('#slotOpen').value==='true'},'時段狀態已儲存。'));
$('#saveVehicle').onclick=action(()=>managed('/api/manage/vehicle',{vehicleId:$('#adminVehicle').value,lengthMm:Number($('#lengthMm').value),kind:$('#kind').value,override:$('#override').value},'車輛資料已儲存，價格分類已更新。'));
async function clearPrivate(){catalog=null;$('#profile').replaceChildren();$('#security').textContent='身分已變更，先前資料已清除。';$('#bookingList').replaceChildren();await refresh();}
$('#identity').onchange=()=>$('#password').value=$('#identity').value==='A'?'proof-a':'proof-b';
$('#customerLogin').onsubmit=action(async()=>{await api('/api/login',{identity:$('#identity').value,password:$('#password').value});await clearPrivate();const customer=await api(`/api/customers/${catalog.actor.customerId}`);const box=$('#profile');const title=document.createElement('h3');title.textContent=customer.displayName;const warranty=document.createElement('p');warranty.className='small muted';warranty.textContent=customer.warranty;box.append(title,warranty);for(const name of customer.vehicles){const v=catalog.vehicles.find(x=>`${x.brand} ${x.model}`===name);if(!v)continue;const b=document.createElement('button');b.className='btn';b.textContent=`用 ${name} 預約`;b.onclick=action(async()=>{$('#brand').value=v.brand;modelOptions(v.id);renderSlots();await renderPrice();location.hash='booking';});box.append(b);}toast('已登入，選已儲存車輛即可預約。');});
async function logout(){await api('/api/logout',{});await clearPrivate();}
$('#logout').onclick=$('#publicPersona').onclick=action(logout);
$('#ownerLogin').onclick=action(async()=>{await api('/api/login',{identity:'owner',password:'proof-owner'});await clearPrivate();await bookingList();toast('已進入本機 Owner 測試身分。');});
async function bookingList(){const rows=await api('/api/manage/bookings');const box=$('#bookingList');box.replaceChildren();if(!rows.length)box.textContent='尚無預約需求。';for(const b of rows){const row=document.createElement('div');row.className='bookingrow';const info=document.createElement('p');info.textContent=`${b.id} · ${b.vehicleName} · ${b.slotId} · ${stateNames[b.status]} · ${b.quote.type==='amount'?money(b.quote.amount):'現場評估'}`;row.append(info);if(b.status==='PENDING'){const confirm=document.createElement('button');confirm.className='btn primary';confirm.textContent=`確認 ${b.id}`;confirm.onclick=action(async()=>{const next=await api(`/api/bookings/${b.id}/confirm`,{});if(currentBooking?.id===b.id)currentBooking=next;await refresh();if(currentBooking)renderBooking();await bookingList();});row.append(confirm);}if(['PENDING','CONFIRMED'].includes(b.status)){const cancel=document.createElement('button');cancel.className='btn';cancel.textContent='取消 '+b.id;cancel.onclick=action(async()=>{const next=await api('/api/bookings/'+b.id+'/cancel',{});if(currentBooking?.id===b.id)currentBooking=next;await refresh();if(currentBooking)renderBooking();await bookingList();});row.append(cancel);}box.append(row);}}
$('#refreshBookings').onclick=action(bookingList);
for(const b of document.querySelectorAll('[data-target]'))b.onclick=async()=>{try{$('#security').textContent=JSON.stringify(await api(`/api/customers/${b.dataset.target}`),null,2);}catch(e){$('#security').textContent=`ACCESS DENIED — ${e.message}`;}};
await refresh();
