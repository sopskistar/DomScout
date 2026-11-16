# Research coverage

The full owner brief is preserved in MASTER_SPEC.md; the appendix is preserved in RESEARCH_APPENDIX.md. research-requirements.json maps every nonempty appendix line (including code, metrics, examples and numeric qualifications). Line references are one-based. No line is deleted when superseded.

Statuses: live_verified, implemented_needs_key, fixture_only, manual_only, blocked, deferred, not_started. Deferred Section 13 reason is `deferred_by_owner`. Historical sale claims and Spaceship statistics remain unverified research, never production seed data.

|Section|Milestone|Status|Evidence / remaining gap|
|---|---|---|---|
|1|1|manual_only|Partial M0/M1 delivery; line inventory and acceptance ledger below preserve all remaining gaps.|
|2|1|manual_only|Partial M0/M1 delivery; line inventory and acceptance ledger below preserve all remaining gaps.|
|3|2|manual_only|M2 private manual evidence/scoring; API feeds OFF; see M2 gaps below and line inventory.|
|4|2|manual_only|M2 private manual evidence/scoring; API feeds OFF; see M2 gaps below and line inventory.|
|5|3|not_started|Line inventory in research-requirements.json; implementation pending.|
|6|2|manual_only|M2 private manual evidence/scoring; API feeds OFF; see M2 gaps below and line inventory.|
|7|2|manual_only|M2 private manual evidence/scoring; API feeds OFF; see M2 gaps below and line inventory.|
|8|2|manual_only|M2 private manual evidence/scoring; API feeds OFF; see M2 gaps below and line inventory.|
|9|4|not_started|Line inventory in research-requirements.json; implementation pending.|
|10|4|not_started|Line inventory in research-requirements.json; implementation pending.|
|11|2|manual_only|M2 private manual evidence/scoring; API feeds OFF; see M2 gaps below and line inventory.|
|12|3|not_started|Line inventory in research-requirements.json; implementation pending.|
|13|Future owner approval|deferred|Full workflow deferred_by_owner; disclaimer and not_checked contract required.|
|14|2|manual_only|M2 private manual evidence/scoring; API feeds OFF; see M2 gaps below and line inventory.|
|15|5|not_started|Line inventory in research-requirements.json; implementation pending.|
|16|5|not_started|Line inventory in research-requirements.json; implementation pending.|
|17|0|manual_only|Partial M0/M1 delivery; line inventory and acceptance ledger below preserve all remaining gaps.|
|18|1|manual_only|Partial M0/M1 delivery; line inventory and acceptance ledger below preserve all remaining gaps.|
|19|0|manual_only|Partial M0/M1 delivery; line inventory and acceptance ledger below preserve all remaining gaps.|
|20|1|manual_only|Partial M0/M1 delivery; line inventory and acceptance ledger below preserve all remaining gaps.|
|21|5|not_started|Line inventory in research-requirements.json; implementation pending.|
|22|8|manual_only|Partial M0/M1 delivery; line inventory and acceptance ledger below preserve all remaining gaps.|
|23|0|manual_only|Partial M0/M1 delivery; line inventory and acceptance ledger below preserve all remaining gaps.|
|24|8|not_started|Line inventory in research-requirements.json; implementation pending.|

## Superseding owner decisions
- Brandable global default 3–20; all eight subtypes are eligible, multiple labels allowed; no mandatory radio/pronounceability gate for acronyms. ABMC, ZayaPay, BluebirdHQ, AuthenTalk, GetBlocky, Nexora and negative spam regression tests belong to M2. No availability or sale assertion inferred.
- All older active trademark gates in sections 1/5/6/7/8/9/14/17/18/19/20/22 are superseded by owner deferral. Basic impersonation/manual review remains mandatory.
- Per-account rules, account-linked shared Telegram bot and tenant isolation replace old global bot settings.
- Public data is approved and bounded; raw/licensed/private fields remain private. Paid API, billing and WhatsApp default OFF.
- M0–8 plus M7B are the operative gates; M9 is post-handoff, owner-directed activation only (the reference to milestones 1–9 does not authorize purchases).
- No video workflows or assets.

## Twelve score dimensions
M2: brandability, geo service, exact match, cleanliness, stability, extension adoption, comparable sales, commercial intent and replacement cost now implemented for private manual/fixture evidence. M3 company gap/end-user count and M4 trend remain not_started. All twelve slots preserve null/unknown, coverage, confidence, evidence, risks and next action; no live/calibrated probability claim.

## Providers
Every named provider is inventoried in SOURCE_REGISTRY.md and source-registry.json, including deferred legal registries. Unreviewed entries have no access authorization.

## Milestone 1 delivered slice

