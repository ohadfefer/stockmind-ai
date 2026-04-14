---
name: security-audit
description: Security vulnerability audit covering injection, auth/authz, secrets, crypto, SSRF, path traversal, race conditions, headers/CORS, and dependency CVEs. Activate for "security audit", "security scan", "vulnerability check", "audit this", "check for vulnerabilities", "security review", "pen test this". Do NOT activate for general code quality — defer to the code-review skill.
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash, Read, Glob, Grep
---

# Security Audit

Perform a focused security audit and report vulnerabilities in a structured format. This skill does NOT modify files — it only reports.

## Default Scope

Operate on uncommitted changes by default:
1. Run `git status` to list modified, staged, and untracked files.
2. Run `git diff` (unstaged) and `git diff --cached` (staged) to see the actual changes.
3. Read untracked files via the Read tool.

If the user specifies a target, use it instead:
- **File** (e.g. "audit src/api/login.ts") — Read and audit the whole file.
- **Directory** (e.g. "audit src/api") — Glob and audit each file.
- **Branch** (e.g. "audit branch feature/x") — Run `git diff <base>...<branch>` against the repo's main branch (resolve via `git symbolic-ref refs/remotes/origin/HEAD`, fall back to `main`/`master`).

For diffs, focus on changed lines but flag when a change creates risk in surrounding untouched code (e.g. a new SQL query that bypasses an existing sanitizer, or a new route that skips the auth middleware).

## Context Sensitivity (avoid false positives)

- **Test files** (`*.test.*`, `*.spec.*`, `__tests__/`, `e2e/`, `cypress/`) — Ignore hardcoded creds, permissive CORS, and mock secrets. Still flag test code that could be run in production (e.g. a `/test-login` route without environment gating).
- **Dev-only configs** (`docker-compose.dev.yml`, `.env.example`, `*.local.*`) — Ignore permissive settings that clearly apply only to local dev.
- **Internal-only services** (scripts, cron jobs, admin CLIs with no external network exposure) — Apply a lower bar for things like rate limiting, but still flag injection, auth bypass, and secret handling.
- **Generated / vendored code** (`**/dist/**`, `**/build/**`, `**/node_modules/**`) — Skip entirely.
- **Production code, public APIs, auth surfaces** — Full rigor.

Read `CLAUDE.md` if present to understand the app's trust boundaries (which routes are public, which are authenticated, which are cron/webhook-secured).

## Vulnerability Classes

Evaluate each of the following:

1. **Injection** — SQL, NoSQL, LDAP, OS command, template, header (CRLF). Look for string concatenation into queries/commands/URLs, `eval`, `new Function`, template engines rendering user input.
2. **AuthN / AuthZ flaws** — Missing session checks on protected routes, broken access control (IDOR: user A can read user B's resource), missing role/ownership checks on write operations, privilege escalation, JWT misuse (alg=none, missing signature verify, weak secret).
3. **Sensitive data exposure** — Hardcoded secrets/API keys/tokens/passwords, PII or tokens written to logs, secrets returned in API responses, debug info leaking stack traces to clients.
4. **Insecure deserialization** — `JSON.parse` of untrusted input into type-sensitive structures without validation, `eval`-based parsing, unsafe YAML loaders, Node.js `Buffer.from(input, 'base64')` without bounds.
5. **Dependency vulnerabilities** — Run `npm audit --production --json` (or `pnpm audit` / `yarn audit`) and surface High/Critical advisories. Note packages using deprecated or abandoned maintainers if obvious.
6. **Insecure cryptography** — MD5/SHA1 for security purposes, ECB mode, hardcoded IVs or salts, `Math.random()` for tokens/IDs, JWT `HS256` with a weak/shared secret, password hashing with anything other than argon2/bcrypt/scrypt.
7. **SSRF, open redirects, path traversal** — `fetch(userInput)` without host allowlist, redirect targets taken from query params without validation, `fs.readFile(path.join(base, userInput))` without normalization checks.
8. **Race conditions / TOCTOU** — Check-then-act on shared state without locks/transactions, duplicate-submission bugs, file existence checks followed by reads.
9. **Headers & CORS** — Missing `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`; wildcard CORS with credentials; overly broad `Access-Control-Allow-Origin`.
10. **Input validation / output encoding** — Missing server-side validation (trusting client-side only), raw user input rendered into HTML/attributes/URLs without encoding, unvalidated file uploads (type/size/path).

## Output Format

Produce output in this exact structure:

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

### [SEVERITY] <short title>  (CWE-XX / OWASP A0X)
**File:** `path/to/file.ts:42`
**Confidence:** Confirmed | Potential
**Issue:** <one-paragraph description: what the vulnerability is, how it's exploited, what an attacker gains>
**Fix:**
```<language>
// vulnerable
<problematic snippet>

// hardened
<corrected snippet>
```
**Reference:** <CWE link / OWASP Top 10 category / relevant advisory>
```

Severity rubric:
- **Critical** — Remote code execution, full auth bypass, direct data exfiltration, hardcoded production secrets. Stop the world.
- **High** — IDOR, SQLi behind auth, stored XSS, privilege escalation, exploitable SSRF. Fix before merge.
- **Medium** — Weak crypto, missing headers with real impact, input-validation gaps, reflected XSS in limited context. Fix this iteration.
- **Low** — Defense-in-depth gaps, minor information disclosure, missing rate limiting on low-value endpoints.
- **Info** — Hardening opportunities, observations for awareness.

**Confidence labels:**
- **Confirmed** — Reading the code path, the vulnerability is exploitable as-is.
- **Potential** — Looks risky, but depends on caller/config/runtime context the audit can't verify.

Order findings Critical → High → Medium → Low → Info. Within each severity, group by file.

If no concrete code fix applies (e.g. missing dependency patch), replace the `Fix:` block with a `Remediation:` paragraph describing the concrete steps.

## Rules

- Do NOT edit files. This skill is read-only.
- Do NOT attempt actual exploits or run untrusted code. Static analysis only.
- If there are zero findings in a severity, don't emit an empty section.
- If the scope is empty, say so plainly and stop.
- Cite every finding with `file:line`. For findings that span a file or module, cite the function/route name.
- Every Critical and High finding MUST include a CWE or OWASP reference.
- Defer general code quality issues (readability, duplication, naming) to the code-review skill and note the deferral in the output.
