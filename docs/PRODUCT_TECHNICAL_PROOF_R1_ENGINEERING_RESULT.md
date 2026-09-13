# Engineering Result — Product & Technical Proof R1

**PRODUCT & TECHNICAL PROOF R1＝ENGINEERING PASS CANDIDATE**

Authority: 03 Root.3. Coordinator: 00W. Production Build: NOT AUTHORIZED.

## Identity and synchronization

- Repository: `pketally620-rgb/zero-service`
- Authorized branch: `proof/product-technical-proof-r1`
- Reviewed baseline: `f3a39963970a22b2193d7682fab0d51433dd1e66`
- Baseline tree: `cd84cab59c411fc34dff72bda31eae63afa5577d`
- Baseline main: `f0128fcbfd8f0240fdf8c1ac7dd9f19164cd7785`
- Read canonical mission and Issue #1 before implementation. No AGENTS.md or workflows existed in the inspected branch tree.
- Windows Git lacked its HTTPS helper; shell download was network restricted. The authenticated GitHub connector successfully retrieved the complete small source set at the pinned baseline. Updates use GitHub Git Data API with the existing tree and a non-forced branch update. This local directory is a source mirror, not a claimed Git checkout.
- The exact final commit is returned in the consolidated delivery and local `ENGINEERING_RECEIPT.md`. This document describes the commit containing it.

## Existing work classification

| Preliminary work | Decision | Reason / disposition |
|---|---|---|
| Canonical mission | KEEP | Preserved without scope changes. |
| Five vehicles, tier labels, three pricing modes | KEEP | Small dataset and simple pure functions fit this proof. Prices/rules remain unaccepted examples. |
| BookingStore | CORRECT | Payload could override system fields; cancelled requests could change slots; reconfirmation lacked a state guard. Protected system fields, terminal state checks, ownership checks and history added. |
| Original tests.mjs | KEEP + CORRECT coverage | Original assertions passed, but were insufficient evidence for HTTP isolation, races, negative paths and management operations. Retained and added API tests. |
| Homepage direction | CORRECT | Kept ZERO-first, quiet dark direction, service/price/booking/LINE. Added actionable need cards, structured case, returning customer flow, responsive review controls. |
| Browser-side data-security demonstration | REPLACE | Exported A/B fixtures were shipped to the browser. Private fixtures and authorization now run only on the loopback server; static routes are allowlisted. |
| Combined management apply | REPLACE | Previously changed some values before slot failure; now three separately validated, owner-authorized operations with independent feedback. |
| LINE opening link | CORRECT | Retained existing V0 official LINE URL; added structured read-only summary, clipboard operation and explicit copy-then-open instruction. |
| V0 root, POS, quote, search, warranty | KEEP untouched remotely | No proof changes or requests to their applications. |

## A–F result and recommendations

| Proof | Result / recommendation | Evidence |
|---|---|---|
| A Homepage | PASS candidate | 1366×900 desktop and 390×844 mobile visually reviewed; navigation, need selection and booking operated. Three-step synthetic case and final CTA present. |
| B Vehicle + Pricing | PASS | Corolla Cross mid 1800; NX large 2100; Cayenne special 2500; Tesla Model Y large 2100; Alphard business 3000. Fixed 16500 and assessment semantics tested. Owner Alphard special override returns 2500. |
| C Booking | PASS within single-process proof | OPEN → PENDING → CONFIRMED → CHANGE/PENDING → reconfirm → CANCELLED → OPEN validated. 12 concurrent HTTP requests for S1 yield one 201 and eleven 409; duplicate confirmation rejected. Occupied-target change fails without releasing old slot. |
| D LINE handoff | SIMPLIFY / PASS concept | Actual clipboard contained booking ID, vehicle, service, tier, frozen price, date/time and state. Link is existing `https://lin.ee/y8kjBXa`. User manually pastes copied text; shortlink itself does not carry it. No LINE message sent and no dynamic LINE implementation. |
| E Minimum Management | PASS | At mobile width, saved mid price 1950, closed S6, changed Alphard override and observed special 2500. API rejects invalid prices, guest management, and toggling reserved slots. Owner can confirm and cancel requests. |
| F Customer Security | PASS for controlled authorization boundary | Real HTTP sessions, HttpOnly SameSite cookies; six-case anonymous/A/B matrix verified. Missing/wrong credentials, forged actor/plate/cookie, cross-origin mutation, and private source reads denied. Both customer self-reads succeed. |

