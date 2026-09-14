# Website V1 Public Promotion Readiness — Issue #5

00W independent review package, 2026-09-14. **HOLD. No public promotion authorized or performed.**

## Identity and scope

Accepted production candidate: `737570cadc856a7cb501263117f73b7ee02c45c1`. Final candidate is the commit containing this report on `production/website-v1-candidate`; its exact SHA is recorded in the Issue #5 return (a commit cannot contain its own SHA). Schema remains `1`. This change removes the public returning-customer concept section only; accepted Hero, business logic, Owner tools and styles are preserved. No new authentication model.

Local review: http://127.0.0.1:4180/review.html?view=desktop and http://127.0.0.1:4180/review.html?view=mobile ; Owner management: http://127.0.0.1:4180/admin . These are same-machine controlled review paths, not remote or device-accessible production URLs.

## Readiness results

| Gate | Actual result |
|---|---|
| 1 Final candidate | Narrow successor to accepted SHA above; exact final SHA in Issue #5 return. |
| 2 Production host/runtime | Proposed Linux VM, one Node process, local SQLite, Caddy reverse proxy. No approved target credentials/host supplied in the project; no target provisioned. Current tested runtime Node 24.19.0 on Windows. Linux runtime/support and resource behavior require target validation; native SQLite stability is already a recorded runtime limitation. |
| 3 Cost/authority | Proposed DigitalOcean Basic Regular 2 GiB/1 vCPU/50 GiB SSD $12/month plus Spaces $5/month = expected USD 17/month before taxes, transfer/storage overages and any domain charge. Not purchased or authorized. |
| 4 HTTPS/domain/TLS | Design only: explicit approved hostname → Caddy TLS → loopback Node; automatic renewal and redirect tests required. No domain ownership, certificate, renewal or DNS validation completed. Current app deliberately rejects non-loopback origin. |
| 5 Persistence | Local SQLite restart and online-backup tests pass. Target disk ownership, restart/reboot preservation and full-disk behavior NOT tested. |
| 6 Backup/monitoring/recovery | Local restore evidence exists; no off-host backup, alert delivery, process supervisor or target recovery drill installed/tested. No achieved RPO/RTO claimed. |
| 7 Credentials | Controlled admin has generated secret and hashed storage; no default public credentials. Production account owner, recovery custodian, rotation/revocation procedure and secure handover NOT established. Do not reuse review secret. |
| 8 Real business data | Synthetic/controlled prices, vehicles, availability and bookings only. Owner signoff and authorized real-data entry remain outstanding. |
| 9 Privacy/retention | Minimal session-bound data model retained. Retention, deletion responsibility, approved notice and log/backup policy NOT finalized. See decision record below. |
| 10 Pending/abuse | Existing manual confirmation and bounded request/login throttles retained. Pending has no automatic expiry; stale requests can hold availability. Owner policy decision and target abuse validation remain open. |
| 11 Returning customer | Public phone-verification/saved-vehicle promise removed. Current-browser booking access remains; no SMS/LINE Login/cross-device account promised or implemented. |
| 12 iOS/Android | NOT tested on physical devices. Desktop mobile viewport evidence is not native-device validation. Exact handoff work below. |
| 13 External links | Existing 2026-09-14 HTTP redirect/title and case metadata evidence retained: Facebook, Instagram, Maps, LINE and three case destinations. Logged-out video usability and native LINE prefill remain unverified; HTTP 200 is not a full usability PASS. |
| 14 Owner management | Local integration regression passes for protected booking/content/pricing/vehicle operations; prior desktop/mobile UI evidence retained. Target-origin write protection and real-device Owner use remain open. |
| 15 Release/rollback | Accepted SHA above is initial schema-1 rollback code; new SHA is pre-promotion candidate. No deployed Website release exists. Restore into a new DB, revoke sessions, reconcile later bookings before any switch; never overwrite live DB blindly. |
| 16 Actual blockers | Approved target/access; target adapter and operations validation; credential custody; real-data/policy signoff; physical-device and logged-out external usability evidence. These are distinct unresolved gates. |
| 17 Recommendation | **PUBLIC PROMOTION = HOLD.** One immediate next need: 00W route approval/provision of a suitable private target environment under the decision package below. This does not itself satisfy the remaining gates or authorize launch. |

## One immediate infrastructure decision

Recommend an Owner-owned DigitalOcean Basic Regular 2 GiB VM plus private Spaces backup bucket, maintaining the existing single-process SQLite architecture. Region selection must consider approved data location and service availability; no region is silently selected. Engineering needs authorized private access and named account/billing custodian before provisioning. No secret should be pasted into an issue.

The VM offers persistent local storage and process control; Spaces is an independent off-host destination (same provider, not a separate-provider disaster solution). Expected base cost USD 17/month. Spaces includes 250 GiB storage and 1 TiB outbound; extra storage $0.02/GiB and transfer $0.01/GiB. Billing alerts are not hard cost caps. Any extra service, overage authority or new domain charge needs separate approval. No paid monitoring add-on is assumed.

Free/existing alternative: an already-owned, maintained Linux host with persistent local disk, private access and independent backup destination; incremental provider cost may be zero, but availability/capacity/security have not been established. Current Windows review machine has no demonstrated production uptime, TLS or off-host operations. Render Free is unsuitable for the unchanged SQLite model: filesystem is ephemeral, persistent disks unavailable and idle services spin down. Do not change database architecture merely to fit a free tier.

