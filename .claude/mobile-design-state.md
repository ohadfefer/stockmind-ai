# Mobile Design — Project State

> Conventions for mobile-responsive work on StockMind AI.
> Read this first when starting a new mobile-design session.

---

## Overview

StockMind AI was originally desktop-only. Goal: make every route in `(main)/` usable on phones (375px) without breaking desktop. We work in small batches, the user reviews/tests/commits each batch before the next.

**Working conventions:**
- App is Next.js 16 App Router + Tailwind v4 + shadcn/ui (new-york). Mobile-first responsive utilities.
- Verification uses the `chrome-devtools` MCP at 375x812 viewport (mobile emulation, touch, 2x DPR). Screenshots land in `.mobile-audit/`.
- When resizing to check UI at a different breakpoint, **resize the viewport** (via `chrome-devtools` `resize_page` / `emulate`), not the OS window.
- The user owns commits — never `git add` / `git commit` from the agent.
- Removing desktop UI that doesn't translate to mobile is allowed (see memory `feedback-mobile-ui-permissions`).
