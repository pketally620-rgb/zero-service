# ZERO Official Website V1 — Product & Technical Proof R1 Mission

Status: ACTIVE PROOF WORKSPACE
Branch: `proof/product-technical-proof-r1`
Parent authority: 03 Root.3
Production Build: NOT AUTHORIZED
Public V0 main branch mutation: NOT AUTHORIZED by this mission

## Mission

Build a small, reviewable proof that answers whether the proposed Website V1 direction is worth assembling into production.

Development model: **PROVE → ACCEPT → ASSEMBLE**.

The proof must demonstrate the result; Engineering owns implementation HOW.

## Product truths

- Customer must be able to understand the site without instruction.
- Mobile-first and minimum typing.
- Vehicle selection must drive ZERO vehicle tier and base price; customer does not choose the tier manually.
- Owner business truth overrides automatic vehicle classification.
- Website booking creates a PENDING BOOKING REQUEST; LINE / staff confirmation creates the formal booking.
- Website, LINE and future assisted booking must converge on one booking truth in production architecture; this proof may use controlled proof data only.
- Returning-customer flow must be faster than first-time flow.
- Personal data requires identity; vehicle plate is not a password.
- Owner changes business data, not code.

## Proof A — Canonical Homepage

Demonstrate one credible ZERO homepage in desktop and mobile form.

Required experience:
1. Clear ZERO-first hero.
2. Primary actions: service / price and booking.
3. LINE enquiry remains easy to find.
4. Service discovery begins from customer need rather than internal jargon.
5. Real-work / case presentation follows CONDITION → PROCESS → RESULT.
6. No dead-end ending.

Visual direction: Quiet Premium, Real Work First, ZERO First, clarity before decoration.

## Proof B — Vehicle + Pricing

Use a deliberately small representative dataset sufficient to prove the model:
- ordinary mid-size vehicle
- large vehicle
- Porsche Cayenne-type special vehicle
- Tesla representative vehicle
- large MPV / commercial van representative vehicle

Demonstrate:
- Vehicle → rule → ZERO tier → correct base price
- owner override changes the result correctly
- support at least: tier price, fixed price, and on-site assessment pricing semantics

Do not attempt full Taiwan vehicle-market coverage in this proof.

## Proof C — Booking

Use controlled proof dates and a small number of slots.

Demonstrate the state path:
OPEN → PENDING / HOLD → CONFIRM → CHANGE → CANCEL

Required invariant:
- one slot cannot hold two confirmed bookings

No full production scheduling system is required.

## Proof D — LINE Handoff

Demonstrate:
- website selections can be converted into a structured booking summary
- customer can continue into ZERO official LINE with that context
- classic direct LINE enquiry remains available

Do not build a complete dynamic booking UI inside LINE for R1.

## Proof E — Management Center

On a mobile-sized interface, demonstrate only these owner/staff operations:
- change a service price
- change an availability slot
- change a vehicle record / override

Do not build a universal CMS.

## Proof F — Customer Security

Controlled identities:
- Public anonymous
- Customer A
- Customer B

Required outcomes:
- Public cannot read A or B private customer data
- A cannot read B private customer data
- B cannot read A private customer data
- plate number alone must not unlock private data

Use synthetic proof data only. Do not use legitimate V0 customer records.

## Minimum proof data

Sufficient proof data may include:
- 5 representative vehicles
- 3 pricing modes
- 2 dates and a handful of time slots
- 1 returning customer with 2 vehicles
- 1 warranty example
- 1 structured case example
- 1 quote-freeze example
- 1 vehicle owner override
- Customer A / Customer B / Anonymous security scenarios

## Hard boundaries

This mission does NOT authorize:
- Website V1 Production Build
- mutation of public V0 `main`
- reactivation of archived V0 Apps Script deployments
- use of legitimate customer / warranty records as test fixtures
- V0 visual redesign as a side task
- database migration for convenience
- POS functionality
- production CRM
- broad LINE automation
- full vehicle master build
- complete CMS
- public deployment / production promotion

## Evidence sufficiency

Return evidence sufficient for an independent reviewer to classify each Proof A–F as one of:
- PASS
- SIMPLIFY
- REPLACE
- DEFER
- DROP

Evidence should demonstrate normal user-visible behavior and the required security / state invariants without prescribing a particular engineering toolchain.

## Stop conditions

Fail closed and return the exact blocker if:
- completing the proof requires public / production mutation
- real customer data would be required
- archived V0 vulnerable deployments would need reactivation
- an irreversible external-system action becomes necessary
- a materially broader architecture decision is required before a proof can be produced

## Owner boundary

Owner is not required to write code, inspect logs, operate Git, configure APIs, judge SHA values, or perform engineering validation.

Owner acceptance is limited to:
1. Is this a ZERO website I would show customers?
2. Can a normal customer use it without instruction?
3. Is the demonstrated capability worth maintaining?
