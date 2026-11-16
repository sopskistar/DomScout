# Setup

Requires Node 22.13–22.x (tested 22.23.1), npm. Uses built-in SQLite; no database account or paid API required. Working skills and installed Chromium are reused. New project dependencies are declared and locked.

```
npm ci
npm run check
npm run owner:create -- owner@example.com
npm run dev
```

Open http://127.0.0.1:4310. Public view starts empty. Explore samples explicitly for isolated fixture records. Sign in to use private imports, watchlists, saved searches and rules. The interactive owner command hides passphrase entry; do not pass it in argv. Detailed imports, jobs, source credentials, Telegram webhook, backups and limitations: OPERATIONS.md.

Browser QA: `npm run test:browser` (build first with npm run check). Reuses Chromium under ~/.cache/ms-playwright or explicit CHROME_PATH. Browser tests use a unique /tmp/domscout-browser-<random>.sqlite per run, never the application DB, and have clearly identified test-only credentials. CI core tests need no browser; install a browser in CI only when enabling the browser job. PNG brand exports: `node scripts/export-brand.mjs`, using the same installed browser. No video tooling.

Optional .env from .env.example (do not commit): HOST, PORT, DATABASE_PATH, PUBLIC_ORIGIN. App requires same-origin mutation requests and serves CSP/HttpOnly/SameSite cookies. For HTTPS hosting cookies become Secure. Authentication is local operator-provisioned, not public email onboarding. Do not expose this development build as a production subscription service.

All paid providers, API, WhatsApp and billing stay OFF. No real external data collected or delivered. GoDaddy inventory rights and current endpoint unresolved; Dynadot REST beta requires API key/secret and rights/quotas review; RDAP fixture parser needs registry-specific retention/rate approval before live transport. Telegram owner bot needs setup described in OPERATIONS. All other source costs remain unverified: consult SOURCE_REGISTRY before signing up. No paid plan required to run offline.

M0 baseline had no app, tests, CI or migrations. M0 established the initial checks. M1 adds transactional migrations and the local research vertical slice. Later milestones remain gated in PROGRESS.md and RESEARCH_COVERAGE.md.
