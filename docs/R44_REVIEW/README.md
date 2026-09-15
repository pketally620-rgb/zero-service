# CONSOLIDATED PRIVATE INTEGRATION ASSEMBLY + TARGET-HOST VALIDATION RESULT R4.4

**PASS CANDIDATE — return to Root.4 / 00W independent review; STOP.**

Authority: [Root.4 R4.4 integration order](https://github.com/pketally620-rgb/zero-service/issues/5#issuecomment-5679089265).

## Exact consolidated candidate

- Actual application integration commit: `bcd5057b02d44510b0c7efac47701c3668c2d5cd`, parent `d02853c8ce8393ab840348ecaea336262ec27a2f`.
- Integrated application overlay SHA-256: `872efafbb2f7b3286e61cfdc8ef9e2b9c805a6d9c3c9da58e4314e6891fc7f14`.
- [SOURCE_IDENTITY.json](SOURCE_IDENTITY.json): 22 exact application/data/test/UI files. All hashes re-read and matched on the target after validation.
- R4.2 dataset remains `cdd87eb8b4ee46658b93e0c59aec03ead17a4599a6107086fd666f61ef548234`.
- Target: Droplet 600317700, zero-website-v1-prepromotion-sgp1; actual Ubuntu 24.04.4 LTS, Node v24.19.0, SQLite state schema 1; existing dedicated account and pinned SSH identity.
- Private root: `/home/zero-web-eng/work/r44-integration`; application in `release/`; approved preparation DB in `launch.sqlite`; synthetic writes only in separate `smoke.sqlite`. New directories are private (700); database files 600. No production credential value was printed or committed.

The source commit assembles accepted R4.1/R4.2/R4.3 into the actual `website/` tree, rather than another docs-only code snapshot. The subsequent review-document commit does not change the application release identity. Target copies the verified earlier baseline excluding private files, overlays the accepted source files, and records the new release identity. No business logic was redesigned in R4.4.

## Actual target evidence

[TARGET_EVIDENCE.json](TARGET_EVIDENCE.json) contains preparation, live smoke, restart, R2 round trip, isolated recovery, final-state records and six target test results. [Validation scripts](validation) describe the operations performed; they are historical engineering evidence, not instructions for Owner execution or authorization to rerun a closed mission.

| Gate | Actual result |
|---|---|
| Accepted integration | All 22 source/data hashes matched; six tests passed on actual Node/Ubuntu target |
| R4.1 clean state | Copied approved R4.1 DB through SQLite backup API, preserved approved services/content/current admin hash, revoked copied sessions; no fixture bookings or auto availability |
| R4.2 master | Explicitly loaded exactly 422 accepted records; existing override/fallback tests pass; five old fixture IDs not used as launch truth |
| R4.3 service lifecycle | Actual authenticated target API add/edit/disable/enable, fixed/tier/assessment, stale quote/new-booking rejection passed |
| Pricing and override | Five representative price cases pass; explicit Owner Override changes price and is restored in isolated smoke state; unknown vehicle rejected |
| Booking/security | Concurrent requests for one slot produce one winner; other customer cannot read it; confirm/change/confirm/cancel pass; anonymous management and customer management write denied |
| Historical truth | Service rename/price mode change/disable preserve the original stored booking name and quote; existing confirmed booking can still change through accepted flow |
| Credential | Existing production credential successfully authenticates to prepared private copy and smoke copy; validation login sessions logged out; no rotation/replacement in this mission |
| Restart | Both service processes restarted; launch and smoke complete state hashes remain identical, schema 1, integrity_check=ok |
| SSH disconnect | Later session found unchanged user-service InvocationID after previous SSH had ended |
| Exposure | Only 127.0.0.1:4198 and :4199 during validation; target's public-address requests to both ports refused; final app listeners stopped |

Launch state before/after service restart and at final stop:
`b3c5c8b0e5fd4ce31e187d29ac2a4c422f1c1d5edded87f230bd18ef7f3840db`.

Smoke state before/after restart and isolated recovery:
`688accde8c7f84d78d9503b4ba5bb0b1dfa3ce8f2c47372af959d70732d81588`.

Three 10-second-spaced resource samples: cgroup MemoryCurrent 20,402,176 → 20,865,024 → 21,295,104 bytes; CPUUsageNSec 186,596,000 → 193,956,000 → 204,044,000; NRestarts=0. Available host memory 1578–1579 MiB. Catalog HTTP 200 at 5.937 / 7.730 / 6.734 ms. This supports light private-runtime feasibility, not a production capacity/endurance guarantee. No machine reboot test or external network penetration audit is claimed.

## R2 compatibility / recovery

Used the existing unchanged R2 encryption/core, existing recovery public key, bucket-scoped credential, global operation ledger, shared lock, package/storage guards and private bucket. One 275,458-byte encrypted synthetic snapshot was uploaded under a dedicated `validation/r44-...` key, downloaded and matched by SHA-256. No paid service or subscription change.

Encrypted package SHA-256: `e9ccd9bd2d0674e4d87256d4e906bd9052f33fccf914e5e8a969d052c2833cbc`.

The existing local recovery private key decrypted it in memory and was never transferred to the host. Restored only into a fresh isolated directory. Schema/integrity and complete business-state hash matched; 422 vehicles and one synthetic historical booking retained; current admin hash preserved; two old sessions revoked and an inserted synthetic admin replay rejected. Restored application and restart returned HTTP 200 with unchanged state. Original smoke and launch DBs were not overwritten.

One validation retry occurred: the first isolated restore passed decryption, integrity and session revocation, but the later HTTP restart check did not finish. Its directory was retained. A second fresh directory used `Connection: close` across intentional process restart and passed completely. The initial raw failure was suppressed to protect sensitive diagnostics; no definitive application-defect diagnosis is claimed. No application code change was needed.

After successful recovery the single R4.4 validation object was removed and absence verified. Existing daily backup objects were not removed. Existing R2 core/runner/schedule hashes and installed crontab matched the closed R2 checkpoint. Monitor returned PASS with last-success age about 8.66 hours.

**Boundary:** the existing scheduled R2 runner remains pinned to the earlier R1 synthetic DB/release. This mission proves the consolidated DB/schema/envelope/recovery compatibility through the explicit one-off test; it does not claim scheduled protection of an activated R4.4 service. Before future sustained service activation, Engineering must explicitly switch and validate the backup source/release identity under subsequent routing. All R4.4 services are stopped, so no new production-serving state is left without that transition.

## Final retained state / rollback

- `launch.sqlite`: APPROVED_LAUNCH_PREPARATION, 422 accepted vehicles, 0 slots, 0 bookings, 0 sessions; integrity ok. Manually unopened availability is intentional.
- `smoke.sqlite` and isolated recovery paths retain synthetic evidence separately; they are not launch truth.
- Both transient R4.4 user services stopped. Ports 4196/4198/4199 closed; no boot-enabled service installed.
- Earlier R1/R4.1 paths remain intact. No live source DB restore/replacement. To review/restart later, use the explicit private launcher and approved launch DB rather than the synthetic smoke DB; this requires later routing.
- `main` / public V0 unchanged. No firewall/sshd/root changes, R3, DNS, TLS, public cutover, public launch, real-data promotion beyond approved preparation truth, visual/product redesign or architecture expansion.

No blocker remains for this bounded integration-validation mission. This PASS CANDIDATE is not a Public Promotion recommendation. Return for independent review and stop.