Sources checked 2026-09-14: [DigitalOcean Droplets](https://www.digitalocean.com/pricing/droplets), [Spaces](https://www.digitalocean.com/pricing/spaces-object-storage), [Render Free limitations](https://render.com/docs/free), [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https). Prices are public estimates, not a purchased quote.

## Work after target authority, before promotion

1. Record target identity, OS/runtime exact versions, release SHA and private persistent data path. Preserve release files separately from data. Review native SQLite runtime support; do not silently substitute a driver. Validate schema 1 and reject accidental empty/seeded replacement of production data.
2. Make a separately reviewed deployment adapter for the explicit HTTPS origin while retaining loopback binding, strict Host/Origin/CSRF and secure cookies. Current loopback-origin restriction is intentional and not production configuration. Rate limits currently use socket peer IP: behind a proxy this becomes shared; establish exactly one trusted local proxy and validated client-IP handling, never blindly trust arbitrary forwarded headers. Session creation and abuse under public traffic also require evaluation.
3. Restrict firewall and filesystem access; run as non-root with supervision/restart. Validate process restart, machine reboot, disk persistence, denied public private-file access, admin/customer separation and protected management writes on the target.
4. Online SQLite backup daily and before changes; encrypt before off-host transfer, restrict backup keys, preserve checksum/schema/release/time manifest. Proposed retention: 7 daily/4 weekly, subject to Owner policy approval. Alert on missed/stale backup, job failure, disk pressure and unavailable HTTP service to a named operator; inject a controlled failure and prove receipt. No monitoring PASS until evidence exists.
5. Restore off-host backup into a fresh isolated target path, revoke restored sessions, check integrity and booking/slot/content totals, run synthetic security/write tests, then measure elapsed time and data age. Proposed RPO 24h/RTO 1h are targets for approval and measurement only. Keep source backup and original DB untouched; reconcile newer bookings. Record results and exact artifacts before release.
6. Establish named Owner and recovery custodian. Rotate to a production-only random secret through a restricted operator procedure, invalidate old sessions, test old secret/session rejection and recovery without logging credentials. Current setup command refuses reset; a tested rotation/recovery operation remains engineering work, not something Owner must improvise in SQLite.

## Owner decisions and data signoff (not silently adopted)

00W should obtain one concise operational signoff covering the following, then Engineering can implement only the agreed controls:

- Confirm real service/base prices, vehicle tier/override rules, bookable slots, featured case names/destinations and official social/Maps/LINE account. Owner management already supports routine edits; use it for authorized data, record signoff/revision, remove synthetic bookings in a reviewed clean launch-data procedure with backup. Never treat current fixtures as approved business truth.
- Pending request review deadline, whether/when an unconfirmed request releases a slot, after-hours handling, customer notice and repeat-abuse handling. Recommendation for decision: staff review within one business day, manual withdrawal/contact until an explicit expiry rule is approved. No auto-expiry or new policy implemented here; indefinite stale holds are a launch concern.
- Name privacy/deletion contact and approve purpose/notice: session identifier, selected vehicle/service/slot, booking states and security/admin logs are stored for request handling and protection; LINE is an external destination. Do not claim verified phone identity. Decide retention for ended requests, security logs and backups, deletion verification and backup expiry treatment. Suggested starting proposal: ended requests 90 days, security logs 30 days, backup schedule above; these are unapproved operational proposals, not legal-compliance claims. No deletion performed.

## Exact device / external usability handoff

Required executor: Work with actual devices, or Owner's nominated tester. Needs one iPhone with Safari + LINE and one Android with Chrome + LINE, OS/browser/LINE versions recorded, plus a privately reachable authorized test URL. Current localhost URL cannot serve a remote phone. Do not publish/tunnel the candidate to bypass the gate.

On each device, using controlled data: select brand/model/service/slot; create request; verify PENDING wording and primary LINE action; tap and record official account destination, prepared content and cancel-before-send behavior. If prefill absent, test explicit fallback copy/paste guidance. After Owner confirms, verify contact label; after withdrawal/cancellation verify no confirmation action. Check keyboard, back navigation, primary controls and Owner login/content-save/logout. Do not send a LINE message without separate authorization. Record screenshots/results, not personal identities or secrets.

Logged out, open Facebook/Instagram/Maps/LINE and the featured/case links; record visible destination identity, login wall or playback limitation. Existing HTTP/metadata evidence is useful but does not certify logged-out video playback. A platform login wall must be reported, not worked around with copied media.

## Validation and boundaries

This cycle: `node --test website/tests/candidate.test.mjs proof/r2-tests.mjs proof/r21-tests.mjs` — 4 passed, 0 failed on Node 24.19.0. Includes local isolation, origin/CSRF, booking race, pricing, management writes, persistence and backup/restart coverage. Existing `website/evidence/` browser and link artifacts are Issue #4 evidence, not new target-host/device tests. Public returning section removed; no logic/style file changed. Controlled-preview wording remains deliberately visible until actual production data/readiness approval.

Original approved assets, public V0 and main untouched. No DNS/certificate activation, purchase, public deployment or product redesign. Deployment/rollback execution remains blocked pending authority and evidence. Return to 00W independent review, then stop.

