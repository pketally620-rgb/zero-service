// Presentation-only substitutions for the explicit canonical production mode.
// Private previews retain their existing safety notices.
const replacements = {
  'index.html': [
    ['預覽體驗 · 資料僅供審查 · 不接受正式預約', '預約需求送出後，須由 ZERO 人員確認'],
    ['時段以台灣時間顯示。此預覽不接受正式預約。', '時段以台灣時間顯示。可預約時段由人員開放。'],
    ['示範操作請勿將預約資料送給官方帳號。', '透過官方 LINE 聯繫 ZERO，確認您的預約需求。'],
    ['網站體驗版 · 非正式預約服務', 'ZERO 職人 · 預約服務']
  ],
  'app.mjs': [
    ['ZERO 示範資料・請勿送出', 'ZERO 預約需求'],
    ['此為示範操作，請勿實際送出訊息。', '請確認資料後送出訊息，等待 ZERO 人員確認。'],
    ['示範資料請勿實際送出。', '']
  ],
  'admin.html': [['受控預覽：目前皆為測試資料，不會接受正式預約。', '請依實際營業安排管理服務與開放時段。']]
};
export function productionText(name, text) {
  for (const [before, after] of replacements[name] || []) text = text.replaceAll(before, after);
  return text;
}
