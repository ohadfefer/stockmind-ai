# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StockMind AI is an AI-powered stock research and analysis dashboard. Currently frontend-only (no backend yet), using mock data.

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
- **Path alias**: `@/*` maps to `frontend/src/*`

### Project Structure

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (Sidebar + Header shell)
│   ├── page.tsx            # Dashboard/home page
│   └── portfolio/page.tsx  # Portfolio page
├── components/
│   ├── dashboard/          # Dashboard-specific widgets (KPI cards, heatmap, feeds)
│   ├── portfolio/          # Portfolio page tabs (portfolio, watchlist, alerts)
│   ├── ui/                 # shadcn/ui primitives (do not manually edit)
│   ├── sidebar.tsx         # App navigation sidebar
│   ├── header.tsx          # Top header bar
│   └── theme-provider.tsx  # Theme context
├── hooks/                  # Custom React hooks
├── lib/
│   ├── mock-data.ts        # All mock/dummy data for the UI
│   └── utils.ts            # cn() utility (tailwind-merge + clsx)
└── styles/                 # Additional global styles
```

### Layout Pattern

The root layout (`layout.tsx`) renders a fixed sidebar + header shell. Page components render inside `<main>` as the scrollable content area.

### Adding shadcn/ui Components

```bash
cd frontend
npx shadcn@latest add <component-name>
```

Components are generated into `src/components/ui/`. Config is in `frontend/components.json`.

### Data

All data is currently mocked in `src/lib/mock-data.ts`. There is no backend or API integration yet.
