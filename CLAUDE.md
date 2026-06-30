# CLAUDE.md

## Project Overview

StockMind AI is an AI-powered stock research dashboard built on a simulated mini-brokerage. Users explore live market data, place simulated trades, track portfolio P&L, manage watchlists, set price alerts (delivered via Web Push), chat with an AI assistant, and upgrade to a Pro plan. It's installable as a PWA and deployed on AWS ECS Fargate.

`README.md` holds the exhaustive docs (full API reference, DB schema, env-var tables, deployment). Keep this file as the concise agent cheat-sheet.

## Commands

All commands run from the `frontend/` directory:

```bash
cd frontend
npm run dev      # Dev server (Next.js on localhost:3000)
npm run build    # Production build
npm run start    # Run the production build
npm run lint     # ESLint
```

No automated test suite is configured yet.

## Architecture

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **UI**: shadcn/ui (new-york style, Radix primitives, Lucide icons); charts via Recharts
- **Auth**: Auth0 (`@auth0/nextjs-auth0` v4)
- **Database**: Neon Serverless Postgres (`@neondatabase/serverless`), project `misty-bread-61945131`
- **Market data**: Finnhub (primary — quotes, search, profiles, news) + FMP (some dashboard widgets)
- **AI**: xAI Grok via the Vercel AI SDK (`ai` + `@ai-sdk/xai`) — assistant + portfolio review
- **Payments**: Stripe (Checkout, Customer Portal, webhooks) for Pro subscriptions
- **Jobs / webhooks**: Upstash QStash (signed) drives the alert checker and daily position snapshots
- **Push**: `web-push` + VAPID keys, delivered through the PWA service worker
- **Hosting**: Docker → Amazon ECR → ECS Fargate (ARM64) behind an ALB; CI/CD via GitHub Actions on push to `master` (see README → Deployment)
- **Path alias**: `@/*` maps to `frontend/src/*`

### Project Structure

```
frontend/src/
├── proxy.ts              # Next.js 16 proxy: Auth0 middleware, route protection, login audit logging
├── app/
│   ├── layout.tsx        # Root layout (Auth0Provider, service-worker registration, Analytics)
│   ├── manifest.ts       # PWA manifest (served at /manifest.webmanifest)
│   ├── (auth)/           # Centered layout: login, signup, onboarding
│   └── (main)/           # App shell (sidebar + header)
│       ├── page.tsx      # Public landing (marketing + auth CTAs)
│       ├── dashboard/ portfolio/ watchlist/ news/ account/ settings/
│       ├── details/[symbol]/
│       └── api/          # Route handlers (see README → API)
├── components/
│   ├── ui/               # shadcn/ui primitives (do not manually edit)
│   ├── pwa/              # Service-worker registration + iOS install hint
│   └── ...               # Feature dirs: dashboard/, portfolio/, watchlist/, details/, alerts/, account/, settings/
├── actions/              # Client-side API calls (see convention below)
├── services/             # Server-side data fetching (subdirs: ai/, alerts/, dashboard/, position/, stripe/)
├── hooks/                # Custom hooks (use-mobile, use-notifications, use-toast)
└── lib/                  # auth0, db, finnhub, fmp, redis, format, utils

public/sw.js              # Minimal service worker (Web Push only; no asset caching)
```

### Migrations

Plain `.sql` files in `/migrations/` (`001`…`017`, `009` intentionally skipped) document the mini-brokerage schema. They're run manually against Neon (psql or the Neon SQL editor) and serve as the schema of record. Add new files with the next numeric prefix; never edit an already-applied migration.

### Route Groups & Layouts

- **`(auth)`** — login, signup, onboarding. Centered layout, no sidebar/header.
- **`(main)`** — app shell (sidebar + header). `/` is a public landing; all other pages require a session.

Route groups don't affect URLs (e.g., `(main)/portfolio/page.tsx` serves `/portfolio`).

### Authentication Flow

Auth0 v4 SDK with the Next.js 16 proxy pattern (`src/lib/auth0.ts`, `src/proxy.ts`):

1. `proxy.ts` runs Auth0 middleware and protects routes; unauthenticated requests to protected pages redirect to `/` (the public landing). It allowlists public/signed routes: `/`, `/api/health`, `/api/jobs/*`, the QStash alert webhooks, and the Stripe webhook.
2. Signup: Auth0 → `/onboarding` (collect name) → `POST /api/auth/insert-user` → app.
3. Login: Auth0 → app directly.
4. The SDK auto-creates `/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/profile`.
5. The OAuth `redirect_uri` is built from `APP_BASE_URL` (apex `https://getstockmind.com` in prod), so the flow must start on that same host — otherwise the state cookie is missing at callback ("state parameter is invalid").

### Environment Variables

Local dev reads `frontend/.env.local` (gitignored — never commit). In production every secret lives in AWS SSM Parameter Store under `/stockmind/*` and is injected into the ECS task at runtime. Full table in README → Environment Variables. Keys span: app (`APP_BASE_URL`), Auth0 (`AUTH0_*`), Neon (`DATABASE_URL`), market data (`FINNHUB_API_KEY`, `FMP_API_KEY`), AI (`XAI_API_KEY`), QStash (`QSTASH_*`, `CRON_SECRET`), Web Push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` [build-time], `VAPID_PRIVATE_KEY`), and Stripe (`STRIPE_*`).

### Conventions

**Services** — Server-side data-fetching functions live in `src/services/<domain>-service.ts` (or a domain subdir), not in page files. Page components import from services and focus only on rendering.

**Actions** — Client-side API calls (POST, DELETE, etc.) live in `src/actions/<domain>.ts` as named functions (e.g., `addStock`, `createAlert`, `submitOrder`). Components import from actions instead of using inline `fetch` calls.

**shadcn/ui** — Add components via `npx shadcn@latest add <name>` from `frontend/`. Do not manually edit `src/components/ui/`.
