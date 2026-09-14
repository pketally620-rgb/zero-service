# Approved asset pool / canonical refinement

00W independent review candidate, Issue #3. Parent: `f666d345e1a08c895b35563c1a477b6f58352490`. Only branch `proof/product-technical-proof-r1`.

## Review

- Desktop: http://127.0.0.1:4175/review.html?view=desktop
- Mobile: http://127.0.0.1:4175/review.html?view=mobile
- Direct responsive page: http://127.0.0.1:4175/
- Local launcher: `node proof/preview-approved.mjs`. Loopback only, synthetic in-memory data. Links require this computer/server; not public hosting.
- Evidence: `proof/evidence/approved-desktop.png`, `approved-mobile.png`, `approved-mobile-price.png`, `approved-mobile-line.png`.

## Asset selection and provenance

Inspected approved pool `ZERO_Website_Approved_Assets`: 57 photographs/graphics, seven videos and 19 brand/authorization materials. Reviewed photographic contact sheets and representative video frames. Original files stayed read-only; all 83 files matched before/after size and last-write timestamp. This is a metadata comparison, not a before/after cryptographic audit.

| Derived asset | Approved relative source | Use |
| --- | --- | --- |
| `approved-hero.jpg` | `02_實拍影片/196MB.mov`, frame at 12 seconds | Gray vehicle, actual inspection-light reflections; dominant desktop image and mobile lead |
| `approved-craft.jpg` | `02_實拍影片/copy_BA8F5F11-FC90-4FB1-90A4-4AFBAEA6319B.mov`, frame at 2 seconds | Technician polishing; human craftsmanship |
| `approved-edge.jpg` | `01_實拍照片/貼膜/S__395141132_0.jpg` | Film-edge detail supporting service process |

Free existing ffmpeg extracted/resized JPEG copies, removed metadata; CSS controls responsive cropping. Total new imagery approximately 397 KiB. No generative imagery, invented before/after results or new performance claims. Social collages, promotional graphics and overlay-heavy frames were not used as raw work evidence. Partner logos remain incidental within workshop photography; no oversized authorization banner or unverified certification claim was added. No remaining asset gap for this bounded static candidate. Video playback is not added.

## Benchmark principles applied

- [Bentley craftsmanship](https://www.bentleymotors.com/uk/en/about-bentley/people-and-expertise/craftsmanship.html): craftsperson and material-detail storytelling informed the pairing of real work and surface detail.
- [Topaz Detailing](https://topazdetailing.com/): purpose-led service categories and booking access informed the separation of service discovery, price selection and booking controls.
- [Aesop](https://www.aesop.de/): restrained image/text presentation informed the limited palette and typography hierarchy. Research was proportionate public-page review, not a comprehensive pixel audit.

These are design inferences, not copied assets or replicated layouts. One graphite/warm-white/muted-gold candidate: full-width photographic hero, strong ZERO identity, consistent section rhythm, confident pricing panel, dark final booking area. Mobile photo precedes brand/copy and both primary paths remain visible in the tested first screen. No broad direction set.

## Self-review and regression

- Desktop 1440×1000 and mobile 390×844 visually inspected; no horizontal overflow in measured views. Mobile first screen, selected price and pending LINE action captured.
- Browser Tesla → Model Y → large tier → $2,100 verified. Pending shows confirmation LINE action; confirmed shows contact ZERO action and cancellation request wording; cancelled hides both booking-specific LINE actions. Synthetic test booking cancelled and test session logged out. No LINE message sent.
- Customer copy inspected: internal controls remain in explicitly separated Owner Review area. Removed internal approval wording from image alternative text. No raw booking states in customer journey.
- `node proof/tests.mjs`: PASS.
- `node --test proof/api-tests.mjs proof/r2-tests.mjs proof/r21-tests.mjs`: 7 passed, 0 failed, covering classification/override, concurrency/confirmation/change, security isolation, LINE URL encoding and state-aware wording.
- Three new asset routes return 200 image/jpeg; private source route returns 404.
- Business logic modules unchanged. Only presentation, three derived assets, asset allowlist, local launcher and review evidence/documentation changed.

Originals, main, Public V0 and Production Build untouched. No paid tool, new authentication/database/feature or public deployment. Visual quality remains a candidate for 00W independent review, not final Owner UAT acceptance. Actual limitation: desktop/mobile browser simulation does not prove native LINE app behavior; existing handoff method/fallback preserved.

