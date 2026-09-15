# MANUAL / LINE-ASSISTED BOOKING ENTRY RESULT R4.5

Engineering: **PASS CANDIDATE**. Return to Root.4 / 00W independent review; no public promotion.

Canonical order: https://github.com/pketally620-rgb/zero-service/issues/5#issuecomment-5679440100

## Implementation

Protected Admin → 預約 → 替 LINE／電話／現場客人建立需求. Select source, minimal recognizable customer label, Brand → Model, enabled service and future OPEN slot. Server supplies the existing tier/fixed/assessment quote. Submission creates PENDING and immediately occupies the same slot. Existing board confirmation/change/cancel actions remain the final human confirmation workflow.

Both guided and assisted entry call `requestBooking` inside the same SQLite `BEGIN IMMEDIATE` transaction. No second LINE database, new schema, external identity service or automatic LINE message. Existing Website LINE handoff is unchanged. Vehicle/service/price/date/time snapshots survive subsequent service changes and booking state changes. Owner Override continues through the same `priceFor` implementation. Admin applicability shows the source-supported variants; unknown/unlisted vehicles require human clarification rather than guessed prices.

Assisted metadata (source and recognizable label, max 80 characters) is returned only by protected management reads. Random internal ownership is never bound to an anonymous customer cookie. Customers cannot discover, claim, read or cancel assisted bookings. Existing retention removes the complete booking record, including this metadata. No production credentials or business data changed.

## Availability semantics

After the transaction, customer catalog reads immediately omit the occupied slot. Competing guided/manual requests cannot reserve it again, even with stale browser data. Admin board and manual slot choices reload on success. An already-open customer page retains the accepted refresh/on-focus behavior; this change does not add push updates or claim instant live repaint on an inactive page.

## Independent review

- Desktop/mobile local review: http://127.0.0.1:4200/admin#bookings
- Local synthetic-only review password: `R45-Local-Synthetic-Review!` (not a production credential).
- Preview uses isolated `website/private/r45-review.sqlite`, approved 422-row master and explicit synthetic future slots. Nothing in this database is launch business truth.
- Actual desktop submission: PB-001, LINE, Toyota Corolla Cross, wash NT$1,800; OPEN choices decreased 4 → 3.
- Actual 390 × 844 mobile submission: PB-002, phone, Tesla Model 3, coating NT$16,500; OPEN choices decreased 3 → 2. Both appeared in the same board. Form/CTA readable and operable in one column. Viewport restored after review.
- This is browser viewport evidence, not physical iOS/Android certification. No target-host deployment was performed in R4.5.

## Reproducible validation

Run from repository root with Node 24:

```sh
node --test website/tests/candidate.test.mjs website/tests/policy.test.mjs website/tests/vehicle-master.test.mjs website/tests/service-management.test.mjs website/tests/manual-booking.test.mjs
```

Seven tests pass. New test covers auth/CSRF/origin, invalid source/label/vehicle, closed/past/occupied slots, immediate customer catalog exclusion, customer isolation, service disabling, immutable snapshots, confirm/change/cancel/release, simultaneous manual/guided entry, all three source channels, fixed/assessment pricing and SQLite reopen persistence. Existing tests preserve policy, vehicle provenance/Unknown/Owner Override, service lifecycle and recovery boundaries. See TEST_RESULTS.txt and IDENTITY.json.

## Scope and limitations

No blocking defect identified within R4.5. No automatic customer account linkage or confirmation messaging is introduced; staff retain the LINE/phone/in-person conversation and perform final confirmation. No product/visual redesign, main/Public V0 change, host deployment, DNS/TLS/R3, public promotion, or production data promotion. The previously recorded scheduled-backup source transition remains a prerequisite for future sustained activation, not work performed here.
