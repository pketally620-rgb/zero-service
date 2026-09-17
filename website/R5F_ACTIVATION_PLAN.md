# R5F production activation and rollback plan (NOT ACTIVATED)

Accepted scope: post-UAT date-first/time-second booking selection and collapsed reschedule entry. Base release bdbcacb683f1cb6ff89c0e9c008d4fe6da664bf7. Preserve customer-facing wording, privacy, canonical visual, pricing and source-supported Vehicle Master. Android physical coverage exception and historical LINE handoff timestamp limitation remain disclosed and accepted. No UAT gate, secret, database or test fixture belongs in production assembly.

## Activation gates and order

1. Root/00W independently review exact candidate identity, regression and backup evidence. Preserve private loopback4198 until separately authorized activation.
2. Engineering needs an approved privileged execution route for Caddy installation, root-owned configuration/service and necessary host/network80/443 rules. The prior web-console control route was unavailable; do not assume it is now usable. No general sudo, new root credential or Owner Linux operation is authorized.
3. Prepare and validate the production adapter against an isolated DB: canonical https://zerocraft.tw origin, loopback-only Node, one trusted local proxy, edge removal of incoming Forwarded/X-Forwarded fields, validated single client IP, wrong Host/Origin/CSRF rejection, Secure/HttpOnly/SameSite cookies, authenticated writes and customer isolation. Existing loopback app and R3 private TLS proof do not substitute for this adapter validation.
4. Keep canonical apex zerocraft.tw. Current R3 certificate covers apex only (expires2026-12-14); www requires its own certificate coverage before HTTPS redirect can work. Under final authority, Caddy automatic HTTPS/HTTP-01 renewal can use public80/443; validate renewal configuration rather than assume manual DNS-01 constitutes automated renewal. Preserve root _acme-challenge until separately authorized cleanup.
5. Before live bookings, replace pre-promotion/示範/請勿送出 presentation through a reviewed launch-mode change; retain truthful privacy/state language. Owner/staff must specify actual initial OPEN slots through management; do not generate availability or invent business dates. These are remaining activation gates, not completed by this assembly.
6. After separate final authority, set apex A to authorized host152.42.233.152; add www routing only as explicitly authorized with TLS coverage. Do not add AAAA without verified IPv6 routing, or alter MX/NS/unrelated records. Baseline currently no apex/www traffic to host. Record rollback DNS values/TTL before activation.
7. Activate Caddy only after protected config, private upstream, certificates and rollback are validated. Main/Public V0 are independent and remain unchanged.

## First-post-cutover smoke (future authorized step)

From external logged-out browser: canonical HTTPS certificate/SNI/redirect, intended Host routing, privacy and reviewed external links, service/vehicle/price/read-only availability, no private paths or anonymous management. Owner normal Admin login validates Secure session and approved business content. Verify no forwarded-header spoofing and cross-origin write acceptance. Do not create synthetic bookings in launch DB; use the isolated fixture checks for destructive/lifecycle tests. A real booking test requires explicit controlled-data authority and staff coordination.

Confirm process/restart health, memory, monitoring alert visibility, current clean/approved launch data, exact release/schema and successful encrypted R2 backup metadata. Verify off-host hash/download and isolated restore as appropriate under existing free-tier guards. Never disable cost controls to force PASS.

## Rollback

Before activation preserve Caddy unit/config and host routing/DNS before-images. On serious exposure/security failure, stop public proxy or revert only authorized DNS; keep private app, launch DB and R2 intact. DNS cache means listener withdrawal is the immediate control. For application rollback restore paired private runtime/R2 runner before-images to bdbc release, restart private app, verify health and manifest, and reconcile expectedRelease honestly. Never reset backup attempt history, overwrite launch DB, import UAT DB or erase production bookings. Database recovery only from encrypted verified backup into fresh isolated path with session revocation; live replacement needs separate authority.

No public listener, DNS cutover, Caddy installation or production data activation is performed by this plan.
