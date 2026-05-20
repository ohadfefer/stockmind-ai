---
name: mobile-design-summary
description: Update the mobile-design handoff file (.claude/mobile-design-state.md) at the end of a mobile-responsive work session. Reads uncommitted changes, summarizes what was completed, moves done items off the to-do list, and replaces the prior session summary so the file stays concise. Activate for "summarize mobile work", "update mobile state", "mobile-design-summary", "handoff", "wrap up mobile session". Do NOT activate for general status reports — this is specific to mobile-design work on this project.
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash, Read, Edit, Write
---

# Mobile Design Summary

End-of-session housekeeping for the mobile-responsive work on StockMind AI. Reads the current state of `.claude/mobile-design-state.md`, inspects what changed in this session, and updates the file so the next agent (fresh context) can pick up immediately.

## When to invoke

- The user is about to commit a mobile-design batch and wants the handoff file refreshed.
- The user is wrapping up a session and wants the next session's agent to have full context.
- The user explicitly says "summarize", "update state", "handoff", "wrap up", "mobile-design-summary".

Do NOT invoke proactively — this is user-triggered at session boundaries.

## Inputs

Default scope: **uncommitted changes only.** If the user passes arguments like "include last 3 commits" or "since branch start," widen the scope accordingly. Otherwise:

```bash
git status                       # modified / staged / untracked
git diff                         # unstaged changes (full)
git diff --cached                # staged changes (full)
git log --oneline -5             # context only — last 5 commits for orientation
```

For untracked files, use Read to inspect their contents.

## Workflow

1. **Read the existing state file** at `.claude/mobile-design-state.md`. If it doesn't exist, halt and ask the user how to seed it.

2. **Inspect the session's work** via the git commands above. Determine:
   - What files were touched and which logical task(s) they correspond to.
   - Which to-do items from the file are now complete.
   - Any new follow-ups discovered (e.g., a fix exposed a related issue).
   - Anything notable about decisions, removed UI, or visual verification.

3. **Update the file in place** using Edit (do not rewrite the whole file unless structure has drifted):
   - **`Last updated`** — set to today's date in ISO format (YYYY-MM-DD).
   - **To Do** — strike through (remove the line) any items the diff completes. If the diff revealed a new item, add it with brief context (file path, what to do, why).
   - **Done** — append a new `- [x]` entry for each newly-completed item. Include the file paths touched and a one-sentence description. Keep the cumulative list ordered by completion (newest at the bottom).
   - **Last Session Summary** — REPLACE the entire section with a new summary for this session. Include: date heading, what was done in narrative form (2-4 sentences), files changed, anything the next agent should know (workarounds, deferred decisions, broken-but-intentional states). Do NOT keep prior summaries — the cumulative record lives in "Done."

4. **Verify the update** — re-read the file and confirm:
   - "Last Session Summary" reflects only this session's work, no stale content.
   - Items in "Done" are not duplicated in "To Do."
   - The file is still concise (target: under 200 lines).

5. **Report to the user** — list which to-do items closed, which were added, and the new "Last Session Summary" text in your reply so they can sanity-check before the next batch.

## What "this session's work" means

The skill summarizes what changed since the last `git commit` on this branch — **uncommitted changes only**, both staged and unstaged. Rationale: this matches the user's batched-review workflow where each session ends with a commit; uncommitted diff is exactly "what this session produced."

If the user has already committed mid-session (rare), the skill should ask whether to include those commits or only the still-uncommitted diff.

If the user passes an argument like "from branch start" or "last N commits," compute the diff accordingly:
- "from branch start" → `git diff $(git merge-base HEAD master)...HEAD` plus uncommitted
- "last N commits" → `git log -N` for commits, plus uncommitted

## Output Format

```
## Mobile-design state updated

**Completed this session:**
- <item that moved from To Do → Done>
- <another>

**New follow-ups discovered:**
- <item added to To Do>

**Replaced session summary with:**
> <the new "Last Session Summary" text, verbatim>

File: `.claude/mobile-design-state.md` (now N lines).
```

## Rules

- Operate ONLY on `.claude/mobile-design-state.md`. Do not touch other files.
- Never run `git add`, `git commit`, or any push command.
- Do not invent completed work — only mark items done if the diff actually completes them.
- Do not invent new to-do items — only add follow-ups that are directly evidenced by the diff or the user's recent messages in this session.
- Keep "Last Session Summary" under ~150 words. Use narrative prose, not bullet lists, so it reads quickly.
- If the diff is empty, do not zero out the file. Reply that there's nothing to summarize and stop.
- Convert relative dates to absolute (today is the system date — don't write "yesterday" or "last week").
