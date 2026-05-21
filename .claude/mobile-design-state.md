# Mobile Design — Project State

> Handoff file for agents picking up the mobile-responsive work on StockMind AI.
> Updated by the `mobile-design-summary` skill at the end of each session.
> Read this first when starting a new mobile-design session.

**Branch:** `mobile-design-1`
**Last updated:** 2026-05-21

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

The original audit's to-do list is now empty — all 8 items shipped. The items below are deferred follow-ups surfaced during code review that were intentionally out of scope for the initial mobile pass.

- [ ] **Recharts `Cell` deprecation** — `frontend/src/components/portfolio/portfolio-tab.tsx:153` uses Recharts `<Cell>` inside `<Pie>`, which the typechecker flags as deprecated. Migrate to the current Recharts API. Likely a Recharts-version-wide cleanup, not just this file.
- [ ] **Tab-bar wrapper DRY** — the `-mx-4 md:-mx-6 ... overflow-x-auto whitespace-nowrap border-b border-border px-4 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden` recipe is repeated across `account-tab-bar.tsx`, `portfolio-tabs-bar.tsx`, `watchlist-list-bar.tsx`, and the `TabBarSkeleton` in `account-content.tsx`. Extract a `TabBarShell` (or class constant) once the right shape is clear — call sites differ on whether they have a right-side action slot.
- [ ] **Clickable `MobileDataCard` a11y** — `components/mobile-data-card.tsx`: when `onClick` is passed, the card is a `<div>` with no `role="button"`, `tabIndex`, or keyboard handler. At parity with existing desktop `<TableRow onClick>` patterns but worth a focused a11y pass that also covers those.
- [ ] **Avg-fill formatter duplication** — `app/(main)/portfolio/orders/page.tsx` formats `average_fill_price` identically in the desktop table and the mobile card. Extract to `lib/format.ts` once the right helper name/semantics are decided.

---

## Done (cumulative)

- [x] **App shell — sidebar Sheet + responsive layout** (`frontend/src/components/sidebar.tsx`, `frontend/src/components/header.tsx`, `frontend/src/app/(main)/layout.tsx`)
  - Sidebar split into `<Sidebar>` (desktop `<aside>`, `hidden md:flex`) and `<MobileSidebar>` (shadcn Sheet + hamburger trigger, `md:hidden`).
  - Shared `<SidebarBody>` holds the nav content. Nav links auto-close sheet on click via `onNavigate`.
  - Header gained hamburger on mobile, search is `flex-1` instead of forced-centered, status pills don't overflow at 375px.
  - `<main>` padding goes `p-4 md:p-6`.
- [x] **Code-review cleanup on the shell refactor** — exported `SidebarUserProps` (header.tsx and layout.tsx now import it), removed dead `active` field from nav item literals, added `onClick={onNavigate}` to Log out anchor for sheet-close symmetry.
- [x] **Settings layout mobile pattern** (commit `63b32ed`, `frontend/src/app/(main)/settings/layout.tsx`, new `components/settings/settings-mobile-tabs.tsx`) — desktop `w-72` aside is now `hidden md:flex`; on `<md` a flat horizontal-scroll tab strip renders the 5 settings routes. Layout switched to `flex-col md:flex-row` and the `-m-6` overcorrection was fixed to `-m-4 md:-m-6`.
- [x] **`MobileDataCard` primitive + watchlist + portfolio holdings** (commit `23101b7`, new `components/mobile-data-card.tsx`; `watchlist/watchlist-tab.tsx`; `portfolio/portfolio-tab.tsx`) — wide desktop tables wrapped in `hidden md:block`; new `md:hidden` card stacks for watchlist (ticker / AI score / price / change / day range / always-visible delete) and portfolio holdings (sector / total value / P&L+Day grid / shares-avg-current grid / weight bar). Mobile drops the unused Equity/Options/Crypto tab stub.
- [x] **`MobileDataCard` for history + orders + tab bars mobile fix** (commit `bd99bec`, `components/account/account-history.tsx`, `app/(main)/portfolio/orders/page.tsx`, `components/account/account-tab-bar.tsx`, `components/portfolio/portfolio-tabs-bar.tsx`, `components/account/account-content.tsx`) — account history mobile cards branch on `entry.type` (trade vs cash_update); orders page mobile cards keep `<ExecuteOrderButton>` / `<CancelOrderButton>`. Tab bars on `/account` and `/portfolio` got `-mx-4 md:-mx-6`, `overflow-x-auto`, and stacked action group below tabs on mobile so touch swipes scroll the bar instead of dragging the page.
- [x] **Polish pass: snap scroll, stacked details header, sized heatmap, hidden sector pie** (commit `e5cbc32`, `components/dashboard/market-overview-bar.tsx`, `app/(main)/details/[symbol]/page.tsx`, `components/dashboard/holdings-heatmap.tsx`, `components/portfolio/portfolio-tab.tsx`) — MarketOverviewBar uses native `overflow-x-auto snap-x snap-mandatory`; details title + actions stack via `flex-col gap-3 sm:flex-row`; heatmap height `h-[280px] md:h-[300px] lg:h-[360px]`; portfolio sector pie + center label `hidden md:block` (legend remains).
- [x] **Final cross-viewport sweep + leftover fixes** (`components/watchlist/watchlist-list-bar.tsx`, `components/portfolio/portfolio-tab.tsx`) — see "Last Session Summary" below.

---

## Audit reference

The original mobile audit (severity + grouping) is in conversation history from 2026-05-20. All 🔴 blockers have shipped:
- 🔴 App shell sidebar always rendered (fixed in a26e94f)
- 🔴 Settings nested sidebar (fixed in 63b32ed)
- 🔴 Watchlist table with no overflow wrap (fixed in 23101b7 via `MobileDataCard`)
- 🔴 Portfolio table needs cards, not horizontal scroll (fixed in 23101b7)

---

## Last Session Summary

**2026-05-21 — Final cross-viewport sweep**

Swept dashboard / portfolio / watchlist / account / details / news at 375, 414, 768, and 1024 (screenshots in `.mobile-audit/sweep-<viewport>-<page>.png`). Found two real leftover issues. At 375, `watchlist-list-bar.tsx` overflowed because its chip row had no `overflow-x-auto` or edge-to-edge negative margin — fixed by applying the same recipe used on the production tab bars. At 1024 on `/portfolio`, the parent grid `lg:grid-cols-[1fr_360px]` squeezed the Sector Allocation card so tightly that the in-card legend labels visibly overlapped, and the holdings desktop table propagated horizontal scroll to the page instead of being contained by its `overflow-x-auto` wrapper. Bumped the parent grid breakpoint to `xl:`, switched the legend to `grid-cols-2 md:grid-cols-1` with `truncate` + defensive `shrink-0`, and added `min-w-0` to the holdings desktop wrapper.

All 24 page/viewport combos now report `horizOverflow: false`. Console clean. Files changed: `watchlist-list-bar.tsx`, `portfolio-tab.tsx`. Awaiting user review/commit. The original to-do list is now empty; "To Do" above tracks deferred-by-design follow-ups from code reviews.
