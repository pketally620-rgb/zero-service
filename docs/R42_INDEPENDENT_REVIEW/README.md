# R4.2 narrow evidence return — same candidate, independent review pending

Authority: [Root.4 narrow evidence return order](https://github.com/pketally620-rgb/zero-service/issues/5#issuecomment-5678463152).

This directory supplies the missing remotely accessible evidence. It does **not** install the candidate into the application tree, change the dataset, import target-host data, or close 00W's HOLD. All candidate files are frozen copies under `snapshot/`; only this documentation directory is added to the authorized candidate branch.

## Review entry points

| Required item | Artifact |
|---|---|
| Actual 422-record dataset | [vehicle-master-r42.json](snapshot/website/data/vehicle-master-r42.json) |
| Per-record/per-variant source traceability | [SOURCE_PROVENANCE_MANIFEST.json](SOURCE_PROVENANCE_MANIFEST.json) |
| 381 captured factual extracts | [facts](snapshot/docs/r42/facts) |
| Manufacturer checks/corrections | [primary-checks.json](snapshot/docs/r42/primary-checks.json) |
| Two exact historical groups | [historical.json](snapshot/docs/r42/historical.json) |
| 72 unresolved variants and reasons | [exceptions.json](snapshot/docs/r42/exceptions.json) |
| Original candidate/build identity | [RELEASE_MANIFEST.json](snapshot/docs/r42/RELEASE_MANIFEST.json) |
| Collection and generation code | [collect.mjs](snapshot/docs/r42/collect.mjs), [build.mjs](snapshot/docs/r42/build.mjs) |
| No-guessed-dimensions audit | [NO_GUESSED_DIMENSIONS_AUDIT.json](NO_GUESSED_DIMENSIONS_AUDIT.json) |
| Reproducible integrity + behavior checks | [verify.mjs](verify.mjs), [TEST_RESULTS.txt](TEST_RESULTS.txt) |
| Package file hashes | [INTEGRITY.json](INTEGRITY.json) |
| Original scope/limitations | [RESULT.md](snapshot/docs/r42/RESULT.md), [summary.json](snapshot/docs/r42/summary.json) |

Candidate dataset SHA-256: `cdd87eb8b4ee46658b93e0c59aec03ead17a4599a6107086fd666f61ef548234`.

Original R4.2 overlay SHA-256: `7a6ec2ad81c7e8dbd705349326bd233eef053deec55d6c882ac0ae5d00bf18ce`. Baseline commit: `ee14e23274c17cd7a4fe61496a51697b589d84dc`. New Git evidence commit identifies transport only, not a new functional release. `INTEGRITY.json` hashes every package file except itself; its hash is returned on Issue #5.

## What the source evidence establishes

All 855 variant entries have a dimension lineage: 843 raw millimetre values normalized without estimation, 5 manufacturer correction/fill entries, 3 separately matched official Sentra variants, and 4 variant entries in the two historical groups. The audit found zero dimensions without one of those saved evidence paths, and zero exact unresolved-variant overlap with supported records. 72 unresolved variants retain their missing-length or unresolved-body reason; they are not included in the auto-price dataset.

The evidence is not stronger than its sources: most rows rely on a Taiwan automotive publication, with selected manufacturer cross-checks. Extracts preserve raw length/body/trim text, source URL, retrieval timestamp and source-page hash. Full HTML for all 381 source pages was not archived. A hash proves identity, not correctness. Manufacturer/historical notes are manually recorded source facts, not independently signed source snapshots; reviewers should spot-check their linked sources. This package does not re-scrape or claim every source was independently revalidated this turn.

Suggested small spot-check: Alphard PHEV correction 5010 → 5000; Altis 4630 versus GR 4635 across the tier boundary; Sportage official 4685 fill; Sentra official 尊爵 versus unresolved publisher versions; 2018 NX and 2012 CR-V historical applicability. Find by ID/brand/model in the provenance manifest; follow its exact `evidenceFile` and source URL.

## Behavior preservation evidence

- [ux.mjs](snapshot/website/public/ux.mjs): `brandsFor` / `modelsFor`; verifier exercises all 46 brands and rejects unknown-brand selection.
- [domain.mjs](snapshot/website/domain.mjs): canonical thresholds 4630/4850 mm; only above 4850 do MPV/van map to business. Seats do not participate. Verifier checks all 422 stored tiers and all four overrides for each row.
- [vehicle-master.mjs](snapshot/website/vehicle-master.mjs): unknown ID returns `CONTACT_ZERO`; explicit preparation rejects fixture DBs and preserves existing Owner-managed rows/override.
- [app.mjs](snapshot/website/public/app.mjs) / [index.html](snapshot/website/public/index.html): customer applicability text and the official LINE contact fallback. Uncertain historical/modified vehicles require customer use of that path; the system does not infer a vehicle's year or automatically identify an uncertain trim.
- [vehicle-master.test.mjs](snapshot/website/tests/vehicle-master.test.mjs): boundary, Unknown, fixture refusal, stored Owner Override and service-price preservation tests. Prior fixture rows remain isolated test data; they are not used as the candidate master.

Engineering/00W can run locally with Node 24 (no credentials or target host required):

```text
node docs/R42_INDEPENDENT_REVIEW/verify.mjs
node --test docs/R42_INDEPENDENT_REVIEW/snapshot/website/tests/candidate.test.mjs docs/R42_INDEPENDENT_REVIEW/snapshot/website/tests/policy.test.mjs docs/R42_INDEPENDENT_REVIEW/snapshot/website/tests/vehicle-master.test.mjs
```

The test suite creates disposable temporary SQLite databases and binds loopback port 4191 for its integration test. It never uses a production DB. Owner is not asked to run these checks. No fresh physical-device/UAT claim is made.

## Existing limitations / handoff

46 brands / 356 model families / 422 groups represent about 93.4% of the discovered current-market model-family index with at least one supported entry. Not sales-weighted, complete trim coverage or historical fleet coverage. Some commercial/RV entries remain unresolved. Years outside the two specifically documented historical groups are not inferred. Candidate upkeep requires reviewed source reconciliation; no silent automatic updates or Owner Override overwrite.

Return to **00W Independent Review** for re-review of the same R4.2 candidate. No production host, R3, DNS, TLS, main, public V0 or Public Promotion changes. Separate service-catalog work remains out of scope.
