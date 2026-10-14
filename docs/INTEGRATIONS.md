# Integrations — contract and status

The POS is one part of the EightyTwenty ecosystem (website, mobile app, POS, BOS, electronic invoicing) that will
share one backend and database. **The POS owns no data.** It loads a working snapshot for one till, applies changes
optimistically, and sends each change to the backend as an idempotent command.

Nothing below is connected to a real service yet. No working integration has been invented: where a real service
is missing, production builds fail safely and say so; development builds use clearly labelled simulators.

## Where the seams are

| File                               | What it is                                                                  |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `src/services/contracts.ts`        | Typed service interfaces (`PosBackend`) and the start-up snapshot shape     |
| `src/services/commands.ts`         | Every write the till makes, as a typed command, and its route to a service  |
| `src/services/outbox.ts`           | Durable ordered queue: idempotency keys, retry with backoff, rejection list |
| `src/services/http/httpClient.ts`  | Fetch wrapper: timeouts, typed `ApiError`, offline detection, headers       |
| `src/services/http/httpBackend.ts` | HTTP adapter — **proposed, untested endpoint paths**, all in one file       |
| `src/services/devices.ts`          | Card terminal, printers, cash drawer contracts; production "not connected"  |
| `src/domain/types.ts`              | Domain models (orders, payments, customers, bookings, gift cards, staff…)   |
| `src/dev/localBackend.ts`          | Development-only implementation in browser storage                          |

Requests carry `Idempotency-Key` (one per command, reused on retry), `X-Terminal-Id`, and use
`credentials: 'include'` for a staff session issued by the backend. No API keys are bundled.

## Service contracts

| Area                                 | Interface                                | Operations                                                                                                                 |
| ------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Start-up                             | `PosBackend.loadSnapshot`                | Menu, cafés, tables, promotions, availability, stock, records, settings, reports                                           |
| Orders and payments                  | `OrdersService`, `PaymentsService`       | create, status, accept, refund/void/cancel (`adjust`), tables, record tender, list changes since cursor                    |
| Products, menu and availability      | `CatalogService`                         | sold out, per-café availability, price override, modifier availability, category order, stock adjust                       |
| Customers and loyalty                | `CustomersService`, `LoyaltyService`     | profile update, stamp/reward balance with reason, programme settings                                                       |
| Reservations and catering            | `ReservationsService`, `CateringService` | upsert (same records the website and app create)                                                                           |
| Gift cards                           | `GiftCardsService`                       | issue (card number assigned by provider), balance adjustments                                                              |
| Staff authentication and permissions | `StaffAuthService`                       | verify PIN → staff + enforced permissions, create staff, role, role matrix                                                 |
| Transaction and invoicing records    | `TransactionRecordsService`              | transaction records (sale, payment, refund, void, cancel, gift issue, cash in/out), audit log, shifts, tax invoice request |
| Settings                             | `SettingsService`                        | business rules, till toggles, café detail overrides                                                                        |

## Still requires real backend services

| #   | Integration                                              | Current behaviour                                                                                                                                       | Needed                                                                                                                                                                                                     |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Shared EightyTwenty API**                              | `http` provider calls the proposed paths in `httpBackend.ts`; unreachable → "The till could not load", nothing charged                                  | Published API matching `contracts.ts` (or adapter updated), server-side validation and recomputation of every total, idempotency-key support                                                               |
| 2   | **Staff authentication**                                 | PIN checked via `StaffAuthService.verifyPin`; 5 failed attempts → 30 s lockout on the till                                                              | Server PIN verification with rate limiting, staff session (cookie), server-side enforcement of every permission. Offline PIN checks are not supported in `http` mode (manager approvals need a connection) |
| 3   | **Card terminal** (Tyro / Square Terminal)               | Production: "No card terminal is connected — no charge was made". Dev: simulator (approve / decline / offline)                                          | Terminal SDK behind `DeviceHub.chargeCard`, using the payment `ref` as the terminal idempotency reference; tips on terminal                                                                                |
| 4   | **Receipt printer, kitchen docket printer, cash drawer** | Production: reported as not connected, nothing printed, drawer must be opened manually                                                                  | Printer/drawer SDK behind `DeviceHub`                                                                                                                                                                      |
| 5   | **Gift card provider** (Square eGift)                    | Production: issuing fails with an explanatory error. Dev: development card numbers                                                                      | Provider integration for issue, balance, redeem, restore; card numbers come only from the provider                                                                                                         |
| 6   | **Website and app orders**                               | `http`: polls `OrdersService.listChanged` every 15 s and merges by order id. Dev: simulated feed                                                        | Endpoint (or push channel) with a change cursor; acceptance and status changes reflected to customers                                                                                                      |
| 7   | **Website and app bookings / catering**                  | Same records via `ReservationsService` / `CateringService`. Dev: simulated requests                                                                     | Backend normalising website/app submissions into these records (the website and app currently only draft an email)                                                                                         |
| 8   | **Electronic invoicing**                                 | Transaction records are queued for the ledger; `requestTaxInvoice` exists in the contract but is not wired to any screen                                | Invoicing service; a "send tax invoice" action on completed orders                                                                                                                                         |
| 9   | **Reports**                                              | Read-only figures from the snapshot (`ReportsData`), including the dashboard comparison lines                                                           | Reporting endpoint computed from the shared ledger                                                                                                                                                         |
| 10  | **Order numbers**                                        | Till issues provisional `#8020-<n>` numbers from a per-device sequence                                                                                  | Server-assigned or server-confirmed numbering across tills                                                                                                                                                 |
| 11  | **Pricing rules**                                        | GST, card surcharge (2.95%) and delivery (10%) are constants in `src/domain/pricing.ts` and `ledger.ts`; the Settings fields for them are informational | Single source of truth in the backend; the till should read them from the snapshot                                                                                                                         |
| 12  | **Promotions**                                           | Development has three demo codes; production reads `promotions` from the snapshot                                                                       | Promotions service; server-side validation of codes                                                                                                                                                        |
| 13  | **Apple Wallet passes**                                  | Status shown only                                                                                                                                       | Pass issuing service                                                                                                                                                                                       |
| 14  | **Rejected commands**                                    | Commands the backend rejects (4xx) are kept on the device in `outbox.rejected`                                                                          | Show rejected commands to a manager with a resolution flow                                                                                                                                                 |

## Data kept on the till

- **Outbox** (pending commands) and **session** (cart in progress, held orders, signed-in staff) in `localStorage`
  under `et-pos:v2:*`, so a reload or crash never loses a sale.
- **Record cache**: the last working snapshot, used to start offline in `http` mode. It contains customer contact
  details — tills should be managed devices, and the cache should move to encrypted storage or be limited in scope
  when the backend is connected.
- Nothing is written to BOS data; the POS only sends its own commands.

## Security notes

- No secrets in the bundle; configuration is validated at start-up (`src/config/env.ts`), `https` is required
  outside localhost.
- The till requires a PIN sign-in when no staff member is signed in. There is no idle auto-lock yet — recommended
  before production.
- Front-end permission checks shape the UI only; the backend must authorise every command.
