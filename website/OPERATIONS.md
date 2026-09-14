# Operations / deployment readiness — Issue #4

## Isolation and identity

Only `production/website-v1-candidate` contains the new `website/` candidate. Accepted Proof remains separately runnable. No root V0 files, main, domain, DNS or public deployment changed. Runtime is intentionally hard-limited to loopback; opening public traffic requires a separately authorized deployment change and review. Source commit is the release identity; preserve that SHA with every deployment and backup manifest.

Run one Node process per site. SQLite is local-disk only, not network filesystem; use a host-private persistent directory. The current Windows directory is for controlled review, not a hosting selection. Node 24's built-in SQLite API is experimental; pin the tested Node runtime for review and re-evaluate supported runtime/driver stability before production operation. No package dependency or paid plugin.

## Backup and actual recovery drill

`node website/ops.mjs backup` uses SQLite's online backup API, including committed WAL data, to a timestamped file in `website/private/`. These files contain password hashes, booking and content state; never publish them or include in source artifacts.

Actual drill on 2026-09-14: backed up active controlled DB, restored to a **new** file with `restore-copy`, SQLite integrity `ok`, schema `1`, two synthetic ended bookings preserved, session count `0` after revocation. Automated tests independently verify backup and restart persistence with a pending booking. Existing/live DB was not overwritten.

For an approved future host: encrypt and restrict backup storage, take daily + prechange backups, monitor job failures, retain a proposed 7 daily/4 weekly copies only after policy approval, and copy off-host using an approved destination. Suggested target RPO 24h/RTO 1h must be accepted and measured there; not claimed achieved by local testing. No off-host destination has been approved or used.

## Restore / rollback procedure

1. Suspend new writes on the candidate host; record current release SHA and backup its DB first. Do not touch public V0.
2. Create a validated restore copy using `node website/ops.mjs restore-copy SOURCE NEW_TARGET`. It refuses an existing target and revokes restored sessions/rate state. It does not overwrite live business data.
3. Compare booking totals, slot ownership, content revision and schema against the incident record. Reconcile any legitimate post-backup bookings before switching; snapshot restore must not silently destroy them.
4. Run the matching release against the restored copy on an isolated review instance via `createCandidate({database:NEW_TARGET})`. Test login, a synthetic quote, booking isolation and managed content. Do not seed a blank replacement DB by accident.
5. Switch only with the authorized deployment procedure. Preserve the prior DB read-only for reconciliation; no deletion authorized.
6. Code-only rollback can use a prior *schema-compatible Website release*. The old in-memory Proof is not a data-compatible rollback target. This is Website schema version 1 and the first durable candidate; retain this commit as its initial rollback release. There is no public candidate to roll back yet.

## Before any promotion request

- 00W independent review → Owner final UAT → Root.3 promotion review → explicit Owner launch authorization.
- Approve actual hosting/domain/TLS/storage/backup service, topology and cost first. No provider selected or purchased. Free/existing local infrastructure is sufficient for current review, not internet hosting.
- Configure and validate trusted HTTPS origin/proxy, secure cookies, host routing, firewall, process supervision and private filesystem ACLs. Never expose current HTTP loopback port through a public tunnel.
- Rotate initial credential via an approved operator procedure; revoke sessions, keep secret out of repo/logs, and establish recovery/access ownership. Consider additional admin access protection appropriate to chosen host.
- Load separately authorized real business prices/slots/vehicle data through Owner management; existing seeds are synthetic. No automatic broad V0 migration.
- Review retention/deletion notice and stale-pending/abuse controls for public traffic. Existing per-IP throttles are not a distributed abuse/WAF solution.
- Test real iOS/Android LINE handoff, logged-out social/case viewing, keyboard/mobile controls, restore on target infrastructure, and monitoring. Media content beyond metadata remains third-party dependent.
- Remove controlled-preview/synthetic messaging only in a separately reviewed release after data authority, never by pretending current fixture prices are real.

## Remaining limits

No paid infrastructure blocker for this controlled build. Public hosting, operational monitoring/off-host backups and target-host recovery are plans, not deployed services. Phone verification is concept-only, and browser-session booking access does not provide cross-device customer accounts. These boundaries are explicit; do not market the candidate as a launched production service.

Sources consulted: [Node SQLite](https://nodejs.org/api/sqlite.html) for transaction/backup API and stability; [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) for session handling principles. This implementation is not claimed to be a full OWASP audit.

