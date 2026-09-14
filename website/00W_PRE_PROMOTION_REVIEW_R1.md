# 00W Pre-Promotion Independent Review R1

Candidate reviewed: `ee14e23274c17cd7a4fe61496a51697b589d84dc`
Accepted parent: `737570cadc856a7cb501263117f73b7ee02c45c1`
Branch: `production/website-v1-candidate`
Issue: #5

## Decision

**PUBLIC PROMOTION = HOLD**

The HOLD is operational/infrastructure-only. Product, visual direction, Owner Final UAT, pricing/booking model, and Owner-management model remain accepted.

## Verified delta

The readiness commit is one narrow successor to the accepted Production Candidate. It adds the readiness report and removes the unfinished public Returning Customer surface. No business logic, pricing logic, booking logic, Owner-management logic, or accepted visual direction was reopened.

## Architecture assessment

00W does **not** find evidence requiring a broad architecture replacement before target-host validation. The current low-volume single-process Node + SQLite model remains a reasonable candidate for a small business Website, provided the actual Linux target proves persistence, restart, security, backup, recovery, and monitoring.

Runtime note: the candidate was tested on Node.js 24.19.0. Node's current v24.19.0 documentation classifies `node:sqlite` as Stability 1.2 / **Release candidate**, not merely experimental. This lowers—but does not eliminate—the need for target-host runtime validation.

## Infrastructure recommendation

00W recommends the following minimum target for the next controlled validation stage:

- **Compute:** DigitalOcean Basic Regular Droplet, 2 GiB RAM / 1 vCPU / 50 GiB SSD — **USD 12/month** before tax/overage.
- **Region:** Singapore, subject to account availability and Owner data-location acceptance.
- **OS/runtime target:** Linux + pinned Node 24.19.x + Caddy + local private SQLite storage.
- **Off-host backup:** encrypted backup copies to **Cloudflare R2 Standard** using the currently published free tier (10 GB-month, 1M Class A and 10M Class B operations/month). For ZERO's current small SQLite backup volume, this is expected to remain within free usage during the validation stage; if future usage exceeds free allowance, STOP before paid overage.

This is preferred over DigitalOcean Spaces for the initial stage because it reduces expected base cost from USD 17/month to USD 12/month and provides a different-provider off-host backup destination. DigitalOcean Spaces remains a valid fallback at USD 5/month if cross-provider backup setup proves materially unsuitable.

No domain purchase or DNS cutover is included in this recommendation. Domain/hostname is a later explicit gate after the target host is validated and before TLS/public promotion.

## Immediate next authority need

Approve or hold the minimum target-infrastructure budget/authority:

**DigitalOcean 2 GiB Droplet: up to USD 12/month, plus tax/usage overage only if separately approved.**

Cloudflare R2 should be attempted under its free tier; no paid R2 use is authorized.

Approval authorizes only private target provisioning and controlled readiness validation. It does **not** authorize public deployment, DNS cutover, production-domain activation, real-business-data promotion, or public launch.

## After target authority

Engineering/Work may then proceed with target-host validation, encrypted off-host backup, restart/recovery, monitoring, production credential handling, controlled private mobile/device test URL, and exact iOS/Android validation. Remaining Owner business-policy questions should be returned only after the target environment exists and technical evidence narrows them.
