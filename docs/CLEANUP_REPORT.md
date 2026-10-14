# Cleanup report — prototype → source code

Source of truth: the approved prototype (`POS.dc.html` + `data/` + `services/`), preserved unchanged in
`archive/prototype/`. Nothing was deleted: everything removed from the deployable app was moved to `archive/`,
which is excluded from the build, lint and type-check.

## Converted

| Prototype                                                                                                        | Now                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `POS.dc.html` template (1,160 lines of DC markup with `sc-if` / `sc-for` / `{{ }}`)                              | 42 typed React components in `src/features/` with the same DOM and inline styles, generated mechanically from the template and then hand-wired |
| One logic class with `renderVals()` (≈640 dense lines)                                                           | Typed view-model builders (`*.view.ts`) per screen and dialog, and state actions in `src/state/actions/`                                       |
| `services/*.js`                                                                                                  | Typed modules in `src/domain/` (pure rules) and `src/state/actions/` (state transitions)                                                       |
| `data/*.js`                                                                                                      | Domain types in `src/domain/types.ts`; sample data in `src/dev/seed/` (development only)                                                       |
| `support.js` (Fable dc-runtime: loads React and Babel from unpkg at run time, compiles templates in the browser) | Removed from the app — standard Vite build, no runtime compilation, no CDN                                                                     |
| Google Fonts `<link>`                                                                                            | Same font files self-hosted (`src/assets/fonts`, SIL OFL) so the till renders offline                                                          |

## Removed from the deployable app

**Prototype runtime and wrappers:** `support.js`, `.thumbnail`, `<x-dc>` / `<helmet>` wrappers, `data-screen-label`
design annotations, `hint-placeholder-*` streaming hints, template-streaming placeholders.

**CMS / BOS code and storage:**

- `archive/bos-cms/` (already separate) stays archived.
- Shared-record media plumbing (`services/shared-records.js`): the CMS media library in `localStorage`
  (`et-pos-v1:media`), `productEdits` (CMS product overrides) and `pkgEdits` (catering package overrides) — the POS
  never wrote these; product data now comes only from the catalogue service.
- CMS permission scrubbing (`cms.*`) replaced by a general rule: unknown permissions in stored role data are dropped.
- CMS types `ContentBlock`, `ContentScope`, `ContentState`.
- Legacy `ops` storage fallbacks for `soldOut`, `branchOff`, `prices`, roles; storage namespace moved to `et-pos:v2:`.

**Dead code (verified unused):** `finalizeOrder`, `set()`, `showCatChips`, `readyKey`, `setCat`, the till's
`setCafe`, `railWidth`, `openNav`, `custTab`, the back office's unused `navGroups` / `staff` / `counts`, 10 unused
line icons (only the Staff icon is drawn as a vector), `photo().imgErr` (never bound), `pricing.splitEqual`,
`hours.isOpen`, `REWARD_LABEL`, `MAX_GUESTS_ONLINE`, `Order.refundNote` seed field, website-only location fields
(order URLs, booking labels, photos, notes, wait times), catering package photos.

**Assets moved to `archive/unused-assets/`:** navigation icons for the retired App, Web and CMS sections (6 PNGs),
`img-pos/app/` (4.2 MB), `img-pos/site/` (0.9 MB), `img-pos/catering/` (0.3 MB). Every remaining image is
referenced; all 74 menu photos the app requests exist. Shipped images are byte-identical to the approved files.

**Design references moved to `archive/design-references/`:** `screenshots/` (2.8 MB), `uploads/` (7.9 MB).

**Prototype-only controls:**

- Production builds no longer contain: simulated website/app orders and bookings, "Simulate connection loss",
  "Simulate a decline", device status switches, demo PIN hints, sample data. They remain in development builds,
  labelled as simulated.
- "Reset demo data" exists only in development with local data.
- Hard-coded figures moved into report data: "+8% vs last Friday", "+4.2% vs previous week", the loyalty activity
  list; "Best day" is now computed instead of hard-coded `'Sunday'`; "Sold this month" used a hard-coded `/Oct/`.
- Labels that presented simulations as live: Square eGift "connected" → "demo" (dev) / "not connected"
  (production); fake printer model and LAN addresses shown only in development.

## Behaviour fixes (each one deliberate)

| Issue in the prototype                                                                                                                                    | Change                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Till started signed in as the admin, with no PIN                                                                                                          | PIN sign-in required when nobody is signed in (existing PIN dialog, cannot be dismissed)                               |
| PINs checked against client-side seed data; new team members could not sign in at the till                                                                | PINs verified by `StaffAuthService`; PINs never stored in app state; staff added in Staff & roles can sign in          |
| Edits inside reachable sections ignored role permissions (e.g. managers with `staff.view` could change roles; cashiers could issue and top up gift cards) | Action-level checks using the prototype's manager-PIN approval flow; read-only fields where editing needs a permission |
| Orders with nothing left to pay (100% comp, free-coffee reward on a one-coffee order, gift card covering the bill) could not be completed                 | Completed with a zero tender (`reward` / `gift` method recorded)                                                       |
| Gift card numbers generated in the browser with `Math.random()`                                                                                           | Issued by the gift card service; dev uses the platform CSPRNG                                                          |
| Double-tap on "Send to kitchen" or a stale "Take cash" could create a second order                                                                        | Actions read live state and the tender reference must match the open payment dialog                                    |
| Loyalty threshold setting did not affect stamping (till hard-coded 9)                                                                                     | The configured threshold is used everywhere (default 9 — unchanged behaviour)                                          |
| "Stamp loyalty automatically" toggle did nothing                                                                                                          | Honoured (default on — unchanged behaviour)                                                                            |
| Every outbox/queue tick re-rendered the whole UI                                                                                                          | Store only notifies on real changes to the visible queue                                                               |

## Kept exactly as approved

Visual parity was measured, not assumed: both apps were rendered headless at 1440×900 and 1024×768 with the same
data and interactions, and compared pixel by pixel (30 scenarios each). See [VALIDATION.md](VALIDATION.md).
Business-rule parity was proven by running the archived JavaScript and the new TypeScript side by side on
randomised inputs (`src/domain/legacy-parity.test.ts`).

Two `style-hover` rules in the prototype (`background:{{ n.hoverBg }}` on navigation items and customer rows)
were never applied by its runtime (the value was inserted un-interpolated, i.e. invalid CSS). They were left out
so the approved look is unchanged.

## Known limitations / next steps

- Back-office markup is inline-styled exactly as approved, which makes `src/features/` long (≈13k lines after
  formatting). Extracting shared primitives (toggle switch, chip, KPI tile, drawer) would shrink it; it was not done
  here to avoid any visual drift.
- No idle auto-lock; offline PIN verification in `http` mode; rejected-command review screen; record cache
  encryption — see [INTEGRATIONS.md](INTEGRATIONS.md).
- Lossless recompression of the navigation PNGs was attempted and abandoned: the encoder could not guarantee
  byte-identical pixels, and the saving (~150 KB, cached once) did not justify changing approved assets.