Authorized CSV/JSON import, normalized registrable domains/IDN/roots, provenance/raw snapshots, explicit nulls and status semantics, private owner/researcher sessions and permission checks, public-license allowlist, search/table/multi-sort/pagination, comparison/watchlist, per-user versioned rules with nested conditions and previews, Lagos daily/weekly schedules and quiet hours, shared-bot one-time destination linking/encryption, fixture-proof reviewed outbox, material deduplication, persistent leased jobs and tested zero-spend reservation helper. Evidence: src/, migrations/001–003; tests/core.test.ts, tests/http.test.ts, tests/browser/workspace.spec.ts; docs/qa/.

These features are manual_only or fixture_only in the line inventory, never live_verified. Original future modules have empty relational contracts in migration 003; a schema contract does not mark their features implemented. Score dimensions still not_started. All 53 sources remain non-live. GoDaddy/Dynadot disabled adapters blocked; RDAP parser/bootstrap fixture_only; Telegram implemented_needs_key, real linking/delivery not verified. No fixture candidate is sent to the real bot.

M1 limitations for later gates: registrar availability confirmation, actual RDAP transport, source-specific budgets/retries/circuits connected to live providers, verified external email onboarding, organization management, license retention automation, complete rule fields for later evidence, auction reminders, snooze, account export/delete UI and production scheduler not shipped. Company-gap alert promotion stays disabled until independently useful alternative-use evidence and M3 review contracts exist. Source access failures do not stop manual/fixture research.

## Acceptance scenario ledger

|Scenario|Evidence|Status|
|---|---|---|
|User A/B different rules and destinations, own matches only|core.test.ts mocked Telegram transport + http.test.ts isolation|fixture_only|
|Expiring .com, length 4–8, 5+ extensions, USD 500 ceiling|baseRule core tests and browser rule preview/save|fixture_only|
|Separate trend-velocity rule|typed rule validation with missing-data exclusion|fixture_only (no trend engine until M4)|
|Daily Lagos digest and quiet hours|scheduleDue tests, rule UI|fixture_only|
|Link/unlink, expire/replay, private destination proof|Telegram core tests; disabled-state browser check|fixture_only; real credentials absent|
|No fixture alerts, no duplicates, refresh-only suppression|core tests outbox/material fingerprint|fixture_only|
|Missing extension/backlink data|extension-null test; backlink schema null, rule support deferred|fixture_only / not_started|
|Cross-user filters/chat/API keys|rules/session/record denials and encrypted link mapping; API keys not built|fixture_only / not_started|
|Expired/revoked API key and quotas|/api/v1 disabled, key lifecycle deferred M7|not_started|
|Public source rights|license allowlist + projection tests|fixture_only|
|No payment, WhatsApp disconnected|OFF defaults and disabled UI/routes|fixture_only|
|No commercial connectors required|offline checks and manual import browser flow|manual_only|

## Milestone 2 delivered manual research

src/research.ts and research-store.ts, config/scoring-v1.json, migration 004, private scorecard/editor and tests/research.test.ts now implement nine evidence-gated dimensions, exact TLD/completeness semantics, unreviewed CDX parsing, manual history review, sales-vs-listing and report-vs-primary provenance, specialized geo/EMD models with currency/units, name subtype suggestions and manual multi-label overrides, initialism exemptions, configurable soft lengths/weights/coverage, immutable snapshots and strategy ranking with nulls last. Repeated underlying sales/snapshots do not inflate coverage. Old sales decay, unrelated service comps exclude, unknown backlinks stay unknown and adverse assessed quality blocks promotion. Research imports require fresh review; private adverse evidence removes public exposure/cancels pending alerts. Raw research and model configurations remain private.

Evidence: tests/research.test.ts, research HTTP test, existing browser import/scorecard flow, docs/qa/m2-scorecard-desktop.png and mobile.png. Current M2 gate records in PROGRESS.md and docs/qa/m2-review.md. All owner reference names (ABMC, ZayaPay, BluebirdHQ, AuthenTalk, GetBlocky, Nexora) plus nonsensical negative case have synthetic regression evidence only. No historical sale claim, availability or real company was seeded.

Remaining M2 access limits: no live DotDB/Namecheap/Census/Wayback/sales or commercial history transport; disabled guards and typed normalized contracts/manual import only. No pronunciation dictionary or claimed linguistic verification; operator-reviewed judgments, small original structure vocabulary and explicit limitations. No automatic web-content classification/security clearance. Restricted fields remain private; scorecard results are not yet joined into shared search filters or Telegram payloads until source-rights/delivery contracts permit them. Confidence and weights are unvalidated research heuristics, not calibrated statistics or valuation. Source-specific licensing/TTL and data redistribution stay a per-adapter activation gate. Full cross-category shortlist, API product, advanced UI and outcome calibration are later milestones.
