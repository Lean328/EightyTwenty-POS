# Validation results

Run on 10 Oct 2026, Windows 11, Node 24.18, npm 11.16. All results below are from actual runs.

## `npm install`

233 packages installed, **0 vulnerabilities**. Runtime dependencies: `react`, `react-dom` only.

## `npm run validate` — exit code 0

| Step                                                                                    | Result                       |
| --------------------------------------------------------------------------------------- | ---------------------------- |
| `tsc -b` (strict, `noUnusedLocals`, `noUnusedParameters`)                               | 0 errors                     |
| `eslint .` (typescript-eslint, react-hooks, react-refresh, `no-console`, `no-debugger`) | 0 problems                   |
| `prettier --check .`                                                                    | all files formatted          |
| `vitest run`                                                                            | **7 files, 59 tests passed** |
| `vite build`                                                                            | succeeded                    |

Production bundle (`VITE_DATA_PROVIDER=local`):

| Chunk                                                                         | Size   | gzip   |
| ----------------------------------------------------------------------------- | ------ | ------ |
| `index-*.js` — till, cart, all payment dialogs, store                         | 404 kB | 114 kB |
| `OpsScreen-*.js` — back office (prefetched 1.5 s after start)                 | 150 kB | 34 kB  |
| `localBackend-*.js` + `simulations-*.js` + `simulatedDevices-*.js` — dev only | 44 kB  | 14 kB  |
| CSS                                                                           | 3 kB   | 0.9 kB |
| Fonts (6 × woff2, loaded by unicode-range)                                    | 492 kB | —      |

With `VITE_DATA_PROVIDER=http` the three development chunks are not emitted, and a search of the output finds no
sample customers, staff names, demo PINs or gift card numbers.

## Tests (59)

- **Domain rules** (26): pricing and GST, discounts, delivery, card surcharge, gift caps; cents conversion, cash
  rounding, seeded payments, refundable/due, proportional line values, refund allocation, equal shares, drawer
  expectation; loyalty stamping and roll-over; opening hours and booking slots; permissions and role sanitising;
  stock state, table joins.
- **Parity with the approved prototype** (4): the archived JavaScript and the new TypeScript give identical
  results for 2,000 random carts (totals, unit prices, required modifiers, stamps, reward value), 2,000 random
  multi-tender orders (refund allocation, refundable, due, line shares, equal shares, cash rounding, surcharge),
  500 stamp roll-overs, and booking slots for every café over four weeks.
- **Services** (8): outbox ordering, stable idempotency keys, retry after network failure, rejection without
  retry, persistence across reload; HTTP headers, error classification, offline and timeout handling.
- **Till workflows** (19): cash sale end to end (order, tender, change, drawer, backend commands); 5c rounding and
  short tender; double-tap protection; card via terminal with surcharge, decline and retry; terminal offline (no
  order created); equal split; 100% comp; loyalty stamps and free-coffee redemption; gift card applied, redeemed
  and restored on refund; cashier refund requiring manager PIN (cashier's own PIN refused, approver recorded);
  partial refund and duplicate-action protection; void on an open tab; cancellation; send-to-kitchen
  double-tap; offline queue, sync and sold-out conflicts; shift close with variance needing a note; section
  locks by role; catering validation and quote; gift card issue; adding staff and refusing a duplicate PIN.
- **UI smoke tests** (2, rendered app): PIN sign-in cannot be dismissed, wrong PIN refused, sale to receipt;
  locked section asks a cashier for a manager PIN.

## Visual parity with the approved prototype

Prototype (served from an untouched copy) and the new app rendered headless in Chrome with the same sample data
and the same interactions, screenshots compared pixel by pixel (pixelmatch, threshold 0.1).

| Viewport                        | Scenarios | Pixel-identical | Different                                                                                                                                                                   |
| ------------------------------- | --------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1440 × 900                      | 30        | 27              | Sync dialog (858 px) and Settings (898 px): intentional wording — no longer labelling simulations as live; Payment dialog (1 px): anti-aliasing from splitting one sentence |
| 1024 × 768 (narrow till layout) | 30        | 28              | the same two intentional wording changes                                                                                                                                    |

Scenarios: till; live orders; order detail; tables; kitchen; held; cart; item, payment, shift, sync, café,
customer, discount, note, staff, PIN, table and refund dialogs; dashboard, orders, reservations, catering,
customers, loyalty, gift cards, inventory (full page, 5,233 px), reports, staff, settings.

## End-to-end on a production build (`vite build` + `vite preview`)

Sign-in required → wrong PIN refused → admin sign-in → open shift → cash sale ($20 tendered, change $14.50) →
switch to cashier → cashier refund blocked until a manager PIN → locked section asks for PIN → all 11
back-office routes → back to till → reload keeps the sale and the signed-in staff member. All steps passed.

- HTTP errors: **none** (fonts, navigation icons, wordmark and menu photos all loaded; 117 image responses).
- Console / page errors: **none**.
- Fonts in use: Newsreader and Figtree from the bundle (no Google Fonts request).

## Failure paths

- `http` build pointed at an unreachable server → "The till could not load · Could not reach the EightyTwenty
  server. Nothing has been charged." with **Try again**.
- `npm run build` with no configuration → "This till is not configured" listing the missing settings; the till
  does not start on sample data.

## Not tested

- Any real backend, card terminal, printer, cash drawer, gift card provider or invoicing service (none exist yet).
- Touch hardware, barcode / loyalty card scanners, and browsers other than Chrome (headless) and jsdom.
- Long-running soak tests and multiple tills sharing one backend.
