# Setup

Node 22.13–22.x (tested 22.23.1), npm, Python 3 only for coverage maintenance. No commercial credentials needed for offline tests.

```
npm ci
npm run check
```

M1 adds server/dev/import/owner commands. No live app exists at M0. Copy .env.example to .env only when ready; never commit it. Provider flags OFF, daily/monthly spend $0. No automatic purchase/bid. Local SQLite on persistent filesystem; backup with SQLite backup API or stop server and copy file plus WAL consistently. PostgreSQL/multi-instance hosting is M7 work.

Optional accounts: Telegram BotFather https://core.telegram.org/bots#botfather (owner bot token, normal messages free subject to FAQ limits); Dynadot Tools > API https://www.dynadot.com/domain/api-document (API key and secret; beta, quota/redistribution review pending); GoDaddy https://developer.godaddy.com/ (current access eligibility/inventory docs not verified; no old key assumptions). Do not obtain paid plans yet. Remaining provider access and costs are unknown until official review at their milestone. No paid activation authorized.

M0 baseline: repository had no executable code, package manager, CI, tests or migrations. Baseline absence is recorded, not represented as pre-existing tests passing. New contract tests validate preservation and OFF defaults.
