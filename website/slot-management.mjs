import {requireValue} from './validation.mjs';

const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const halfHourPattern=/^([01]\d|2[0-3]):(00|30)$/;
const instant=(date,time)=>Date.parse(date+'T'+time+':00+08:00');

export function saveDailySlots(state,{date,openTimes},now){
 requireValue(datePattern.test(date)&&Array.isArray(openTimes)&&openTimes.length<=48,'日期或時間格式不正確。');
 requireValue(openTimes.every(time=>halfHourPattern.test(time))&&new Set(openTimes).size===openTimes.length,'時間必須是整點或半點，且不可重複。');
 const day=instant(date,'00:00');
 requireValue(Number.isFinite(day)&&day>=instant(new Date(now).toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'}),'00:00')&&day<now+366*86400000,'請選擇一年內的今天或未來日期。');
 for(const time of openTimes)requireValue(instant(date,time)>now,'只能開放尚未開始的時間。');
 const selected=new Set(openTimes),protectedSlots=[];
 for(const slot of state.slots.filter(slot=>slot.date===date)){
  if(slot.bookingId||!['OPEN','CLOSED'].includes(slot.status)){protectedSlots.push({id:slot.id,time:slot.time,status:slot.status});continue;}
  if(instant(slot.date,slot.time)<=now)continue;
  slot.status=selected.has(slot.time)?'OPEN':'CLOSED';
 }
 for(const time of openTimes){
  if(state.slots.some(slot=>slot.date===date&&slot.time===time))continue;
  state.slots.push({id:date+'-'+time,date,time,status:'OPEN',bookingId:null});
 }
 state.slots.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const persistedOpenTimes=state.slots.filter(slot=>slot.date===date&&slot.status==='OPEN'&&!slot.bookingId&&instant(slot.date,slot.time)>now).map(slot=>slot.time).sort();
 return {date,openTimes:persistedOpenTimes,protectedSlots};
}
