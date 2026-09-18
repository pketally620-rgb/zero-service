# Root.5 narrow production activation correction

Canonical order: Issue #5 comment5725521313. Base60b8752b9489f4174ee89fe97fb7e716553f861c. Build only; PUBLIC PROMOTION HOLD.

## Corrected boundary

createCandidate supports exactly https://zerocraft.tw only with explicit trustedLocalProxy:true. Local preview origins retain their behavior. Canonical mode refuses fixture initialization and any non-127.0.0.1 listen call. production.mjs requires an existing absolute ZERO_DATABASE with approved launch dataClass/schema/integrity, then binds only127.0.0.1:4198. No live runtime adapter is changed by this commit.

Every production request requires IPv4 loopback peer, canonical Host/X-Forwarded-Host, HTTPS forwarded protocol and one syntactically valid IP. Forwarded and comma-separated XFF are rejected. Rate limiting uses the validated single forwarded IP. Existing exact Origin/CSRF, HttpOnly/SameSite=Strict/Secure cookies, customer ownership and Admin controls remain.

Trust model: one local Caddy edge, no CDN or upstream proxy. Local host processes are inside this trust boundary; header checks are not an authentication mechanism against a compromised local host. Protect host users/config accordingly. The provided Caddyfile overwrites forwarded headers using the actual peer, removes Forwarded, and routes only the canonical hostname. No trusted_proxies expansion. Header overwrite semantics checked against https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#headers . Template not installed, Caddy not started, no ACME/DNS/public ports activated.

## Corrected customer wording

Canonical production responses transform only exact preview text: banner becomes 預約需求送出後，須由 ZERO 人員確認; time notice refers to staff-opened availability; LINE title becomes ZERO 預約需求; send guidance requests confirmation and human confirmation; preview footer becomes ZERO 職人 · 預約服務; Admin test notice becomes real schedule management guidance. Local previews retain test warnings. No price, service, vehicle, booking transition, date selection, collapsed reschedule or privacy policy change. No availability generated.

## Evidence / scope

12 Node tests PASS, including existing9 and three new production boundary tests: bad Host/proxy headers/direct access rejected, wrong Origin/CSRF rejected, Secure cookies, authenticated confirmation/logout, customer isolation/collision protection, separate client-IP rate limits, no demo wording in production customer assets. Local loopback edge integration overwrites spoofed headers and passes canonical requests; this is an HTTP proxy-contract test, NOT a deployed Caddy/TLS validation. Initial test-harness failures corrected: Node fetch did not preserve intended Host; use http.request. Existing stale slot rejection is400, preserved as-is.

Readonly target evidence2026-09-18T05:23:54Z: launch hash b3c5c8b0e5fd4ce31e187d29ac2a4c422f1c1d5edded87f230bd18ef7f3840db;422vehicles/0slots/0bookings/0sessions, integrityok. R2 current success remains accepted60b8752 release, package5d4d408faca02418b7b74411b8a40c77290b6ad13d8a4a2eb196bff9c3c4974b. Runner/core/schedule/unit hashes unchanged. No host writes, deployment switch, credential changes, DNS or public listener actions performed.

## Remaining activation gates

Independent review/new exact-SHA Owner authorization remains required. Existing Owner promotion authority does not transfer. Actual privileged execution path and real Caddy/TLS/public-origin verification are still required at separately authorized activation. No Owner Linux work. R2 still protects the existing deployed release; alignment to this NEW release belongs to a separately authorized deployment, not this preservation-only task. Initial OPEN slots remain a real staff business action. Owner Action nowNONE. BatonRoot.5; stop after candidate return.

