# ZERO Website V1 — controlled production candidate

Canonical mission: GitHub Issue #4. Baseline: `8e479263024c7e31e47609d02d158e96701ccc6b`.
Branch: `production/website-v1-candidate`. **BUILD != PROMOTE.**

## Review locally

Requires Node.js **24.19.0** (the tested installed runtime), no npm packages or paid infrastructure.

```powershell
node website/setup.mjs
node website/server.mjs
```

- Desktop: http://127.0.0.1:4180/review.html?view=desktop
- Mobile frame: http://127.0.0.1:4180/review.html?view=mobile
- Customer: http://127.0.0.1:4180/
- Owner: http://127.0.0.1:4180/admin
- Initial unique Owner password: `website/private/OWNER_ACCESS.txt` (local-only, ignored, never served). Setup refuses to reset an existing credential. No shared default password.

The current preview is running and initialized. Owner routine changes use the management page, not these engineering commands. Do not send synthetic LINE drafts to the official account.

## Implemented boundary

Accepted Hero/case presentation, selectors and pricing rules retained. Customer page no longer contains embedded Owner/test-identity controls. Source `domain.mjs` retains the original pricing/classification and booking transition implementation, with synthetic customer fixtures removed.

SQLite WAL + FULL synchronous commits persist the catalog, content, slots, bookings, sessions and management audit. State transitions execute synchronously inside `BEGIN IMMEDIATE`, preserving slot ownership, quote snapshot and no-double-confirm invariant even across competing SQLite connections. This intentionally small implementation uses one versioned state document inside SQLite rather than a general CMS schema. It targets low-volume, single-host operation; no distributed scaling claim.

Owner can edit all three accepted services' labels/notes/prices, five representative vehicles' brand/model/dimensions/type/override, create future slots, close/reopen unbooked slots, confirm/change/cancel bookings, edit/enable the featured case, add/remove/reorder/edit/enable up to 20 supporting cases (only first two enabled shown), and edit Facebook/Instagram/Maps/LINE/profile ID. URLs are validated, dynamic titles use textContent, and content saves reject stale revisions. Case/supporting links remain hidden until managed data loads.

## Security and privacy

- Owner password: random 192-bit setup secret, salted scrypt hash (N=32768,r=8,p=1); no plaintext in DB/source. Local access file must stay private and be removed/replaced during promotion preparation.
- Independent Owner/customer 256-bit tokens, stored as SHA-256 hashes in DB. HttpOnly + SameSite=Strict; Owner absolute lifetime 30 minutes, browser-customer access 30 days. Owner login rotates/revokes prior token; logout invalidates it server-side.
- Same-origin JSON POST required, session-bound CSRF header required for writes, Host checked, private files not served, no CORS, restrictive CSP/no-referrer/no-store, bounded request size/time, login and booking-request throttles.
- Customer booking ownership is server-bound to its browser session. No client-selected identity, no sequential-ID authorization, no admin capabilities in public catalog. Owner receives operational booking details without session hashes.
- No name/phone/plate collection or real customer fixtures. Booking ID is included in LINE draft for human reconciliation. Clearing cookies loses self-service access; reference ID alone must never authorize data disclosure or restoration by staff. Returning-customer verified-phone login remains an explicitly unimplemented product concept, as accepted; no new identity service.
- Customer cancellation remains immediately effective per the accepted model and explanatory wording. Pending requests require Owner review; they do not automatically expire. Staff must review stale requests; public abuse/hold policy requires a prelaunch decision, not a silent state-machine redesign.
- Cookie duration is not data retention. This controlled dataset stays local for review. Real-data retention, deletion/subject-request procedures and privacy notice approval remain pre-promotion requirements; no destructive purge implemented without authority.

## Validation

```powershell
node --test website/tests/candidate.test.mjs proof/r2-tests.mjs proof/r21-tests.mjs
node website/ops.mjs backup
node website/ops.mjs restore-copy BACKUP_PATH NEW_DATABASE_PATH
```

Actual evidence in `evidence/`. The candidate integration test exercises unauthorized admin reads/writes, CSRF/origin rejection, private-source denial, five price representatives, customer A/B isolation, competing booking requests, Owner confirmation, atomic change/cancel, override, quote freezing after price edits, case add/reorder/enable/curation, stale-save and unsafe-URL rejection, restart persistence, SQLite backup integrity, logout revocation and login throttling. Three prior UX tests cover selector helpers, LINE URL encoding and booking wording.

Browser checks: desktop 1440×1000; mobile 390×844 customer Hero/price/LINE and Owner case editor. Tesla Model Y → $2,100; Toyota Corolla Cross → $1,800; pending → Owner-confirmed → customer-cancelled and a second withdrawn request. Owner changed permanent case links and disabled/restored featured visibility through the UI. Test bookings ended; Owner logged out. No external LINE sending.

## External destinations

Network validation evidence includes HTTP chains, titles and concise metadata findings. Facebook/Instagram identify ZERO; Maps redirects to ZERO at 縣政二路360號; LINE resolves to `@udu6260e`, matching draft account ID.

Reurl preview pages exposed real Instagram post URLs; all three permanent URLs return 200 and identify `xpel_hsinchu_zhubei` in metadata. Candidate uses these permanent links, not shortlinks:

- `eVMlvm` → `https://www.instagram.com/p/DIyYGx8S_6j/` (polishing/craft).
- `EbD1yR` → `https://www.instagram.com/p/DSthtORkoGq/` (Tesla matte).
- `6bGKeV` → `https://www.instagram.com/p/DSeURmLEjlu/` (vehicle/plan consultation). Label corrected to 車況與方案說明; metadata did not establish the originally named washing-detail media.

HTTP/metadata checks do not guarantee logged-out video playback or native-app behavior. Native LINE draft-prefill and copy fallback still need device acceptance before public promotion. No destinations invented and no private data transmitted to validate links.

## Review recommendation

**PASS CANDIDATE for 00W controlled independent review only.** Not a public-launch certification. See `OPERATIONS.md` for remaining promotion gates and recovery plan. No paid dependency is required for this local candidate; no paid commitment made.

