# devops-accelerator-demo

A **deliberately insecure** Node.js / Express API used to demonstrate the AI DevSecOps Control Plane.  
Every security issue is intentional — the AI service detects, scores, and gates on them.

---

## Intentional Security Issues

| File | Issue | Severity | Rule ID |
|------|-------|----------|---------|
| `src/utils.js` | `eval()` executes arbitrary code | HIGH | `javascript.lang.security.audit.eval` |
| `src/utils.js` | `new Function()` — equivalent to eval | HIGH | `javascript.lang.security.audit.function-constructor` |
| `src/db.js` | SQL query built by string concatenation | CRITICAL | `javascript.lang.security.audit.sqli.string-concat` |
| `src/auth.js` | Hardcoded JWT secret in source code | CRITICAL | `secret.jwt.hardcoded` |
| `src/app.js` | Route handlers accept input with no validation | MEDIUM | `javascript.express.missing-input-validation` |
| `src/db.js` | Password stored as plain text (no bcrypt) | MEDIUM | `javascript.security.plaintext-password` |

### Known CVEs (from `npm audit`)

| CVE | Library | CVSS | Has Exploit |
|-----|---------|------|-------------|
| CVE-2022-23529 | jsonwebtoken | 7.5 | Yes |
| CVE-2024-29041 | express | 6.1 | No |

---

## Intentionally Failing Tests

Three tests are written to **fail by design** — they document known policy violations:

| File | Test name | Why it fails |
|------|-----------|--------------|
| `tests/auth.test.js` | `JWT_SECRET must be at least 32 characters` | Secret is 24 chars; policy requires ≥ 32 |
| `tests/auth.test.js` | `token must expire within 1 hour` | Token expiry is 24 h; policy requires ≤ 1 h |
| `tests/utils.test.js` | `blocks all common XSS vectors` | `sanitizeInput` only strips `<script>` tags; img/event-handler payloads pass through |

All other tests pass. The CI workflow uses `|| true` so intentional failures don't abort the pipeline — the AI service receives the actual failure counts and adjusts its risk score accordingly.

---

## GitHub Actions Workflows

| # | File | Trigger | What it does |
|---|------|---------|--------------|
| 1 | `1-ci.yml` | push to `main`/`feat/**`/`fix/**`, PR to `main` | Runs Jest test suite, reports results to AI |
| 2 | `2-security.yml` | push/PR to `main`, daily 02:00 UTC | npm audit + grep-SAST, sends 6 alerts + 2 CVEs to AI |
| 3 | `3-build.yml` | push to `main`, `workflow_dispatch` | Packages tarball, uploads artifact, notifies AI |
| 4 | `4-deploy-staging.yml` | after workflow 3 completes, `workflow_dispatch` | Deploys to staging, runs smoke tests, notifies AI |
| 5 | `5-deploy-prod.yml` | `workflow_dispatch` (requires typing `DEPLOY`) | **AI blocks this** — risk gate exits 1 on "block" recommendation |

### Workflow 5 — AI Risk Gate in action

Workflow 5 sends a high-risk payload to the AI service:

```
critical_cves       = 2
high_cves           = 5
files_changed_count = 12
test_pass_rate      = 0.75
target_environment  = production
```

If the AI returns `recommendation = "block"`, the `ai-risk-gate` job exits with code 1 and the `deploy-production` job never runs (`needs: ai-risk-gate`).

---

## Setup

### 1. Configure `AI_SERVICE_URL` in GitHub Actions

In your repository → **Settings → Secrets and variables → Actions → Variables**, add:

```
Name:  AI_SERVICE_URL
Value: https://your-ai-service.example.com
```

Leave it unset to fall back to `http://localhost:8000` (all AI steps will fail gracefully with `continue-on-error: true`).

### 2. Run locally

```bash
npm install
npm test          # 3 tests will fail intentionally
npm start         # starts on :3000
```

### 3. Run the AI service

From the `devops-accelerator-poc` root:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Then trigger a workflow manually or push to `main`.

---

## API Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | Returns `{ status: "ok" }` |
| POST | `/login` | Returns JWT — **no input validation** |
| GET | `/users/search?q=` | **SQL injection** via `q` parameter |
| POST | `/users` | Creates user — stores **plain-text password** |
| GET | `/users/:id` | Returns user — **no authentication required** |
