# R2 UX Correction — Engineering return to 00W

Status: **CORRECTED CANDIDATE — READY FOR 00W INDEPENDENT REVIEW**.

Authority: 03 Root.3. Mission owner: 00W. Executor: Codex. Issue: #2, `[00W][R2] Vehicle selector + LINE handoff UX correction`.

Branch: `proof/product-technical-proof-r1`. Parent candidate: `3d5a8c3f4354256a6c9dd622e4c45fdd320361b8`. Exact delivered candidate commit is recorded in the Issue #2 completion comment and local R2 receipt (a commit cannot embed its own final hash).

## R2-A — Vehicle selection

Implemented **Brand → Model → existing ZERO Tier → existing Price**. Initial brand prompt has no automatic vehicle selection. Model is disabled until a brand is chosen; its options contain only that brand's existing models. Changing brand clears the old model and price immediately. Booking stays disabled until a model is selected, with a link back to selection. A response revision guard prevents an earlier price request from overwriting a newer selection.

The returning-customer shortcut sets both brand and model. Catalog refresh and Owner edits retain valid selection. Owner management controls are unchanged. No additional vehicles, pricing rules or business prices were introduced; `core.mjs` was not modified.

Browser observations:

- Toyota models: Corolla Cross / Alphard only; Toyota Alphard baseline 3000.
- Change to Porsche: prior vehicle cleared, only Cayenne available; Cayenne special 2500.
- Corolla Cross mid 1800; Lexus NX large 2100; Tesla Model Y large 2100.
- Fixed coating 16500 and assessment mode preserved.
- Mobile Owner override: Alphard → special changes current price to 2500 while selection remains Toyota / Alphard.
- Returning A's saved Tesla shortcut selects Tesla / Model Y and price 2100.

Recommendation: **PASS candidate**, subject to 00W / Owner UX acceptance.

## R2-B — LINE handoff

Primary action is **前往 LINE 完成確認**. It uses the documented direct official-account chat URL with a UTF-8 percent-encoded draft:

`https://line.me/R/oaMessage/%40udu6260e/?{encoded booking summary}`

This prepares a message where LINE supports the scheme; it does not send it or confirm the booking. The summary contains booking ID, service, vehicle, tier, frozen price, date/time and current status. It contains no customer credentials, session cookie or booking capability. Confirmation / change rerenders the link with the current summary; cancellation removes the handoff action.

The account ID was not guessed: opening the existing `https://lin.ee/y8kjBXa` in the browser resolved to `https://page.line.me/udu6260e?oat_content=url&openQrModal=true`, titled **XPEL-新竹竹北Zero職人 | LINE 官方帳號**, whose visible chat link was `https://line.me/R/ti/p/@udu6260e?oat_referrer=PROFILE`.

[Official LINE URL-scheme documentation](https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/) specifies `oaMessage` with encoded text, supports iOS / Android, and explicitly excludes LINE for PC (Windows/macOS). Checked 2026-09-14.

### Actual technical limitation / exact evidence

- On this Windows in-app browser, clicking the actual generated pending Cayenne link opened a new tab that ultimately displayed `https://www.line.me/tw/`, **LINE｜始終陪伴在你身旁。**, with a download link. It did not show a native chat or a prefilled input. Evidence: `proof/evidence/r2-line-platform.png`.
- No connected native iOS/Android LINE session was available in the browser surfaces used for this validation. Responsive 390px rendering is not a native LINE device test. Native message-field prefill remains **UNVERIFIED**, not claimed PASS and not claimed universally broken.
- Browser clipboard permission or popup blocking can also prevent fallback completion. The implementation reports copy failure without claiming content was copied, and provides an explicit reopen link if the browser blocks the new window. Forced permission/popup denial was not part of the final browser test.

### Proof implementation choice / authorized fallback

The documented prefill path stays primary; there is no blanket desktop user-agent diversion or clipboard requirement for the normal path. A collapsed **電腦版或未帶入內容？** section offers **複製並開啟 LINE**. One action copies the summary first, opens the existing official-account link, and displays clear paste/send guidance. It requires no separate normal copy button and no architecture expansion.

Fallback was actually operated: clipboard readback contained **PB-002 / Tesla Model Y / large / 2100 / 2026-09-18 13:30 / PENDING**, and the new tab resolved to the verified ZERO official profile. No LINE message was sent. An early implementation that opened a window before requesting clipboard access lost focus and failed; the corrected final version copies first and was verified successfully.

Recommendation: **READY FOR REVIEW with documented platform limitation**. The implementation and web-to-LINE URL contract are validated; native mobile prefill is not independently proven on this host. No LIFF, LINE Login, Messaging API, auto-send, new auth or production backend was added.

## Proportionate regression

Commands executed after final code edits:

- `node --test proof/r2-tests.mjs proof/api-tests.mjs`: **6 groups passed, 0 failed**.
- `node proof/tests.mjs`: **PASS**.

Coverage includes four brands/five models, all three price modes, Owner override, exact LINE target and lossless encoding of Chinese/newlines/ampersand/plus/hash/question-mark, booking contention (12 requests / one success), duplicate confirmation rejection, frozen quote, failed occupied-slot change, cancellation/reopening, anonymous/A/B HTTP isolation, forged identity/plate denial and management authorization.

Browser regression: request → Owner confirm → change → pending → cancel. Encoded LINE text changed from CONFIRMED at 13:30 to PENDING at 15:30, retaining frozen 2100. Cancelled request has zero LINE handoff links. Saved-vehicle shortcut, price modes and mobile override operated successfully. Browser error logs empty at the final checked point.

Actual standalone desktop viewport verified as 1366×900; standalone mobile verified as 390×844 with document scrollWidth 375 (no horizontal overflow). Owner review's existing mobile switch also operated. No new visual direction was created; existing CSS and homepage design remain unchanged.

## Reviewable location

**http://127.0.0.1:4173/review.html** — already running on this computer. Use the existing desktop/mobile review controls. This is loopback only, not public hosting.

00W review sequence: choose Toyota → Alphard, then Porsche → Cayenne; observe clearing and correct price; select a slot; inspect the single LINE primary action; use the fallback on this PC if needed. All fixtures are synthetic and should not be actually sent. Review screenshot evidence in `proof/evidence/r2-vehicle-desktop.png`, `r2-vehicle-mobile.png`, `r2-line-mobile.png` and `r2-line-platform.png`.

## Scope / boundary confirmation

Only customer selector/handoff code, one browser-safe helper, the static helper allowlist entry, R2 tests, this report and R2 evidence change. Existing booking/security/vehicle-price core and old tests remain untouched. No npm dependencies added.

`main` remains `f0128fcbfd8f0240fdf8c1ac7dd9f19164cd7785`. Public V0 was not changed or deployed; no archived Apps Script was reactivated; no real customer data was used; Production Build was not entered. No POS/CRM/CMS/full Vehicle Master, no Visual Direction candidates.

Completion route: **Engineering → 00W Independent Review → Owner Check**. Issue stays open for independent review. No further scope begins after this return.
