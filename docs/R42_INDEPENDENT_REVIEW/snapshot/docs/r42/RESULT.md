# SOURCE-SUPPORTED LAUNCH VEHICLE MASTER RESULT R4.2

Status: PASS CANDIDATE — return to Root.4 / 00W independent review. Not imported into the target-host launch database and not publicly promoted.

Authority: https://github.com/pketally620-rgb/zero-service/issues/5#issuecomment-5678080832

## Exact identity

- Accepted baseline commit: `ee14e23274c17cd7a4fe61496a51697b589d84dc`.
- Parent R4.1 overlay: `59d4b29c5b747b29ec573e477ed6114e3fc2c442b07c5b1984b4907ed597d5f4`.
- R4.2 overlay SHA-256: `7a6ec2ad81c7e8dbd705349326bd233eef053deec55d6c882ac0ae5d00bf18ce`.
- Vehicle master SHA-256: `cdd87eb8b4ee46658b93e0c59aec03ead17a4599a6107086fd666f61ef548234`.
- File identity: `RELEASE_MANIFEST.json`. This is a local candidate overlay, not a new Git commit or a claimed remote branch update.

## Source-supported scope

Read the Taiwan U-CAR current-market index and all 381 indexed model specification pages (47 indexed brands). Candidate contains 46 brands, 356 model families, 422 distinct length/body groups and 855 source variant entries. This includes two narrowly labeled historical groups. About 93.4% of indexed model families have at least one supported entry; this is NOT a sales-weighted coverage rate, complete trim coverage, or historical Taiwan fleet coverage.

Public source index: https://newcar.u-car.com.tw/newcar/search

`coverage-index.json`, 381 `facts/*.json` records, `primary-checks.json`, `historical.json`, and each candidate row preserve source URLs, observation dates, raw factual fields and source page hashes where captured. No customer information was used. No vehicle lengths or historical year ranges were invented.

72 unresolved variants are explicitly listed in `exceptions.json`. Missing dimensions, ambiguous RV classifications and unsupported commercial body types do not receive guessed classifications. Unlisted/old/modified/uncertain versions use ZERO human confirmation. The single wholly unsupported indexed brand and partially covered commercial families are visible in `summary.json`.

Manufacturer checks resolved specific material issues:

- Toyota Alphard PHEV is 5000 mm, correcting the secondary source's 5010 mm; HEV remains a separate 5010 mm group. https://www.toyota.com.tw/showroom/ALPHARD/fullsepc.aspx
- Kia Sportage's four matching listed variants receive the officially documented 4685 mm length. https://www.kia.com/tw/showroom/sportage/specification.html
- Nissan Sentra 尊爵 variants are a separate official 4648 mm set. That value was not assigned to unmatched 初綻／盛綻／極綻 variants. https://new.nissan.com.tw/nissan/cars/spec/sentra
- Altis standard 4630 mm and GR 4635 mm are separated; the latter crosses the existing ZERO large-tier threshold. RAV4 GR 4645 mm is also separated. https://www.toyota.com.tw/showroom/ALTIS_GR/fullsepc.aspx and https://www.toyota.com.tw/showroom/RAV4_GR/fullsepc.aspx
- Additional checks cover Corolla Cross, Tesla Model Y, Cayenne and body classification for Touran, Solterra and EQE SUV. See `primary-checks.json`.

Historical evidence is deliberately limited to the exact Lexus NX 2018 brochure set (4640 mm) and Honda CR-V Taiwan 2012 launch set (4545 mm). No adjacent years are inferred. Broader historical coverage remains a documented limitation, with the existing Unknown / Not Found path available.

## Integration and maintenance

Brand → Model and existing length/body → tier → price functions are preserved. Seats do not drive classification. Rows split only for different verified lengths or body categories; cosmetic/equipment variants with identical dimensions are grouped. Applicable variants remain visible to customers.

Owner Override retains priority. Explicit preparation refuses fixture databases and refuses to silently remove unmatched Owner-managed vehicles. Re-running preparation preserves existing Owner-managed rows and prices. The master is not automatically imported on application startup. Future source updates require reviewed reconciliation; existing Owner values are not silently overwritten.

The five fixture vehicles are not used as the launch master. Existing fixture tests remain isolated. R4.2 does not change services, prices, booking states, LINE behavior, credentials or retention policy.

## Validation and review

- Five automated tests passed, zero failed: candidate integration, R4.1 policy/credential behavior, source-master validation and controlled preparation.
- All 422 rows passed unique-ID, source presence, exact numeric dimension and existing tier-function validation. Threshold checks cover 4630/4631 and 4850/4851 mm. Owner Override and Unknown fallback passed.
- Preparation tests reject fixture state, preserve Owner Override and service prices, and do not create bookings or availability.
- Desktop and 390-pixel mobile browser review confirmed Toyota selection, Altis GR large tier and NT$2,100 wash price, clear applicable-version text and the ZERO contact fallback. This is responsive browser evidence, not physical-device certification or renewed Owner UAT.
- Customer UI strips the internal source-check date prefix. Source-review terminology stays in the separate internal review page.

Local review paths (available while the local preview processes remain running):

- Source/exception review: http://127.0.0.1:4196/
- Desktop functional preview: http://127.0.0.1:4195/review.html?view=desktop
- Mobile functional preview: http://127.0.0.1:4195/review.html?view=mobile

## Boundaries and recommendation

No target-host action, target DB import, SSH action, credential change, R3/DNS/TLS action or public promotion occurred. `main`, public V0 and approved visual/product scope remain unchanged. No Owner engineering action or business-policy decision is currently required.

Recommendation: PASS CANDIDATE for independent review of this explicitly bounded, source-supported launch master. Do not describe it as a complete historical Vehicle Master. Unsupported versions remain human-confirmation cases. Stop here; target installation or broader work needs subsequent routing.
