# EightyTwenty POS

Point of sale for EightyTwenty cafés: till and new orders, orders & kitchen, dashboard, reservations, catering,
customers, loyalty, gift cards, inventory & menu, reports, staff & roles and settings.

React 19 + TypeScript, built with Vite. No runtime dependencies besides React.

> **Status: release candidate, not production-ready.** The front end is complete and tested, but the shared
> EightyTwenty backend, card terminal, printers, cash drawer, gift card provider and electronic invoicing are
> **not connected yet**. See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) before deploying.

## Requirements

- Node.js 20.19 or newer (tested with Node 24) and npm.

## Quick start (development)

```bash
npm install
npm run dev
```

Open http://localhost:5173. Development uses the **local** data provider: sample menu, cafés, customers and
orders kept in this browser only. Development sign-in PINs (sample data only): Admin `2468`, Manager `1357`,
Cashier `1111`.

Development builds also show simulators (mock website/app orders, connection loss, simulated card terminal and
printers). They are labelled "simulated" and never exist in builds that use the real backend.

## Scripts

| Command             | What it does                                                     |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Development server with hot reload                               |
| `npm run build`     | Type-check, then production build into `dist/`                   |
| `npm run preview`   | Serve the production build locally                               |
| `npm run typecheck` | TypeScript (strict)                                              |
| `npm run lint`      | ESLint                                                           |
| `npm run format`    | Prettier (write) — `format:check` to verify only                 |
| `npm test`          | Unit, workflow, regression and UI smoke tests (Vitest)           |
| `npm run validate`  | Everything above in order: typecheck, lint, format, tests, build |

## Configuration

Copy [.env.example](.env.example) to `.env.local` (development) or `.env.production.local` (builds).
Every `VITE_*` variable is compiled into the browser bundle — **never put secrets or credentials there**.

| Variable                              | Purpose                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `VITE_DATA_PROVIDER`                  | `local` (development data in this browser) or `http` (EightyTwenty API) |
| `VITE_API_BASE_URL`                   | Backend base URL, `https://` required outside localhost                 |
| `VITE_API_TIMEOUT_MS`                 | Request timeout (default 15000)                                         |
| `VITE_TERMINAL_ID`                    | Identifies this till to the backend                                     |
| `VITE_ENABLE_DEV_TOOLS`               | Simulators in a non-dev build with local data (demo only)               |
| `VITE_ALLOW_LOCAL_DATA_IN_PRODUCTION` | Allow a production build with local sample data (sales demos only)      |

A production build refuses to start (and says why) when it is not configured, or when it would run on local
sample data without `VITE_ALLOW_LOCAL_DATA_IN_PRODUCTION=true`.

## Production build

```bash
# .env.production.local
VITE_DATA_PROVIDER=http
VITE_API_BASE_URL=https://api.example.com   # the EightyTwenty backend
VITE_TERMINAL_ID=PHILLIP-TILL-1
```

```bash
npm ci
npm run validate
```

Deploy `dist/` as static files. The app uses hash routing (`#till`, `#orders`…), so no server rewrites are
needed. Serve `index.html` with `Cache-Control: no-cache` and `dist/assets/*` (content-hashed) as immutable.
With `VITE_DATA_PROVIDER=http` the bundle contains no sample data, demo PINs or simulators.

## Project layout

```
src/
  domain/      Business rules (pure, typed, unit-tested): pricing & GST, payments ledger, refunds,
               loyalty, opening hours & booking slots, permissions, policies, domain models
  services/    Integration seam: typed backend contracts, command outbox, HTTP client & adapter,
               device (terminal/printer/drawer) contracts, offline record cache
  state/       Store (state container), snapshot mapping, actions (orders, payments, shifts, tables,
               sync, catalogue, auth, till)
  features/    Screens: shell/navigation, till, dialogs, back office (ops). Each screen has a typed
               view-model builder (*.view.ts) and a presentational component (*.tsx)
  dev/         DEVELOPMENT ONLY: local backend, sample data, device simulator, website/app simulations
  app/         Bootstrap, error boundary, loading / error / configuration screens
  assets/fonts Self-hosted Newsreader and Figtree (SIL OFL)
  styles/      Global CSS
public/        Navigation icons, wordmark, menu photos (approved originals, unchanged)
archive/       NOT DEPLOYED: approved prototype, archived BOS/CMS code, design references, unused assets
docs/          Integration status, cleanup report, validation results
```

## How it works

- **State:** one store (`src/state/store.ts`) holds this till's working copy of shared records plus device
  session (cart, signed-in staff, layout). Screens read it through `useStore()` and render view-models.
- **Backend writes:** every business change (order, payment, refund, stamp, booking, stock…) is queued as a
  typed command with its own idempotency key in a persisted **outbox**, delivered in order and retried after
  network failures. Payments are also idempotent in the till itself (a double tap is ignored).
- **Money:** order and line prices in dollars rounded to cents; payments, refunds and cash in integer cents.
  The backend must recompute and validate all totals.
- **Permissions:** checked in the UI (section gates and manager-PIN approval for refunds, discounts ≥ 50%,
  cash out, variance, and back-office edits). The backend must enforce the same rules.
- **Offline:** cash sales and kitchen orders continue offline and queue for sync; card, wallet and gift card
  payments pause.

See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) for the API contract and what is still to be connected, and
[docs/CLEANUP_REPORT.md](docs/CLEANUP_REPORT.md) for what changed from the prototype.
