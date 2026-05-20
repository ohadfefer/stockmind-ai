# Mobile Design — Project State

> Handoff file for agents picking up the mobile-responsive work on StockMind AI.
> Updated by the `mobile-design-summary` skill at the end of each session.
> Read this first when starting a new mobile-design session.

**Branch:** `mobile-design-1`
**Last updated:** 2026-05-20

---

## Overview

StockMind AI was originally desktop-only. Goal: make every route in `(main)/` usable on phones (375px) without breaking desktop. We work in small batches, the user reviews/tests/commits each batch before the next.

**Working conventions:**
- App is Next.js 16 App Router + Tailwind v4 + shadcn/ui (new-york). Mobile-first responsive utilities.
- Verification uses the `chrome-devtools` MCP at 375x812 viewport (mobile emulation, touch, 2x DPR). Screenshots land in `.mobile-audit/`.
- The user owns commits — never `git add` / `git commit` from the agent.
- Removing desktop UI that doesn't translate to mobile is allowed (see memory `feedback-mobile-ui-permissions`).

---

## To Do (carried forward)

Ordered by recommended execution sequence — each step unblocks visual testing of the next.

- [ ] **Settings layout mobile pattern** — `frontend/src/app/(main)/settings/layout.tsx` still has a nested `w-72` `<aside>` that pushes content off-screen on mobile. Convert to a horizontal scroll tab strip on `<md`, keep aside on `>=md`. May also need `components/settings/settings-nav.tsx` tweaks.
- [ ] **Shared `<MobileDataCard>` + apply to wide tables** — `portfolio-tab.tsx` (8 cols, has overflow-x-auto), `watchlist-tab.tsx` (7 cols, NO overflow wrapper — bursts viewport), `account-history.tsx`, `portfolio/orders`. Pattern: `<table className="hidden md:table">` + `md:hidden` card list. Highest leverage fix in the audit.
- [ ] **Tab bars** — `portfolio-tabs-bar.tsx` and `account-tab-bar.tsx`: tabs+right-actions in one `justify-between` row wraps poorly on mobile. Wrap tab row in `overflow-x-auto whitespace-nowrap [scrollbar-width:none]`; stack action group below tabs on `<md` via `flex-col md:flex-row`.
- [ ] **MarketOverviewBar snap scroll** — `components/dashboard/market-overview-bar.tsx`: replace `overflow-x-hidden` + JS arrow buttons with native `overflow-x-auto snap-x snap-mandatory`, add `snap-start` to each pill, hide arrows on `<md`.
- [ ] **Details page header** — `app/(main)/details/[symbol]/page.tsx:67-90`: title + 3 action buttons in `justify-between` will overflow at 375px with long company names. Change wrapper to `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- [ ] **Charts vertical room** — `holdings-heatmap.tsx:274` hardcoded `height: 300`. Bump to `h-[280px] md:h-[300px] lg:h-[360px]` so phones get more vertical real estate.
- [ ] **Portfolio sector allocation pie** — user has indicated this can be removed on mobile (doesn't translate to small screens). On `<md`, hide the pie + center label; keep the legend grid as a simple list. File: `components/portfolio/portfolio-tab.tsx:130-191`.
- [ ] **Final sweep** — once core changes land, screenshot dashboard / portfolio / watchlist / account / details / news at 375 / 414 / 768 / 1024 to catch leftover edge cases.

---

## Done (cumulative)

- [x] **App shell — sidebar Sheet + responsive layout** (`frontend/src/components/sidebar.tsx`, `frontend/src/components/header.tsx`, `frontend/src/app/(main)/layout.tsx`)
  - Sidebar split into `<Sidebar>` (desktop `<aside>`, `hidden md:flex`) and `<MobileSidebar>` (shadcn Sheet + hamburger trigger, `md:hidden`).
  - Shared `<SidebarBody>` holds the nav content. Nav links auto-close sheet on click via `onNavigate`.
  - Header gained hamburger on mobile, search is `flex-1` instead of forced-centered, status pills don't overflow at 375px.
  - `<main>` padding goes `p-4 md:p-6`.
- [x] **Code-review cleanup on the shell refactor** — exported `SidebarUserProps` (header.tsx and layout.tsx now import it), removed dead `active` field from nav item literals, added `onClick={onNavigate}` to Log out anchor for sheet-close symmetry.

---

## Audit reference

The original mobile audit (severity + grouping) is in conversation history from 2026-05-20. Key blockers it identified:
- 🔴 App shell sidebar always rendered (fixed)
- 🔴 Settings nested sidebar (still to do)
- 🔴 Watchlist table with no overflow wrap (still to do)
- 🔴 Portfolio table needs cards, not horizontal scroll (still to do)

---

## Last Session Summary

**2026-05-20 — App shell mobile refactor**

Connected the `chrome-devtools` MCP and verified at 375x812 viewport emulation. Three files changed:
- `frontend/src/components/sidebar.tsx` — split desktop/mobile, Sheet wrapper, shared body.
- `frontend/src/components/header.tsx` — accepts user props, renders MobileSidebar, mobile-friendly padding.
- `frontend/src/app/(main)/layout.tsx` — passes user props to both, responsive `<main>` padding.

Verified visually: dashboard renders correctly at 375px, hamburger opens drawer with full nav, settings page still broken (intentionally — next unit). Console clean except a pre-existing Recharts mount warning unrelated to the diff.

Followed up with `code-review` skill; applied medium + two low fixes (type duplication, dead field, logout symmetry).

Screenshots saved to `.mobile-audit/01-` through `.mobile-audit/05-`.

Awaiting user review/commit before starting the Settings layout unit.
