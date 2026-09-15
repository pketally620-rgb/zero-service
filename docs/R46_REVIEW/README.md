# TARGET-HOST CONSOLIDATION + SCHEDULED R2 SOURCE TRANSITION RESULT R4.6

**PASS CANDIDATE — STOP, return to Root.4 / 00W independent review.**

Authority: https://github.com/pketally620-rgb/zero-service/issues/5#issuecomment-5679839226

## Identity / target

- Application release: `3a329c71e8ec959ba1008f0b3e69dbcfaeaff495`, the closed R4.5 candidate. No application code change in R4.6.
- Droplet 600317700, `zero-website-v1-prepromotion-sgp1`; dedicated `zero-web-eng`; Node v24.19.0, SQLite schema 1.
- Private release: `/home/zero-web-eng/work/r46-integration/release`. All 42 tracked `website/` files assembled from that exact Git commit, then rehashed on target; see SOURCE_IDENTITY.json.
- Current approved backup source: `/home/zero-web-eng/work/r46-integration/launch.sqlite`.
- Launch truth remains APPROVED_LAUNCH_PREPARATION: 422 vehicles, **0 slots / 0 bookings / 0 sessions**, integrity ok. State hash `b3c5c8b0e5fd4ce31e187d29ac2a4c422f1c1d5edded87f230bd18ef7f3840db` matches the prior closed launch checkpoint.
- Prior R4.4 launch DB preserved. New launch directory 700 and DB 600. R2 credential remains its existing stricter 400; no secret value transferred to evidence.

## Target validation

Seven application tests and three R2 core tests pass on the actual target. See TEST_RESULTS.txt / R2_TEST_RESULTS.txt.

Actual protected API smoke used the existing production Owner credential in memory, only through pinned SSH. Temporary loopback applications used launch/read-only review and a separate synthetic `smoke.sqlite` for writes. Assisted LINE entry created PENDING in the same board, immediately removed its slot from customer catalog, denied a competing guided request and customer read, and confirmed via the existing management action. Five representative prices, Unknown rejection, Owner Override, service add/edit/disable/enable, fixed/assessment modes, booking collision, confirm/change/cancel, immutable historical snapshot and credential login passed. See SMOKE.json.

The launch DB was never given synthetic slots/bookings. Temporary launch login was logged out; final session count is zero. Two additional application start/stop cycles preserved the complete launch state and catalog. New-source isolated recovery independently proved restart HTTP 200 and state persistence.

## Exact scheduled-source transition

The existing runner changed only its hard-coded base/release/database path:

- Before: `ee14e23274c17cd7a4fe61496a51697b589d84dc`, `/home/zero-web-eng/work/private-runtime-r1/release/website/private/candidate.sqlite`.
- After: `3a329c71e8ec959ba1008f0b3e69dbcfaeaff495`, `/home/zero-web-eng/work/r46-integration/launch.sqlite`.
- Runner SHA-256 before: `94825ad6a3ea3e7133b2886fed763265070b7bd256a5995588ce49801c585e4b`.
- Runner SHA-256 after: `2c27c31bec0759d200b488999fca95564688c44b437aa86a430bba34856fec75`.

The previous runner/status were archived privately under R4.6 before replacement. The old source already had a successful attempt that UTC day. This explicit one-time source transition initialized new-source status as AWAITING_NEW_SOURCE_BACKUP, preserving prior attempt/success/object identity separately. This allowed the required new-source verification without rewriting or disabling the runner's daily guard. Global operation ledger was not reset. This is a one-time operational transition, not an automatic reset on future failures.

Crontab and service definitions are unchanged: daily **10:35 Asia/Taipei** backup, hourly at minute 15 monitor. Used the exact existing `schedule.sh backup` path that cron invokes, which starts `zero-r2-backup.service`; not a substitute ad-hoc upload. Journal proves start, Node PASS and service completion at **2026-09-15 12:08:41–43 UTC**. A second invocation at 12:08:44 produced `DAILY_ATTEMPT_STOP`, with no second upload. This is scheduler-service-trigger evidence, not a claim that the next calendar cron occurrence has already happened.

## Backup / isolated recovery

- Object retained: `daily/2026-09-15-c046bd924938bef1.r2b`.
- Bytes: **156,673**.
- Encrypted SHA-256: `e64319e50a1f28ac86c79e89b86052bbbe9578252f50ea8adddf4af769a06162`.
- Successful backup state/release identity matches current launch source.
- Independent download hash matched. Bucket inventory at verification: 2 objects, **194,562 bytes** total.
- Existing local recovery private key decrypted in memory; it was not sent to the host or evidence. Only decrypted DB bytes went through pinned SSH into a fresh 700 isolated restore directory, DB 600.
- Schema 1, integrity ok, full business-state hash and current admin hash preserved. Launch has no historical bookings or sessions; zero-session recovery is reported accurately. A synthetic admin token added only to the isolated restored copy was revoked and replay rejected.
- Restored application/restart HTTP 200, state unchanged; launch and previous source DBs never overwritten. See RECOVERY.json / DOWNLOAD.json.

## Retained protection / final state

R2 encryption/core, schedule, service definitions, OnFailure monitor linkage and cron hashes match the closed baseline. Existing daily attempt guard, 100 MiB package bound, 2 GB storage bound, 14-copy/14-day retention, object-count stop, bounded retries and rolling 1000-operation-per-class ledger remain unchanged. Three guard/encryption/retention tests pass. Monitor returns PASS; no new external offline alert capability is claimed. Root's paid-overage prohibition remains; these software guards are not a Cloudflare account-wide hard spend cap.

Final listeners contain only existing SSH and local DNS; **no website application listener remains**. Scheduled backup/monitor remains enabled against the new approved launch source. Synthetic smoke and isolated recovery copies remain segregated as engineering evidence. No production traffic or new launch data was introduced.

One validation-only correction: final mode assertion initially expected credential 600; actual existing credential is stricter 400. Read-only inspection confirmed this, the assertion was corrected, and final validation passed. Credential permissions were never changed.

For a later authorized operational rollback, retain the old runner/status plus old source, but do not silently resume old synthetic-source protection while activating the new launch source. Any runtime rollback must name the matching source/release and verify protection again. No rollback or next-stage activation executed here.

No remaining blocker within R4.6. `main` / Public V0 unchanged; no R3, DNS, TLS, public cutover/launch or product redesign. Evidence scripts are historical records for independent review, not instructions to Owner or automatic permission to rerun a closed mission.
