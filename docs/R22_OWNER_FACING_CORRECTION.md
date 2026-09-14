# R2.2 — returned for 00W independent review

Branch: proof/product-technical-proof-r1
Parent: 8920c2b8836ba3d7a3b6ad1d60b91c308bd96ded
Candidate: the commit containing this report; exact SHA is posted in Issue #2.
Scope: Issue #2 comments 5658276251 and 5658296117. Presentation correction only.

## Results

| Actual state | Title | LINE action | Change / cancel |
|---|---|---|---|
| PENDING | 預約需求已送出; 等待 ZERO 人員確認，尚未成立正式預約。 | 前往 LINE 完成確認 | 更改申請時段 / 撤回預約需求 |
| CONFIRMED | 預約已確認; ZERO 人員已確認此預約。 | 前往 LINE 聯繫 ZERO | 申請改期 / 申請取消預約 |
| Cancelled after confirmation | 預約已取消 | None | None |
| Withdrawn pending request | 預約需求已撤回 | None | None |

Terminal explanation: 此筆需求已結束，原時段已釋出。 Follow-up: 如需安排其他時間，請重新選擇時段。
The primary LINE label and clipboard-error guidance now share the state-aware wording helper. Existing URL generation, collapsed exception guidance and copy/open behavior are preserved.

Normal returning-customer section now shows 回訪客流程概念: 手機號碼 → 完成身分驗證 → 顯示已儲存車輛. It explicitly says 正式驗證方式待後續決定；此處僅呈現流程概念，尚未啟用手機登入。
A/B credentials, login, saved vehicles and logout were moved together into the collapsed 內部身分測試（僅供審查） panel inside OWNER REVIEW. They are absent from the normal returning-customer section. No phone form, simulated verification, new authentication or external identity service was added.

## Engineering self-review and regression

PASS: reviewed status title, explanation, LINE label, change/cancel labels and terminal actions for pending, confirmed, cancelled and withdrawn states. No raw state names/debug transition strings in booking summary. Technical identity terminology and synthetic credentials are restricted to the labeled internal review area. Fallback remains a collapsed customer-centered exception, not a normal required step.

PASS: node proof/tests.mjs.
PASS: node --test proof/api-tests.mjs proof/r2-tests.mjs proof/r21-tests.mjs — 7 groups, 0 failures. Extended transition assertions cover pending → confirmed → changed pending → withdrawn and confirmed → cancelled LINE actions. Existing coverage includes pricing/override, brand/model, exact LINE URL draft encoding, slot contention and HTTP authorization matrix.

Browser operation: created PB-010 on S1, observed pending then confirmed copy, cancelled it and observed no LINE/change/cancel controls; created and withdrew another request on S1 and observed terminal copy with no actions. Existing unrelated requests were preserved. Moved internal A login displayed saved vehicles; A reading B returned 403 FORBIDDEN. Saved Tesla vehicle selection still produced large tier / $2,100. Logged out after testing.
Desktop flow operated successfully. The 390px review mode visibly renders the three-step returning concept without credentials or horizontal clipping; screenshot: proof/r22-returning-mobile.png.

## Review and limits

Owner can operate http://127.0.0.1:4173/review.html on this machine, switch desktop/mobile, select a vehicle and time, then use the Owner review controls to confirm the same request. Expand the internal identity panel only for synthetic security/saved-vehicle tests.
No new technical blocker. Actual native LINE device prefill is not newly validated by this wording change; prior R2 platform limits still apply. No real message was sent. Mobile number verification is an intentionally unimplemented concept.

Only frontend copy/presentation, proportionate tests, this report and evidence are changed. main, Public V0, Production Build and Visual Direction untouched. No public deployment. Booking/pricing/security architecture unchanged.
Recommendation: R2.2 engineering PASS candidate for independent review; Owner acceptance remains with 00W. Issue #2 stays open.
