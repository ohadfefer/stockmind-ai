---
name: explain-code
description: Explain recent code changes in simple terms. Use when the user wants to understand what changed in the codebase recently.
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Grep, Glob, Bash
---

# Explain Recent Code Changes

Explain the recent code changes in this Next.js project in simple, beginner-friendly terms. The user is experienced with React but new to Next.js, and has previously used **React Router** and **Redux** for state management.

## Steps

1. **Get the recent changes.** By default, show uncommitted changes (both staged and unstaged) by running `git diff --stat` and `git diff` (working tree) plus `git diff --cached --stat` and `git diff --cached` (staged). Combine both for the full picture of what's been modified since the last commit.

   Only look at committed changes if the user explicitly asks for it (e.g. "explain the last commit", "explain last 3 commits"). In that case, use `git diff HEAD~N --stat` and `git diff HEAD~N` where N is the number of commits requested.

2. **Read the changed files** to get full context around the diffs — don't just rely on the diff hunks.

3. **Explain each change** using the format below. Group related changes together (e.g. all changes for a new page go under one heading).

## Explanation Format

For each logical group of changes, provide:

### [Short title describing the change]

**What changed:** A plain-language summary of what was added, removed, or modified.

**How it works:** Explain the mechanism — what the code actually does step by step. Keep it simple.

**Next.js context:** Explain any Next.js-specific concepts used (App Router, server components, route segments, layouts, loading/error boundaries, server actions, API routes, middleware, etc.). Compare to how the user would have done it with React Router and/or Redux when relevant. For example:

- **Routing**: "In React Router you'd create a `<Route path="/portfolio" element={<Portfolio />} />`. In Next.js App Router, you just create a file at `app/portfolio/page.tsx` and it becomes the `/portfolio` route automatically."
- **Data fetching**: "Instead of dispatching a Redux thunk or using useEffect to fetch data, Next.js server components can fetch data directly at the top level — the component itself is async."
- **State management**: "Where you'd use Redux for global state like the current user or theme, Next.js often uses React Context in a client component (marked with `'use client'`) or server-side cookies/sessions."
- **Layouts**: "Instead of wrapping routes in a shared layout component in your React Router config, Next.js uses `layout.tsx` files — any `layout.tsx` automatically wraps all pages in its folder and subfolders."

Only include comparisons when they genuinely help clarify the concept. Don't force a comparison if the change is standard React (e.g. a new component with props).

## Guidelines

- Use simple, conversational language. Imagine explaining to a friend.
- Don't explain basic React concepts the user already knows (props, state, hooks, JSX).
- DO explain Next.js, App Router, and server component concepts since those are new to the user.
- Keep explanations concise — a few sentences per change, not paragraphs.
- If a change involves shadcn/ui components, briefly note that these are pre-built UI primitives from shadcn (based on Radix UI) — no need to explain their internals.
- If mock data changed, just summarize what data was added/modified without listing every field.
