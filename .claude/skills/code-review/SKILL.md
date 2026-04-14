---
name: code-review
description: Comprehensive code review covering quality, design, error handling, performance, type safety, dead code, and test coverage. Activate for "code review", "review my code", "review this", "check code quality", "review before commit", "pre-commit review". Do NOT activate for security-specific requests — defer to the security-audit skill.
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash, Read, Glob, Grep
---

# Code Review

Perform a comprehensive, opinionated review of code and report findings in a structured format. This skill does NOT modify files — it only reports.

## Default Scope

Operate on uncommitted changes by default:
1. Run `git status` to list modified, staged, and untracked files.
2. Run `git diff` (unstaged) and `git diff --cached` (staged) to see the actual changes.
3. Read untracked files via the Read tool.

If the user specifies a target, use it instead:
- **File** (e.g. "review src/foo.ts") — Read and review the whole file.
- **Directory** (e.g. "review src/services") — Glob for files and review each.
- **Branch** (e.g. "review branch audit-log") — Run `git diff <base>...<branch>` against the repo's main branch (check `git symbolic-ref refs/remotes/origin/HEAD` or fall back to `main`/`master`).

For diffs, focus the review on changed lines, but flag when a change creates risk in surrounding untouched code (e.g. a new return type that breaks an existing caller).

## Context Sensitivity

- **Test files** (`*.test.*`, `*.spec.*`, `__tests__/`, `e2e/`, `cypress/`) — Be lenient: allow repetition, long setup blocks, and skipped edge cases. Still flag broken logic or skipped tests.
- **Generated / vendored code** (`**/dist/**`, `**/build/**`, `**/node_modules/**`, files with "DO NOT EDIT" headers) — Skip entirely.
- **Production code** — Apply full rigor.
- **Migrations / one-off scripts** — Be practical: irreversibility and correctness matter more than reuse.

## Review Areas

Evaluate each of the following:

1. **Readability & quality** — Unclear names, overly long functions (>50 lines), deep nesting (>3 levels), high cyclomatic complexity.
2. **Design & anti-patterns** — Premature abstraction, god objects, misplaced responsibility, violations of stated project conventions (read `CLAUDE.md` if present).
3. **DRY violations** — Near-duplicate logic in 3+ places, copy-pasted blocks with small variations.
4. **Error handling** — Missing try/catch around fallible calls, swallowed errors (empty catches, `catch {}`), vague error messages, errors not surfaced to the user where needed, retries without backoff.
5. **Performance** — N+1 queries, loops that could be batched, blocking I/O on hot paths, unnecessary re-renders, memory leaks (uncleaned listeners/intervals/subscriptions).
6. **Type safety** — `any`, unchecked casts, `@ts-ignore`, missing null checks, non-null assertions on values that could be null.
7. **Dead code** — Unused imports, unused variables/functions, unreachable branches, commented-out code blocks.
8. **Logging & observability** — Missing logs at failure points, logs that leak PII or secrets, `console.log` left in production code.
9. **Test coverage** — New logic without tests, changed behavior that invalidates existing tests.

## Output Format

Produce output in this exact structure:

```
## Executive Summary
- High:   N
- Medium: N
- Low:    N
- Info:   N

Scope: <what was reviewed>
Overall: <1–2 sentence take: ship / needs work / blocked>

## Findings

### [SEVERITY] <short title>
**File:** `path/to/file.ts:42`
**Issue:** <one-paragraph description of the problem and why it matters>
**Fix:**
```<language>
// current
<problematic snippet>

// suggested
<corrected snippet>
```
```

Severity rubric:
- **High** — Bug, data loss risk, crash, or clear regression. Must fix before merge.
- **Medium** — Likely to cause pain later: poor error handling, performance risk, type safety gap. Fix this iteration.
- **Low** — Readability, naming, minor duplication. Batch or defer.
- **Info** — Observation for the author's awareness; no action required.

Order findings High → Medium → Low → Info. Within each severity, group by file.

If a finding has no concrete fix (e.g. broad architectural concern), replace the `Fix:` code block with a `Recommendation:` paragraph.

## Rules

- Do NOT edit files. This skill is read-only.
- Do NOT run tests, builds, or linters unless the user asks — the review is static.
- If there are zero findings in a category, don't emit empty sections.
- If the scope is empty (no changes to review), say so plainly and stop.
- Cite every finding with `file:line`. If line numbers aren't available (e.g. large refactor), cite the function/symbol name.
- Defer security-specific concerns (authn/authz, injection, secret handling, crypto) to the security-audit skill and note that deferral in the output.
