# StockMind AI

An AI-powered stock research and analysis dashboard built on top of a simulated mini-brokerage backend. StockMind AI lets users explore live market data, manage watchlists, place simulated trades, track portfolio performance, and receive real-time price alerts via web push notifications.

> Repository: [ohadfefer/stockmind-ai](https://github.com/ohadfefer/stockmind-ai)

---

## Features

- **Live market data** — real-time quotes, company profiles, news, and search via Finnhub.
- **Simulated brokerage** — buy/sell orders, executions, positions, cash ledger, and deposits/withdrawals, all persisted in Postgres.
- **Portfolio tracking** — per-position P&L, day change, portfolio weight, and daily position snapshots for historical performance.
- **Watchlists** — multiple named lists per account (e.g. "Tech Picks", "Earnings Watch") with per-symbol notes.
- **Price alerts** — `price_above`, `price_below`, `earnings`, and `ai_signal` conditions, evaluated by a signed QStash webhook and delivered through Web Push.
- **Missed-alerts inbox** — triggered alerts the user hasn't seen yet, surfaced in a bell dropdown and dismissed on read.
- **News feed** — general market news and per-symbol company news.
- **Account area** — balance, transfer history, and position history snapshots.
- **Auth** — Auth0 login/signup with an onboarding step that captures the user's full name.
- **Pro subscriptions** — Stripe-powered Checkout and Customer Portal for upgrading to StockMind Pro and managing billing (cancel, update card, view invoices); webhook-synced subscription state mirrored into Postgres.

---

## Tech Stack

**Framework & Language**
- [Next.js 16](https://nextjs.org) (App Router) with React 19 and TypeScript
- Tailwind CSS v4 with CSS variables for theming
- [shadcn/ui](https://ui.shadcn.com) (new-york style) on top of Radix UI primitives
- [Lucide](https://lucide.dev) icons and [Recharts](https://recharts.org) for charts

**Backend & Data**
- [Neon Serverless Postgres](https://neon.tech) via `@neondatabase/serverless`
- [Auth0](https://auth0.com) via `@auth0/nextjs-auth0` v4
- [Stripe](https://stripe.com) for subscription billing — Checkout, Customer Portal, and webhooks (`stripe` Node SDK)
- [Finnhub](https://finnhub.io) for live quotes, profiles, news, and market status
- [FMP](https://financialmodelingprep.com) (currently gated behind an issue — see `src/app/(main)/dashboard/page.tsx`)
- [Upstash Redis](https://upstash.com/redis) for caching
- [Upstash QStash](https://upstash.com/qstash) for signed webhook delivery to the alert checker
- [web-push](https://github.com/web-push-libs/web-push) + VAPID keys for browser push notifications
- [Vercel Cron](https://vercel.com/docs/cron-jobs) for scheduled jobs
- [@vercel/analytics](https://vercel.com/docs/analytics) for page analytics

**Tooling**
- ESLint (`eslint-config-next`)
- `shadcn` CLI for component scaffolding
- Deployed on [Vercel](https://vercel.com)

---

## Prerequisites

- **Node.js** — a version compatible with Next.js 16 (Node 20+ recommended)
- **npm** (the repo uses `package-lock.json`)
- **Git**
- Accounts / credentials for:
  - Auth0 tenant (with a Regular Web Application configured)
  - Neon Postgres project
  - Finnhub API key
  - Upstash Redis database
  - Upstash QStash (signing keys)
  - VAPID key pair for Web Push (generate with `npx web-push generate-vapid-keys`)
  - Stripe account (test mode is sufficient for local dev) and the [Stripe CLI](https://stripe.com/docs/stripe-cli) for forwarding webhooks to localhost
  - Vercel account (for cron jobs and deployment) — optional for local dev

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/ohadfefer/stockmind-ai.git
cd stockmind-ai

# 2. Install dependencies (all app code lives under frontend/)
cd frontend
npm install

# 3. Configure environment
#    Create frontend/.env.local and fill in the variables listed below.
#    This file is gitignored — never commit it.

# 4. Run database migrations against your Neon database
#    Apply each file in /migrations in order (001 → 013).
#    They are plain SQL — run them via psql, the Neon SQL editor,
#    or any Postgres client.

# 5. Start the dev server
npm run dev
# → http://localhost:3000
```

On first login you'll be routed through `/onboarding` to capture your name, which calls `POST /api/auth/insert-user` and inserts a row into `users`. A default brokerage account is created lazily the first time you access a feature that needs one.

---

## Project Structure

```
stockmind-ai/
├── CLAUDE.md                 # Repo conventions / agent context
├── migrations/               # Plain .sql files — schema of record (run manually)
│   ├── 001_create_users.sql
│   ├── 002_create_accounts.sql
│   ├── 003_create_cash_ledger.sql
│   ├── 004_create_orders.sql
│   ├── 005_create_executions.sql
│   ├── 006_create_positions.sql
│   ├── 007_create_position_history.sql
│   ├── 008_create_transfers.sql
│   ├── 010_create_watchlists.sql
│   ├── 011_create_stock_alerts.sql
│   ├── 012_create_push_subscriptions.sql
│   ├── 013_create_missed_alerts.sql
│   └── 017_add_subscriptions.sql
└── frontend/                 # Next.js app — all code lives here
    ├── public/
    │   ├── sw.js             # Service worker for Web Push
    │   └── ...               # Icons, placeholder assets
    ├── vercel.json           # Vercel cron definitions
    └── src/
        ├── proxy.ts          # Next.js 16 proxy — Auth0 middleware + route protection
        ├── app/
        │   ├── layout.tsx    # Root layout (Auth0Provider, Vercel Analytics)
        │   ├── globals.css
        │   ├── (auth)/       # Centered layout — login, signup, onboarding
        │   └── (main)/       # Dashboard shell — sidebar + header
        │       ├── page.tsx           # Landing / home
        │       ├── dashboard/         # Main dashboard
        │       ├── portfolio/         # Holdings, orders, trade, alerts tabs
        │       ├── watchlist/         # Watchlists
        │       ├── news/              # Market & per-symbol news
        │       ├── details/[symbol]/  # Stock detail page
        │       ├── account/           # Balance, transfers, history
        │       ├── settings/          # User preferences (notifications, payments)
        │       └── api/               # Route handlers (see API section, includes /api/stripe/{checkout,portal,webhook})
        ├── components/
        │   ├── ui/           # shadcn/ui primitives — do not manually edit
        │   ├── dashboard/    # Dashboard widgets
        │   ├── portfolio/    # Portfolio tabs and tables
        │   ├── watchlist/    # Watchlist UI
        │   ├── details/      # Stock detail widgets
        │   ├── alerts/       # Alerts table + missed-alerts bell
        │   ├── account/      # Account tabs
        │   ├── settings/     # Settings form (notifications, payments)
        │   ├── sidebar.tsx
        │   └── header.tsx
        ├── actions/          # Client-side API call functions (named exports)
        ├── services/         # Server-side data-fetching functions
        │   ├── alerts/       # alerts-service, alert-checker-service, missed-alerts-service
        │   ├── dashboard/    # sector, index, and watchlist aggregates
        │   ├── position/     # position-service, position-history-service
        │   ├── stripe/       # stripe-service, webhook-service, subscription-service, customer-portal-service
        │   └── ...           # user, account, order, execution, transfer, stock, watchlist, push-subscription, notification
        ├── hooks/            # Custom React hooks (use-mobile, use-notifications, use-toast)
        ├── lib/              # auth0, db (Neon), finnhub, fmp, redis, format, utils
        ├── types/            # Ambient type declarations
        └── styles/           # Additional global styles
```

### Conventions

These conventions come from `CLAUDE.md` — please follow them when adding code:

- **Services** — server-side data fetching lives in `src/services/<domain>-service.ts`, not inside page files. Pages import from services and focus on rendering.
- **Actions** — client-side API calls (POST, DELETE, etc.) live in `src/actions/<domain>.ts` as named functions (e.g. `createAlert`, `submitOrder`, `dismissMissedAlerts`). Components call these instead of making inline `fetch` calls.
- **shadcn/ui** — add components via `npx shadcn@latest add <name>` from `frontend/`. Do not manually edit files in `src/components/ui/`.
- **Path alias** — `@/*` maps to `frontend/src/*`.
- **Route groups** — `(auth)` and `(main)` do not affect URLs; they only scope layouts.

---

## Available Scripts

Run from `frontend/`:

```bash
npm run dev      # Start the Next.js dev server on localhost:3000
npm run build    # Production build
npm run start    # Start the production build
npm run lint     # Run ESLint
```

<!-- TODO: No automated test suite or `npm test` script is configured yet. Add unit/integration tests and document the command here. -->

---

## Environment Variables

All variables live in `frontend/.env.local` (gitignored). Never commit real secrets.

### Application

| Variable        | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `APP_BASE_URL`  | Base URL of the app, e.g. `http://localhost:3000` in dev.               |

### Auth0

| Variable              | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `AUTH0_DOMAIN`        | Your Auth0 tenant domain (`*.auth0.com`).              |
| `AUTH0_CLIENT_ID`     | Auth0 application client ID.                           |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret.                       |
| `AUTH0_SECRET`        | Session encryption secret (32+ random bytes).          |

### Database — Neon Postgres

| Variable       | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| `DATABASE_URL` | Pooled Neon Postgres connection string used by the app.     |

<!-- TODO: Vercel's Neon integration also injects PG*/POSTGRES_* and DATABASE_URL_UNPOOLED. Document which (if any) are required by app code vs. only by tooling. Currently only DATABASE_URL is read by `src/lib/db.ts`. -->

### Market Data

| Variable          | Description                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `FINNHUB_API_KEY` | Finnhub API key — required for quotes, search, profiles, news.     |
| `FMP_API_KEY`     | Financial Modeling Prep key — used by some dashboard widgets.      |

### Upstash Redis & QStash

| Variable                     | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`     | Upstash Redis REST URL.                                  |
| `UPSTASH_REDIS_REST_TOKEN`   | Upstash Redis REST token.                                |
| `QSTASH_URL`                 | QStash base URL for publishing messages.                 |
| `QSTASH_TOKEN`               | QStash auth token for publishing.                        |
| `QSTASH_CURRENT_SIGNING_KEY` | Current signing key used to verify inbound QStash calls. |
| `QSTASH_NEXT_SIGNING_KEY`    | Next signing key for seamless rotation.                  |

### Web Push Notifications

| Variable                      | Description                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key (exposed to the browser to register push subscriptions).            |
| `VAPID_PRIVATE_KEY`            | VAPID private key (server only) used to sign push payloads via `web-push`.           |

### Stripe (Subscriptions)

| Variable                | Description                                                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`     | Stripe secret API key (server only). Use a test-mode `sk_test_...` for local dev.                                                                    |
| `STRIPE_PRICE_ID`       | Price ID of the Pro plan (`price_...`) used as the line item in Checkout.                                                                            |
| `STRIPE_WEBHOOK_SECRET` | Signing secret used to verify `POST /api/stripe/webhook` payloads. In dev, the `whsec_...` printed by `stripe listen`; in prod, the endpoint secret. |

### Scheduled Jobs

| Variable      | Description                                                                            |
| ------------- | -------------------------------------------------------------------------------------- |
| `CRON_SECRET` | Shared secret sent by Vercel Cron as `Authorization: Bearer <secret>` to job handlers. |

---

## Database

The schema of record is the set of plain SQL files in `/migrations/`. They are applied manually against Neon (via `psql` or the Neon SQL editor). Each file is idempotent where possible (`IF NOT EXISTS`).

High-level model:

- **users** — one row per Auth0 identity (`auth0_id` is unique).
- **accounts** — brokerage accounts; a user can own more than one (e.g. "growth", "dividends").
- **cash_ledger** — append-only cash movements. Never `UPDATE`/`DELETE`; `running_balance` gives O(1) balance reads.
- **orders** / **executions** / **positions** / **position_history** — trade instructions, fills, materialized holdings, and daily snapshots that power portfolio charts.
- **transfers** — deposits/withdrawals; on completion a matching row is appended to `cash_ledger`.
- **watchlists** / **watchlist_items** — named lists of symbols, scoped per account.
- **stock_alerts** — price/earnings/AI alerts (enum `alert_condition` + `alert_status`).
- **push_subscriptions** — Web Push endpoints registered per user.
- **missed_alerts** — triggered alerts the user hasn't acknowledged, dismissed when the bell dropdown is read.
- **subscriptions** — Stripe-mirrored billing rows (one per Stripe subscription). `users.subscription_plan` and `users.stripe_customer_id` are denormalized for hot-path reads; the table is the audit trail synced from webhooks.

<!-- TODO: Migration 009 is intentionally skipped in the filename sequence — confirm whether this is a historical gap or a pending migration and document it here. -->

---

## API Documentation

All route handlers live under `frontend/src/app/(main)/api/`. Session-protected routes require a valid Auth0 session (see `proxy.ts`); public-but-signed routes are called out explicitly. All JSON responses are `application/json`.

### Authentication

Auth0 v4 SDK auto-registers the standard routes under `/auth/*`:

- `GET  /auth/login` — start login
- `GET  /auth/logout` — end session
- `GET  /auth/callback` — Auth0 callback
- `GET  /auth/profile` — current user profile

After Auth0 signup, the onboarding page calls:

- `POST /api/auth/insert-user` — upsert the user record.
  Body: `{ "fullName": string }` · Response: `{ "status": "saved" }`

### Market Data (Finnhub proxies)

- `GET /api/market/status?exchange=US`
- `GET /api/stocks/quote?symbol=AAPL`
- `GET /api/stocks/search?q=apple`
- `GET /api/stocks/profile?symbol=AAPL`
- `GET /api/stocks/market-cap?symbol=AAPL`
- `GET /api/stocks/trades?symbol=AAPL`
- `GET /api/news/market?category=general&minId=<id>`
- `GET /api/news/company?symbol=AAPL&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/sectors/performance`

### Portfolio & Orders

- `GET    /api/portfolio/summary` — running balance, total P&L, today's P&L, holdings with per-position weights.
- `GET    /api/portfolio/trading-info` — info needed by the trade form.
- `POST   /api/orders` — create a filled order.
  Body: `{ symbol, side: "buy"|"sell", orderType, quantity, averageFillPrice, filledAt }`
- `DELETE /api/orders` — cancel an order. Body: `{ orderId }`
- `POST   /api/orders/execute` — record an execution against an existing order.

### Transfers

- `POST /api/transfers` — create a deposit or withdrawal. Resolves asynchronously (~10s simulated processing).
  Body: `{ direction: "deposit"|"withdrawal", amount, method, description? }`

### Watchlists

- `GET    /api/watchlist?symbol=AAPL` — is the symbol in the user's default list?
- `POST   /api/watchlist` — add a symbol to the default list. Body: `{ symbol }`
- `DELETE /api/watchlist` — remove a symbol. Body: `{ symbol, watchlistId? }`
- `GET    /api/watchlist/lists?symbol=AAPL` — which of the user's lists contain the symbol.
- `POST   /api/watchlist/lists` — add/remove a symbol from a specific list. Body: `{ watchlistId, symbol, add: boolean }`
- `POST   /api/watchlist/create` — create a new watchlist.
- `PATCH  /api/watchlist/manage` — rename a watchlist. Body: `{ watchlistId, name }`
- `DELETE /api/watchlist/manage` — delete a watchlist. Body: `{ watchlistId }`

### Alerts

- `GET    /api/alerts` — list alerts for the current account.
- `POST   /api/alerts` — create an alert. Body: `{ symbol, condition: "price_above"|"price_below"|"earnings"|"ai_signal", targetValue }`
- `DELETE /api/alerts` — delete an alert. Body: `{ alertId }`
- `GET    /api/alerts/missed` — list triggered-but-unseen alerts.
- `DELETE /api/alerts/missed` — dismiss all missed alerts for the current account.
- `POST   /api/alerts/test-notification` — send a test push notification to the current user.
- `POST   /api/alerts/check` — **QStash webhook** (no Auth0 session; signature-verified via `QSTASH_CURRENT_SIGNING_KEY`/`QSTASH_NEXT_SIGNING_KEY`). Evaluates every active price alert, atomically claims triggered rows, sends pushes, reverts alerts whose every push failed, and records `missed_alerts` for the rest.

### Push Subscriptions

- `POST   /api/push-subscription` — register a browser subscription.
  Body: `{ endpoint, p256dh, auth }` · Endpoint host is validated against an allowlist (FCM, Mozilla, WNS, Apple).
- `DELETE /api/push-subscription` — remove a subscription. Body: `{ endpoint }`

### Subscriptions / Billing

- `POST /api/stripe/checkout` — start a Stripe Checkout session for the Pro plan. Returns `{ url }` to redirect to. Reuses the user's saved `stripe_customer_id` if present so returning subscribers don't get a duplicate Stripe Customer.
- `POST /api/stripe/portal` — create a Stripe Customer Portal session (self-service card update / cancel / invoice history). Returns `{ url }`. Returns 400 if the user has not subscribed yet.
- `POST /api/stripe/webhook` — **Stripe webhook** (no Auth0 session; signature-verified via `STRIPE_WEBHOOK_SECRET`, pinned to the Node runtime to read the raw body). Handles `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`; mirrors state into `subscriptions` and flips `users.subscription_plan` in a single transaction.

#### Local development

In a separate terminal, forward Stripe events to the dev server with the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` in `frontend/.env.local`. Trigger lifecycle events with e.g. `stripe trigger checkout.session.completed` or `stripe trigger customer.subscription.deleted`.

### Scheduled Jobs

- `GET /api/jobs/snapshot-positions` — **Vercel Cron** (auth via `Authorization: Bearer ${CRON_SECRET}`). Writes a daily row to `position_history` for every open position. Scheduled in `frontend/vercel.json` as `30 21 * * 1-5` (weekdays 21:30 UTC, after US market close).

### Example

```bash
# Create a price alert (session cookie required)
curl -X POST http://localhost:3000/api/alerts \
  -H 'Content-Type: application/json' \
  -b cookies.txt \
  -d '{"symbol":"AAPL","condition":"price_above","targetValue":200}'
```

---

## Background Jobs

Two recurring processes drive most of the "live" behavior:

1. **Alert checker** — `POST /api/alerts/check` is triggered by an Upstash QStash schedule. The handler verifies the Upstash signature, fetches current quotes for every active alert's symbol, and atomically transitions matching rows to `triggered`. Alerts whose push notifications all fail are reverted to `active`; successful ones are mirrored into `missed_alerts` so the user sees them in the bell dropdown.
2. **Position snapshots** — `GET /api/jobs/snapshot-positions` runs on Vercel Cron (`vercel.json`) every weekday at 21:30 UTC. It writes a `position_history` row per open position so the portfolio charts have an end-of-day anchor.

<!-- TODO: Document how to configure the QStash schedule/destination pointing at /api/alerts/check (URL, HTTP method, frequency) so a new contributor can wire it up from scratch. -->

---

## Deployment

The app is designed to deploy to [Vercel](https://vercel.com):

- `vercel.json` declares the cron schedule for `snapshot-positions`.
- `@vercel/analytics` is mounted in `app/layout.tsx`.
- The service worker at `public/sw.js` is served at `/sw.js`.

To deploy:

1. Import the repo into Vercel.
2. Set the **Root Directory** to `frontend/`.
3. Configure every variable from [Environment Variables](#environment-variables) in the Vercel project settings.
4. Apply any pending `/migrations/*.sql` to your Neon database.
5. Point your QStash schedule at `https://<your-domain>/api/alerts/check`.

---

## Contributing

<!-- TODO: No CONTRIBUTING.md or formal process is checked in yet. The notes below are inferred from repo state and CLAUDE.md — please formalize. -->

Inferred from repo history and conventions:

1. **Branching** — feature branches off `master` (examples from recent history: `mobile-alerts`, `alerts-crud`, `portfolio-performance-UI`). Open a PR back into `master`.
2. **Commit messages** — short, imperative, lowercase-ish ("Fix missed alerts scoping and dismiss timing", "Add settings page with notification toggle"). Scope each commit tightly.
3. **Code style**
   - Follow the conventions in [`CLAUDE.md`](./CLAUDE.md) — especially the `services/` and `actions/` split.
   - Keep page components focused on rendering; push data fetching into `services/` and client `fetch` calls into `actions/`.
   - Do not hand-edit `src/components/ui/` — regenerate via the `shadcn` CLI.
   - Run `npm run lint` before pushing.
4. **Migrations** — add new `.sql` files under `/migrations/` with the next numeric prefix. Never edit an already-applied migration; write a new one instead.
5. **Secrets** — never commit `.env*.local` files or anything derived from them. The `.gitignore` already excludes them.

---

## License

<!-- TODO: No LICENSE file is present at the repo root. Decide on a license (MIT / Apache-2.0 / proprietary / etc.), add a LICENSE file, and update this section. Until then, all rights are reserved by the repository owner. -->

No license file has been added to the repository yet, so by default all rights are reserved by the author. If you intend this project to be open source, add a `LICENSE` file at the repo root and update this section accordingly.
