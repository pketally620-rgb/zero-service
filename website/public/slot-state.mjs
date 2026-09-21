const instant=(date,time)=>Date.parse(date+'T'+time+':00+08:00');
const locked=slot=>!!(slot&&(slot.bookingId||!['OPEN','CLOSED'].includes(slot.status)));

export function officialOpenTimes(slots,date,now=Date.now()){
 return slots.filter(slot=>slot.date===date&&slot.status==='OPEN'&&!slot.bookingId&&instant(slot.date,slot.time)>now).map(slot=>slot.time).sort();
}

export function slotDayState(slots,date,selection,now=Date.now()){
 const persisted=officialOpenTimes(slots,date,now),lockedTimes=new Set(slots.filter(slot=>slot.date===date&&locked(slot)).map(slot=>slot.time));
 const proposed=[...new Set(selection)].filter(time=>!lockedTimes.has(time)&&instant(date,time)>now).sort();
 return {persisted,proposed,dirty:persisted.length!==proposed.length||persisted.some((time,index)=>time!==proposed[index])};
}

export function slotCue(slot,selected,past){
 if(locked(slot))return {kind:'locked',symbol:'🔒',label:'已鎖定'};
 if(past)return {kind:'past',symbol:'—',label:'已過期'};
 return selected?{kind:'open',symbol:'✓',label:'開啟'}:{kind:'closed',symbol:'○',label:'關閉'};
}
