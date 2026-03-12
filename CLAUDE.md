# CLAUDE.md

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
- **Database**: Neon Serverless Postgres (`@neondatabase/serverless`), project: `misty-bread-61945131`
- **Market Data**: Finnhub API (real-time quotes, company news, search)
- **Path alias**: `@/*` maps to `frontend/src/*`

### Project Structure

```
frontend/src/
├── proxy.ts              # Next.js 16 proxy (Auth0 middleware, route protection)
├── app/
│   ├── layout.tsx        # Root layout (html/body, Auth0Provider)
│   ├── (auth)/           # Auth route group (centered layout, no sidebar)
│   └── (main)/           # Dashboard route group (sidebar + header shell)
│       ├── api/          # API route handlers
│       └── ...           # Pages: /, /portfolio, /news, /details/[symbol]
├── components/
│   ├── ui/               # shadcn/ui primitives (do not manually edit)
│   └── ...               # Feature components (dashboard/, details/, portfolio/)
├── actions/              # Client-side API call functions (see convention below)
├── services/             # Server-side data fetching (see convention below)
├── hooks/                # Custom React hooks
├── lib/                  # Utilities (auth0, db, finnhub, utils)
└── styles/               # Additional global styles
```

### Route Groups & Layouts

- **`(auth)`** — Login, signup, onboarding. Centered layout, no sidebar/header.
- **`(main)`** — Dashboard pages. Sidebar + header shell.

Route groups don't affect URLs (e.g., `(main)/portfolio/page.tsx` serves `/portfolio`).

### Authentication Flow

Auth0 v4 SDK with Next.js 16 proxy pattern:

1. `proxy.ts` runs Auth0 middleware, redirects unauthenticated users to `/login`
2. Signup: Auth0 → `/onboarding` (collect name) → `POST /api/auth/insert-user` → `/`
3. Login: Auth0 → `/` directly
4. Auth0 SDK auto-creates `/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/profile`

### Environment Variables

Required in `frontend/.env.local` (not committed): `AUTH0_SECRET`, `APP_BASE_URL`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `DATABASE_URL`, `FINNHUB_API_KEY`

### Conventions

**Services** — Server-side data-fetching functions live in `src/services/<domain>-service.ts`, not in page files. Page components import from services and focus only on rendering.

**Actions** — Client-side API calls (POST, DELETE, etc.) live in `src/actions/<domain>.ts` as named functions (e.g., `addStock`, `deleteStock`). Components import from actions instead of using inline `fetch` calls.

**shadcn/ui** — Add components via `npx shadcn@latest add <name>` from `frontend/`. Do not manually edit `src/components/ui/`.
