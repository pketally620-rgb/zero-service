# Canonical visual R2 — case surface and social trust

Issue #3, 00W comment 5659748153. Parent `d990639ba6e5f81f880d1095c4031e252e438a12`; branch `proof/product-technical-proof-r1`. Return to 00W independent review, not final Owner UAT.

## Review paths

- Desktop: http://127.0.0.1:4176/review.html?view=desktop
- Mobile: http://127.0.0.1:4176/review.html?view=mobile
- Section: http://127.0.0.1:4176/#craft
- Local launcher: `node proof/preview-cases.mjs`. Loopback only; synthetic state; requires this computer/server.

## Composition and curation

Preserved Hero HTML exactly against the parent. Existing Hero CSS is unchanged; added rules target the new case section and footer only.

Replaced the two-photo composition with one full-width video-derived poster surface. It reuses the approved polishing frame (`approved-craft.jpg`, approved source `copy_BA8F5F11-FC90-4FB1-90A4-4AFBAEA6319B.mov`, 2 seconds). Dark horizontal and bottom blending connects the work image, heading, case action and three-step narrative. Mobile uses a vertical fade with readable text and a clear external action. Removed the small detail image from the page. The image is a general ZERO workshop cover; no claim that the linked case shows the identical vehicle or shot.

Used the expressly allowed poster plus real-case link option: preserves lightweight loading, avoids third-party embeds and player/autoplay dependencies in this bounded Proof. No local video playback or misleading play button. New imagery payload: zero bytes; reuses the existing 112 KB derivative. Originals untouched.

Curated three supplied links:

- Featured: [拋光前後對比／傷痕置換](https://reurl.cc/eVMlvm), relevant to the polishing craft narrative. No new before/after outcome claim is made on the homepage.
- Supporting text link: [Tesla 消光系列](https://reurl.cc/EbD1yR), a distinctive protection/finish case.
- Supporting text link: [洗車細節](https://reurl.cc/6bGKeV), everyday service craft.
- `查看更多施工案例` opens [ZERO Facebook](https://www.facebook.com/LANDGTW), a restrained broader-work destination, not seven equal cards.

Footer places Facebook, Instagram, Google Maps and official LINE below ZERO and service positioning. Exact Owner-provided destinations retained, new-tab links with noopener/noreferrer. No new contact/backend feature.

## Validation

- Desktop 1440×1000 and mobile 390×844 visually inspected. No measured horizontal overflow. Refined mobile fade after initial inspection. New section is one integrated surface, without gallery or retail-card composition. ZERO remains primary; no added partner mark.
- Footer mobile navigation inspected and all link href/target values checked against supplied values. Image alt text and visible new copy contain no internal engineering wording. Existing Owner testing area remains separated.
- Hero HTML exact match to parent; functional core not edited. Existing state-aware booking/LINE/customer-security code unchanged.
- `node proof/tests.mjs`: PASS.
- `node --test proof/api-tests.mjs proof/r2-tests.mjs proof/r21-tests.mjs`: 7 passed, 0 failed. Covers classification/override, booking concurrency/change, security isolation, LINE encoding and state-aware wording.
- Screenshots: `proof/evidence/cases-desktop.png`, `cases-mobile.png`, `cases-mobile-footer.png`.

## Limits and boundaries

Public web reader could not resolve the three selected reurl links (tool returned non-retryable URL errors). Supplied URLs and labels were retained; external landing-page playback was not verified. Social/app destinations may impose login or device requirements. No external messages sent.

No main changes, Public V0 deployment, Production Build, paid tools, original-asset edits, business logic redesign, backend feature or new identity service. Stop for 00W independent review.

