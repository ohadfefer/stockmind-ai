---
name: security-audit-mobile
description: Same security audit as the security-audit skill (injection, auth/authz, secrets, crypto, SSRF, path traversal, race conditions, headers/CORS, dependency CVEs), but applies fixes automatically after reporting. Activate for "security audit and fix", "audit and harden", "security-mobile", "auto-fix security", "harden this code". Do NOT activate for general code quality — defer to the code-review-mobile skill.
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

# Security Audit (Mobile / Auto-fix)

Same scope and rubric as the `security-audit` skill, but after producing the findings report this skill **applies safe hardening fixes** in-place. The user does not have to copy/paste hardened code into their files.

## Default Scope

Identical to `security-audit`. Operate on uncommitted changes by default:
1. Run `git status` to list modified, staged, and untracked files.
2. Run `git diff` (unstaged) and `git diff --cached` (staged).
3. Read untracked files via the Read tool.

If the user specifies a target (file, directory, or branch), use it. For branch diffs, resolve the base via `git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main`/`master`.

## Context Sensitivity (avoid false positives)

Same as `security-audit`:
- Test files — ignore hardcoded creds, permissive CORS, mock secrets. Still flag test code that could run in production.
- Dev-only configs (`docker-compose.dev.yml`, `.env.example`, `*.local.*`) — ignore permissive settings clearly scoped to local dev.
- Internal-only services — lower bar for rate limiting, but still flag injection / auth bypass / secret handling.
- Generated / vendored code — skip.
- Production code, public APIs, auth surfaces — full rigor.

Read `CLAUDE.md` if present to understand trust boundaries (public vs authenticated vs webhook-secured routes).

## Vulnerability Classes

Same ten categories as `security-audit`:
1. Injection (SQL, NoSQL, LDAP, OS command, template, header)
2. AuthN / AuthZ flaws (missing session checks, IDOR, role/ownership, JWT misuse)
3. Sensitive data exposure (hardcoded secrets, PII in logs, debug leaks)
4. Insecure deserialization
5. Dependency vulnerabilities (`npm audit --production --json` or equivalent)
6. Insecure cryptography
7. SSRF, open redirects, path traversal
8. Race conditions / TOCTOU
9. Headers & CORS
10. Input validation / output encoding

## Output Format

First, emit the same findings report as `security-audit` (Executive Summary + ordered findings with severity, CWE/OWASP reference, confidence, file:line, issue, and Fix/Remediation). Then add an **Auto-fix Plan** listing which findings will be hardened, and apply them with Edit/Write. End with an **Applied Fixes** summary and a **Verification** note.

```
## Executive Summary
- Critical: N
- High:     N
- Medium:   N
- Low:      N
- Info:     N

Scope: <what was audited>
Overall: <1–2 sentence risk take: safe to ship / needs fixes / block>

## Findings
[same format as security-audit skill, including CWE/OWASP references and Confidence]

## Auto-fix Plan
- ✅ <finding title> → <one-line description of the hardening>
- ⏭️  <finding title> → skipped (<reason: needs design decision / cross-cutting / requires test / dependency update>)

## Applied Fixes
- `path/to/file.ts` — <summary of hardening change>
- `path/to/other.ts` — <summary of hardening change>

## Verification
<one-line note: e.g., "Reloaded /login at 375px, auth flow still works" or "Manual verification recommended for X">
```

## Auto-fix Rules — what TO apply

Apply hardenings that are **mechanical, scoped, and behavior-preserving from a legitimate-user perspective**:
- Parameterize SQL: convert string-concatenated queries to parameterized form.
- Add server-side input validation (length / type / allowlist) where it's clearly missing.
- Replace weak crypto: MD5/SHA1 → SHA-256 for non-password uses, `Math.random()` → `crypto.randomUUID()` / `crypto.getRandomValues()` for tokens/IDs.
- Add missing security headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options) in places where headers are already configured.
- Tighten CORS: replace wildcards with an explicit allowlist when one is already defined elsewhere in the codebase.
- Output encoding: wrap raw user input rendered into HTML/attributes with the project's existing escape helper.
- Remove hardcoded non-production secrets (rotate-and-move-to-env is for the user; the skill removes the literal and references `process.env.X` with a comment).
- Add `rel="noopener noreferrer"` to `target="_blank"` links.
- Add missing path-traversal guards (`path.normalize` + `startsWith(base)` check) around `fs` reads of user-supplied paths.

## Auto-fix Rules — what NOT to apply

Skip and explain when:
- The fix is for a **Critical** finding affecting auth or session flow — the user must approve.
- The hardening changes the public API or response shape.
- The fix requires environmental changes (rotating real secrets, configuring a WAF, modifying infrastructure).
- The fix is a dependency upgrade — surface `npm audit` output and let the user run `npm audit fix` or upgrade manually.
- The hardening could break legitimate user flows without test coverage.
- The finding is `Info` — those are observations.
- The finding is general code quality — defer to `code-review-mobile`.

When in doubt, skip and list under `⏭️` with a one-line reason. Security fixes that silently change behavior are worse than no fix.

## Verification

After applying fixes:
1. Re-read the patched lines to confirm the hardening compiles and the change is local.
2. If a dev server is running on a route touched by the fix, reload via the Chrome DevTools MCP and confirm the page still renders and the auth-protected paths still authorize.
3. For dependency findings, do NOT run `npm audit fix` automatically — surface the recommended command in the Applied Fixes section.
4. Do NOT attempt actual exploits. Static analysis and patching only.

## Rules

- Apply fixes in **small, atomic edits** so the user can review the diff cleanly.
- Never run `git add`, `git commit`, or any push command. The user owns the commit.
- If a fix exposes a new finding, add it to the report — don't harden silently.
- If the scope is empty, say so plainly and stop.
- Cite every finding with `file:line`. Every Critical and High finding MUST include a CWE or OWASP reference. Every applied fix must reference its source finding.
- Defer general code quality issues (readability, duplication, naming) to the `code-review-mobile` skill and note the deferral in the output.
