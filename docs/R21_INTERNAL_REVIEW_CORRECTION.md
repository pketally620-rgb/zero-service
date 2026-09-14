# R2.1 — Internal Review Miss Correction

Status: **Engineering self-review complete; returned to 00W Independent Review. Not Owner UAT approval.**

Classification: INTERNAL REVIEW MISS / NOT NEW OWNER REQUIREMENT.
Authority: 03 Root.3. Mission: Issue #2, latest 00W R2.1 comment (5658173327).
Branch: `proof/product-technical-proof-r1`.
Parent candidate: `21785de547f240769796965e42fc38940335ec85`.
Exact new commit is in the Issue #2 return comment and local R21 receipt.

## Exact wording changes

| Affected surface | Final wording / change |
|---|---|
| Pending status | 預約需求已送出 |
| Pending explanation, including LINE draft | 等待 ZERO 人員確認，尚未成立正式預約。 |
| Pending time action | 更改申請時段 |
| Pending withdrawal | 撤回預約需求 |
| Pending time label | 希望申請的時段 |
| Pending action explanation | 更改後仍需 ZERO 人員確認；撤回後會釋出時段。 |
| Confirmed status | 預約已確認 |
| Confirmed explanation, including LINE draft | ZERO 人員已確認此預約。 |
| Confirmed actions | 申請改期 / 申請取消預約 |
| Confirmed time label | 希望改至的時段 |
| Confirmed action explanation | 更改時段後需重新確認；此處取消會立即生效並釋出原時段。 |
| Confirmed LINE context | 預約已確認。如需向 ZERO 補充資料，可透過 LINE 聯繫。 |
| Withdrawn pending request | 預約需求已撤回 |
| Cancelled confirmed booking | 預約已取消 |
| Terminal explanation | 此筆需求已結束，原時段已釋出。 |
| Terminal next step | 如需安排其他時間，請重新選擇時段。 |
| Fallback disclosure | LINE 沒有自動帶入預約資料？ |
| Fallback explanation | 若 LINE 對話框沒有預約資料，請按下方按鈕，再於 ZERO 官方 LINE 貼上資料，確認後送出。 |
| Fallback button | 複製並開啟 LINE (unchanged) |
| Fallback success | 預約內容已複製。請在 ZERO 官方 LINE 對話框貼上，確認後送出。示範資料請勿實際送出。 |
| Fallback failure | 尚未成功複製預約資料，請重試，或使用「前往 LINE 完成確認」。 |
| Reopen link | LINE 未開啟？按此繼續 |
| Normal demo reminder | 此為示範操作，請勿實際送出訊息。 |
| LINE draft header | 【ZERO 示範資料・請勿送出】 |

Removed rendered history such as `OPEN → PENDING` entirely from the customer summary; stored history is unchanged. Removed `(PENDING)` / `(CONFIRMED)` from LINE text. The fixed primary action **前往 LINE 完成確認** remains as explicitly required; confirmed-state surrounding text now acknowledges that confirmation already occurred.

Adjacent wording within the affected journey: customer page title/banner/footer use 網站體驗版 / 非正式預約服務; the pricing disclaimer is 此處為示範車款與金額，不代表正式報價。; displayed Owner classification becomes ZERO 核定分類. Customer HTTP error feedback no longer echoes raw HTTP/error codes. Clearly labeled review/admin/security demonstrations retain their existing internal evidence terminology; their scope and behavior are not reopened.

## Engineering self-review

1. **Internal/debug terminology:** Read rendered booking summary plus textarea value and decoded LINE URL. Pending sample PB-007 contained no OPEN/PENDING/CONFIRMED/CANCELLED, transition arrows, Proof, Owner, 電腦版 or 預填. Internal values remain in code/tests/history only, with admin evidence preserved. Customer demo markings remain explicit in Chinese.
2. **State consistency:** Pending has only pending request actions. Confirmed has confirmed actions. Changing a confirmed slot returns to pending labels. Withdrawing pending (including after a confirmed booking was changed) displays 預約需求已撤回. Directly cancelling confirmed displays 預約已取消. Neither terminal state shows LINE/change/cancel actions.
3. **Fallback leakage:** Disclosure remains collapsed by default. Normal explanation is about the customer's next step. The fallback copy contains no platform/clipboard/API/URL-scheme explanation. Technical LINE platform limitations remain documented in the existing R2 engineering report, not restated in the normal journey.
4. **Contradictions:** Removed the unconditional statement that a confirmed reservation still awaits staff confirmation. Existing immediate cancellation behavior is disclosed before the confirmed action; no new pending-cancellation state is implied. Demo warnings continue to distinguish simulated confirmation from a real service booking.

Self-review result: **PASS for the affected customer wording**, subject to 00W independent review. No claim of approval for unrelated surfaces or native mobile LINE capability.

## Proportionate validation

- `node --test proof/r21-tests.mjs proof/r2-tests.mjs proof/api-tests.mjs`: **7 groups passed, 0 failed**.
- `node proof/tests.mjs`: **PASS**.
- New regression drives the existing BookingStore through request → confirm → change → withdraw, plus confirm → cancel; checks wording follows actual transitions and slots reopen. No changes to the state machine.
- Browser: Toyota → Corolla Cross → pending PB-006 → 更改申請時段 → owner confirm → 申請取消預約 → 預約已取消. Confirmed draft states that ZERO already confirmed.
- Browser: Porsche → Cayenne → pending PB-007 → 撤回預約需求 → 預約需求已撤回; mobile wrapper operated.
- Browser: Tesla → Model Y → PB-008 → owner confirm → 申請改期 → pending wording → 撤回預約需求. No errors in the checked browser console.
- Updated draft and encoded LINE URL inspected directly. Fallback click showed success guidance and opened the verified ZERO profile. The clipboard inspection tool returned an older R2 item in this run, so this report does **not** use clipboard readback as independent proof of the new wording; the unchanged copy handler uses the displayed textarea value. No native LINE message was sent. Native mobile LINE remains unverified as already documented under R2.
- Screenshot: `proof/evidence/r21-pending-mobile.png` shows translated draft, primary action, collapsed exception and pending-specific controls at 390px.

## Preserved scope and delivery

No changes to `core.mjs`, `server.mjs`, `r2-tests.mjs`, `api-tests.mjs`, existing test file, CSS or review harness. Booking transitions, Brand → Model, prices, Owner Override, primary LINE URL method and fallback implementation remain intact; changes are presentation mapping, copy and self-review evidence only. No new dependencies or features.

Owner-facing Proof: **http://127.0.0.1:4173/review.html** (already running on this computer; loopback only).

Main baseline: `f0128fcbfd8f0240fdf8c1ac7dd9f19164cd7785`. Main/Public V0 untouched; no public deployment, no Production Build, no Visual Direction work. Candidate is returned to **00W Independent Review**, not advanced to Owner UAT by Engineering.
