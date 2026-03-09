# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StockMind AI is an AI-powered stock research and analysis dashboard built with Next.js, using live market data from Finnhub and user authentication via Auth0.

## Commands

All commands run from the `frontend/` directory:

```bash
cd frontend
npm run dev      # Start dev server (Next.js on localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **UI Components**: shadcn/ui (new-york style, Radix UI primitives, Lucide icons)
- **Charts**: Recharts
- **Authentication**: Auth0 (`@auth0/nextjs-auth0` v4)
- **Database**: Neon Serverless Postgres (`@neondatabase/serverless`)
- **Market Data**: Finnhub API (real-time quotes, company news, search)
- **Path alias**: `@/*` maps to `frontend/src/*`

### Project Structure

```
frontend/src/
├── proxy.ts                    # Next.js 16 proxy (route protection, Auth0 middleware)
├── app/
│   ├── globals.css             # CSS variables, Tailwind theme
│   ├── layout.tsx              # Root layout (html/body, Auth0Provider)
│   ├── (auth)/                 # Auth route group (no sidebar/header)
│   │   ├── layout.tsx          # Centered layout for auth pages
│   │   ├── login/page.tsx      # Login page
│   │   ├── signup/page.tsx     # Signup page
│   │   └── onboarding/page.tsx # Post-signup name collection
│   └── (main)/                 # Dashboard route group (sidebar + header)
│       ├── layout.tsx          # Dashboard shell, reads user from DB
│       ├── page.tsx            # Dashboard/home page
│       ├── portfolio/page.tsx  # Portfolio page
│       ├── news/page.tsx       # Market news
│       ├── news/[symbol]/      # Symbol-specific news
│       ├── details/[symbol]/   # Stock details (chart, stats, news)
│       └── api/
│           ├── auth/insert-user/route.ts  # Upsert user to Neon DB
│           ├── company/news/route.ts      # Finnhub company news
│           ├── market/status/route.ts     # Market open/closed status
│           └── stocks/
│               ├── quote/route.ts         # Stock quote + profile
│               ├── search/route.ts        # Symbol search
│               └── trades/route.ts        # Real-time trades (SSE via WebSocket)
├── components/
│   ├── dashboard/          # Dashboard widgets (KPI cards, heatmap, feeds)
│   ├── details/            # Stock details components (chart, stats, news)
│   ├── portfolio/          # Portfolio page tabs (portfolio, watchlist, alerts)
│   ├── ui/                 # shadcn/ui primitives (do not manually edit)
│   ├── sidebar.tsx         # App navigation sidebar (user name/avatar from props)
│   ├── header.tsx          # Top header bar
│   └── theme-provider.tsx  # Theme context
├── hooks/                  # Custom React hooks
├── lib/
│   ├── auth0.ts            # Auth0Client instance
│   ├── db.ts               # Neon database connection helper
│   ├── finnhub.ts          # Finnhub API fetch helper
│   ├── mock-data.ts        # Mock/dummy data (used by some dashboard widgets)
│   └── utils.ts            # cn() utility (tailwind-merge + clsx)
└── styles/                 # Additional global styles
```

### Route Groups & Layouts

The app uses Next.js route groups to separate layouts:

- **`(auth)`** — Login, signup, onboarding pages. Centered layout, no sidebar/header.
- **`(main)`** — Dashboard pages. Sidebar + header shell. Reads authenticated user from DB for sidebar display.

Route groups don't affect URLs (e.g., `(main)/portfolio/page.tsx` serves `/portfolio`).

### Authentication Flow

Auth0 v4 SDK with Next.js 16 proxy pattern:

1. `proxy.ts` runs Auth0 middleware on all requests, redirects unauthenticated users to `/login`
2. Login/signup pages link to `/auth/login` (Auth0's hosted Universal Login)
3. Signup flow: Auth0 → `/onboarding` (collect full name) → `POST /api/auth/insert-user` (upsert to Neon) → `/`
4. Login flow: Auth0 → `/` directly
5. Auth0 SDK auto-creates `/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/profile` routes

### Database (Neon)

Neon Serverless Postgres with the `@neondatabase/serverless` driver.

**Users table:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  auth0_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Connection via `DATABASE_URL` env var. Helper in `src/lib/db.ts`.

### Environment Variables

Required in `frontend/.env.local` (not committed):

```
# Auth0
AUTH0_SECRET=<openssl rand -hex 32>
APP_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Neon Database
DATABASE_URL=postgresql://...

# Finnhub
FINNHUB_API_KEY=your-api-key
```

### Adding shadcn/ui Components

```bash
cd frontend
npx shadcn@latest add <component-name>
```

Components are generated into `src/components/ui/`. Config is in `frontend/components.json`.
