# Visual Direction Gate — 00W Independent Review

Branch: proof/product-technical-proof-r1
Accepted parent: 9bf2e1a86fb5d11af36de49b95757aa0d4b9f00b
Exact candidate SHA: posted in Issue #3 (the commit containing this report).

## Access

Local review hub: http://127.0.0.1:4173/review.html
A: http://127.0.0.1:4173/review.html?direction=A
B: http://127.0.0.1:4173/review.html?direction=B
C: http://127.0.0.1:4173/review.html?direction=C
Standalone: /?direction=A, /?direction=B, /?direction=C on the same loopback origin.
Use desktop/mobile buttons for each direction. Direction switches preserve current vehicle selection and booking, allowing a fair same-product comparison. The standalone link follows the selected direction. Direct navigation/reload initializes a new page as before; server state is shared across candidates.

## Defining choices

| Direction | Defining presentation |
|---|---|
| A / Dark Craft Premium | Charcoal rather than pure black; warm-white serif headlines; restrained muted gold primary action; larger image area; editorial spacing and square panels; service cards reduced to quiet divider lines. |
| B / Dark Professional Clarity | Deep navy with cool cyan accents; strong sans-serif headings; more compact hero; wider pricing column; explicit filled quote block and clear panel hierarchy. |
| C / Light Premium Trust | Warm-white ground, forest-green ink/action, generous spacing, rounded paper-like cards and softer image framing; dark readable form labels. |

ZERO 職人 is the primary header identity, with the shared service positioning 汽車美容・拋光・鍍膜・車體保護 and 新竹・竹北 context. No partner logo or unverified authorization claim was introduced.

## Same functional product

All three skins share index.html, app.mjs, ux.mjs and the same backend. app.mjs, ux.mjs, core.mjs and server.mjs are unchanged from accepted R2.2. The only scripting change is presentation/review control in review.mjs; messages validate same origin, parent source and one of A/B/C. No theme-specific business logic, new customer feature, external dependency or production authentication.

Preserved: service discovery, Brand → Model, tier/price, Owner Override, booking transitions and wording, LINE URL + fallback, returning concept and isolated synthetic test controls.

## Validation and self-review

PASS: node proof/tests.mjs — core invariants.
PASS: node --test proof/api-tests.mjs proof/r2-tests.mjs proof/r21-tests.mjs — 7 groups, 0 failures. Pricing/override, selector/URL encoding, concurrency, security and booking wording coverage preserved.

Browser: all three directions inspected at desktop 1440 × 1000 and mobile 390 × 844. Document scroll width stayed within viewport for each. Hero/header and form surfaces were visually reviewed. Mobile request → pending LINE action → withdrawal worked for A/Porsche, B/Tesla and C/Toyota. B Tesla price displayed large / $2,100; C Corolla Cross displayed mid / $1,800. B desktop and C mobile pricing surfaces inspected. Review-hub B→C→A switching retained the exact booking summary. The same confirmed request displayed 前往 LINE 聯繫 ZERO in A/B/C. Test request was cancelled and Owner session logged out. Existing unrelated synthetic requests preserved; no server restart or real LINE sending.

Customer self-review: no added debug/state language; booking wording remains accepted R2.2; terminal state has no booking LINE/change/cancel controls; test credentials remain only in labeled Owner review section. Controls remain readable and usable. Directions differ in type, density, shape, layout proportions and palette, not just accent colors. ZERO remains visually primary. No winning direction selected.

Evidence: proof/visual-A-desktop.png, proof/visual-A-mobile.png, proof/visual-B-desktop.png, proof/visual-B-mobile.png, proof/visual-C-desktop.png, proof/visual-C-mobile.png.

## Limits and boundaries

No execution blocker. Workshop/vehicle imagery is a clearly labeled placeholder pending approved ZERO media; it is not fabricated construction evidence. Photography quality therefore remains to be assessed with approved assets after direction selection. System fonts can vary by device. Native LINE prefill retains previously documented platform limitations and was not re-certified here. This is a visual proof, not a production design system or exhaustive accessibility certification.

main unchanged; Public V0 untouched; no public deployment; Website V1 Production Build not entered. No production data, DB, identity integrations or feature expansion. CSS layers intentionally support the bounded comparison; after Owner selection, consolidate the chosen direction rather than maintain three production themes.

Return: 00W Independent Review → Owner Visual UAT → Canonical direction decision. Issue #3 remains open. No winner chosen by Engineering.
