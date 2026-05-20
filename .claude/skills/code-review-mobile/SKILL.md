---
name: code-review-mobile
description: Same comprehensive code review as the code-review skill (quality, design, error handling, performance, type safety, dead code, tests), but applies fixes automatically after reporting. Activate for "code review and fix", "review and clean up", "review-mobile", "auto-fix review", "clean up this code". Do NOT activate for security-specific requests — defer to the security-audit-mobile skill.
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

# Code Review (Mobile / Auto-fix)

Same scope and rubric as the `code-review` skill, but after producing the findings report this skill **applies safe fixes** in-place. The user does not have to copy/paste suggested code into their files.

## Default Scope

Identical to `code-review`. Operate on uncommitted changes by default:
1. Run `git status` to list modified, staged, and untracked files.
2. Run `git diff` (unstaged) and `git diff --cached` (staged) to see the actual changes.
3. Read untracked files via the Read tool.

If the user specifies a target (file, directory, or branch), use it. For branch diffs, resolve the base via `git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main`/`master`.

## Context Sensitivity

Same as `code-review`:
- Test files — be lenient on repetition and skipped edges; still flag broken logic.
- Generated / vendored code (`**/dist/**`, `**/build/**`, `**/node_modules/**`, "DO NOT EDIT" headers) — skip.
- Production code — full rigor.
- Migrations / one-off scripts — correctness over reuse.

## Review Areas

Same nine categories as `code-review`:
1. Readability & quality
2. Design & anti-patterns
3. DRY violations
4. Error handling
5. Performance
6. Type safety
7. Dead code
8. Logging & observability
9. Test coverage

## Output Format

First, emit the same findings report as `code-review` (Executive Summary + ordered findings with severity, file:line, issue, and Fix/Recommendation). Then add an **Auto-fix Plan** section listing which findings will be applied, and apply them with Edit/Write. End with an **Applied Fixes** summary listing exactly what was changed.

```
## Executive Summary
- High:   N
- Medium: N
- Low:    N
- Info:   N

Scope: <what was reviewed>
Overall: <1–2 sentence take: ship / needs work / blocked>

## Findings
[same format as code-review skill]

## Auto-fix Plan
- ✅ <finding title> → <one-line description of the fix>
- ⏭️  <finding title> → skipped (<reason: needs human judgment / behavior change / out of scope>)

## Applied Fixes
- `path/to/file.ts` — <summary of change>
- `path/to/other.ts` — <summary of change>

## Verification
<one-line note: e.g., "Page reloaded at 375px, no console errors" or "Type check passes" or "Manual verification recommended">
```

## Auto-fix Rules — what TO apply

Apply fixes that are **mechanical, scoped, and behavior-preserving**:
- Dead code: unused imports, unused variables, dead fields on literals, commented-out code.
- DRY: extract a duplicated type/constant when it appears 2+ times verbatim.
- Type safety: replace `any` with the inferable type, add missing null-checks, narrow non-null assertions.
- Naming: rename a clearly misleading identifier *only when* it's local to one file and has no string references.
- Trivial refactors: collapse a redundant `if (x) return true; else return false;`, remove an unnecessary `else` after `return`, etc.
- Lint-style cleanups: trailing whitespace, inconsistent quotes inside the changed scope, missing key on lists.
- Small UI nits flagged during the review: a missing `aria-label`, a stray `console.log`, a hard-coded color where a token exists.

## Auto-fix Rules — what NOT to apply

Skip and explain when:
- The fix changes runtime behavior, error messaging, or response shapes.
- The fix requires deciding between multiple valid approaches.
- The fix would touch files outside the review scope.
- The finding is `Info` — those are observations, not action items.
- The fix needs new tests; let the user decide whether to add them.
- The finding is a security issue — defer to `security-audit-mobile`.

When in doubt, skip and list it under `⏭️` with a one-line reason. Better to under-fix than to surprise the user.

## Verification

After applying fixes:
1. If TypeScript is in the project, the harness will catch type errors on next build/lint — call them out if you spot any while editing.
2. If a dev server is running and a page renders the changed code, reload via the Chrome DevTools MCP and confirm no console errors and no visual regressions.
3. Do NOT run the test suite or lint unless the user explicitly asks. The mobile skill auto-fixes — it doesn't ship.

## Rules

- Apply fixes in **small, atomic edits** (one Edit call per logical change) so the user can review the diff cleanly.
- Never run `git add`, `git commit`, or any push command. The user owns the commit.
- If applying a fix exposes a new finding, add it to the report — don't fix it silently.
- If the scope is empty (no changes to review), say so plainly and stop.
- Cite every finding with `file:line`. Every applied fix must reference its source finding.
- Defer security-specific concerns (authn/authz, injection, secret handling, crypto) to the `security-audit-mobile` skill and note that deferral in the output.