Additional recommendations: REPLACE illustrative surface art and synthetic case with approved ZERO real-work assets before customer-facing assembly; DEFER durable database, production identity provider, hold expiry, rate limits, multi-instance transactions and LINE automation to a separately authorized stage. DROP universal CMS/POS/CRM/full vehicle-market expansion from R1.

## Owner review — no engineering actions required

Open the already running local review: **http://127.0.0.1:4173/review.html**. Use the top Desktop / Mobile 390px buttons; the page inside remains directly operable. This URL works on this computer only, not a public preview or a phone over the network.

Suggested review sequence:

1. Read the hero and choose a need; select representative vehicles and compare pricing.
2. Select an available time. It becomes pending, not formally confirmed. Copy the summary. Do not send synthetic requests to the official account.
3. Scroll to Owner Review; enter the explicitly synthetic Owner persona. Confirm the pending request. Return to summary to change or cancel. Owner list also supports cancellation if the guest page was reloaded.
4. In mobile mode change a price, a slot, and a vehicle override separately; then verify the public price display.
5. In returning-customer section log in as A / proof-a or B / proof-b. A has two saved vehicles and a warranty example. Choose a saved vehicle to skip searching the vehicle selector.
6. Use the security buttons as Public, A and B and see the actual denied responses.
7. Judge each component PASS / SIMPLIFY / REPLACE / DEFER / DROP. Engineering pass does not substitute for Owner acceptance.

The optional `proof/Open-Proof.cmd` is a local reopen launcher (Node required); the current delivery is already running and needs no launcher, terminal, Git or API configuration from Owner.

## Validation performed 2026-09-13

- Original `node proof/tests.mjs`: PASS.
- `node --test proof/api-tests.mjs`: 4 test groups, 4 pass, 0 fail. These groups contain pricing checks, state/forgery regressions, HTTP security matrix and multi-request management/booking scenarios.
- Browser: desktop Cayenne → 2500 → pending → Owner confirm; clipboard content read back successfully.
- Browser: mobile change → pending → cancel; slots reopen; all three management operations applied; override reflected in public price.
- Browser: Public→A 401, Public→B 401, A→B 403, B→A 403; returning A shows only A's two vehicles and warranty; saved Tesla selects tesla-model-y.
- Browser: actual 390px viewport document scroll width 375px, no horizontal page overflow; console error log empty at the checked point.
- Owner review iframe: desktop/mobile switch visually checked; embedded request and Owner cancellation operated successfully after final code changes.
- Screenshot evidence: `proof/evidence/desktop-1366.png` and `proof/evidence/mobile-390.png` (local screenshot files).

## Complexity, limitations and deviations

- Zero npm dependencies, plain HTML/CSS/JS and Node built-ins. One in-memory server is the shared booking truth for connected pages. State mutations have no async gap; the invariant is evidenced for this process only, not distributed production concurrency.
- State, identities and catalog edits reset when server restarts. Pending slots do not expire. Guest booking capability exists in page memory; reloading loses guest controls, with Owner list cancellation available. These are explicit proof simplifications, not production guarantees.
- Synthetic login credentials and Owner switch are intentionally exposed for review. F proves authorization given controlled identities; it does not claim a secure production authentication mechanism or secrecy of published synthetic fixtures.
- Price and vehicle rules are preliminary demonstration truth, not approved commercial data. Quote freeze stores the numeric result at request time, preserving it through management edits and rescheduling.
- Homepage imagery is an explicitly labeled CSS surface illustration. Case text is explicitly synthetic. No fabricated actual ZERO work claim. Real-work asset acceptance remains for later assembly.
- LINE transfer is manual copy/paste, not automatic attachment; native LINE app delivery was not exercised. No external message sent.
- No blocking access or implementation issue remains for the bounded proof. Owner aesthetic and business acceptance remain outstanding by design.

## Boundary confirmation

All remote changes are confined to `proof/` and this engineering report under `docs/` on the authorized proof branch. `main` is not updated. Public V0 is not deployed or invoked. Archived Apps Script deployments were not reactivated. No real customer data was used. Production Build was not entered. No migration, POS, CRM, universal CMS or full vehicle master was built.

**PROVE → ACCEPT → ASSEMBLE**
