# SERVICE MANAGEMENT NARROW CORRECTION RESULT R4.3

**PASS CANDIDATE — Root.4 / 00W independent review pending.**

[Canonical order](https://github.com/pketally620-rgb/zero-service/issues/5#issuecomment-5678880574).

## Behavior added

Owner/Admin can add a service, edit name/note/pricing mode and values, and enable/disable it without code. New UI entries default to disabled until the Owner explicitly enables them. The three modes retain existing meanings: tier-specific prices, fixed amount, or on-site assessment. Switching modes discards obsolete persisted price fields. IDs are server generated; disable is reversible and does not delete a service.

Legacy services lacking an enabled flag remain enabled. Disabled services are filtered from the customer catalog and rejected by both quote and new-booking endpoints, including requests from stale pages. If all services are disabled, the page directs the customer to official LINE and disables new-slot selection.

Booking name and quote remain the original stored snapshot. Neither service edits nor disabling touch bookings. Existing pending/confirmed records retain their existing confirmation/change/cancellation flow. Normal previously approved retention rules still apply; this is not an indefinite retention promise.

Management writes retain admin authentication, origin and CSRF checks. Prices require integers from 1 to 1,000,000. The UI submits the current state revision, so a stale form is rejected for reload rather than silently overwriting changes. Existing API clients omitting revision retain compatibility.

## Exact scope and identity

[IDENTITY.json](IDENTITY.json) records full file hashes, parent R4.2 identity and six actual changed files:

- `website/service-management.mjs`: structured validation and upsert; enabled compatibility.
- `website/server.mjs`: protected management operation; catalog/quote/booking availability gates.
- `website/public/admin.mjs`: add/edit/mode/enable UI.
- `website/public/admin.html`: add-service entry and history explanation.
- `website/public/app.mjs`: empty-service guidance and disabled new-slot selection.
- `website/tests/service-management.test.mjs`: integrated lifecycle/security/history/restart test.

The [snapshot](snapshot/website) is the executable local candidate and required test/UI context, placed under this review directory to avoid silently assembling unpromoted R4.1/R4.2 overlays into the repository's older application tree. The Git evidence commit is a transport identity, not a target release or deployment. The accepted vehicle dataset hash remains `cdd87eb8b4ee46658b93e0c59aec03ead17a4599a6107086fd666f61ef548234`.

## Validation

[TEST_RESULTS.txt](TEST_RESULTS.txt): six tests passed, zero failed. The new integrated test proves admin/CSRF/origin protection, invalid-price rejection, create/tier quote, edit/fixed quote, assessment mode, disable/re-enable, rejection of stale new requests, unchanged booking snapshots, continued confirm/change handling, all-disabled catalog, stale-revision rejection and SQLite reopen persistence. Existing candidate, policy and Vehicle Master tests also pass.

Reproduce with Node 24 from the repository root:

```text
node --test docs/R43_REVIEW/snapshot/website/tests/candidate.test.mjs docs/R43_REVIEW/snapshot/website/tests/policy.test.mjs docs/R43_REVIEW/snapshot/website/tests/vehicle-master.test.mjs docs/R43_REVIEW/snapshot/website/tests/service-management.test.mjs
```

Tests use temporary synthetic SQLite files and loopback ports 4180/4191; no production credentials or DB. Owner is not asked to run tests.

Actual browser operation: desktop created an enabled fixed-price service at NT$2,800 and showed saved state. At 390 × 844, edited the name, disabled and saved (heading showed 已停用), then enabled and saved again (已啟用). Screenshot inspection showed readable labels, single-column fields and accessible save controls without horizontal clipping. Browser viewport restored afterwards. This is responsive browser validation, not physical-device certification.

Review locally: http://127.0.0.1:4197/admin#services while preview process is running. Dedicated synthetic-only login: `R43-Local-Synthetic-Review!`. This is not a production password; this preview's five test vehicles are isolated fixtures and do not replace the closed R4.2 master. Production credentials were neither read nor changed.

## Boundaries / return

No production-host operation or DB import; no `main`, public V0, R3/DNS/TLS, cutover or Public Promotion change. No pricing-rule, booking-state, vehicle-master, visual or general CMS redesign. No additional Owner decision or actual blocker identified within R4.3. Routine service changes are now available through the protected UI.

Return PASS CANDIDATE for independent review, then STOP. Deployment/assembly remains subject to subsequent routing.
