// R2: browser-safe helpers only; private fixtures remain in core.mjs on the server.
export const LINE_ACCOUNT_ID = '@udu6260e';
export const LINE_PROFILE_URL = 'https://lin.ee/y8kjBXa';
export const brandsFor = vehicles => [...new Set(vehicles.map(v => v.brand))];
export const modelsFor = (vehicles, brand) => vehicles.filter(v => v.brand === brand);
// LINE official URL scheme: direct OA chat + UTF-8 percent-encoded draft, never automatic sending.
export function lineHandoffUrl(summary, account = LINE_ACCOUNT_ID) {
  return `https://line.me/R/oaMessage/${encodeURIComponent(account)}/?${encodeURIComponent(summary)}`;
}

// Presentation only: no transition or booking mutation.
export function bookingWording(booking) {
  if (booking.endedAt) return {status:'服務已結束',detail:'如有後續問題，請聯繫 ZERO。',change:null,cancel:null,lineAction:'前往 LINE 聯繫 ZERO',lineNote:'可透過官方 LINE 聯繫 ZERO。'};
  if (booking.status === 'CONFIRMED') return {
    status:'預約已確認', detail:'ZERO 人員已確認此預約。',
    change:'申請改期', cancel:'申請取消預約', slotLabel:'希望改至的時段',
    actionNote:'更改時段後需重新確認；此處取消會立即生效並釋出原時段。',
    lineAction:'前往 LINE 聯繫 ZERO', lineNote:'預約已確認。如需向 ZERO 補充資料，可透過 LINE 聯繫。'
  };
  if (booking.status === 'CANCELLED') return {
    status:booking.history?.at(-2)==='PENDING → CONFIRMED'?'預約已取消':'預約需求已撤回',
    detail:'此筆需求已結束，原時段已釋出。', change:null, cancel:null, lineAction:null
  };
  return {
    status:'預約需求已送出', detail:'等待 ZERO 人員透過官方 LINE 確認，尚未成立正式預約。下一營業日結束仍未確認，將由人員撤回並釋出時段。',
    change:'更改申請時段', cancel:'撤回預約需求', slotLabel:'希望申請的時段',
    actionNote:'更改後仍需 ZERO 人員確認；撤回後會釋出時段。',
    lineAction:'前往 LINE 完成確認', lineNote:'前往 LINE 後，確認已帶入的預約資料再送出，等待 ZERO 人員確認。'
  };
}

export function openSlotSelection(slots,date='') {
 const open=slots.filter(s=>s.status==='OPEN').slice().sort((a,b)=>(a.date+' '+a.time).localeCompare(b.date+' '+b.time));
 const dates=[...new Set(open.map(s=>s.date))];
 return {dates,date:dates.includes(date)?date:'',times:open.filter(s=>s.date===date)};
}
