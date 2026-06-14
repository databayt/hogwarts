# SaaS Dashboard — Production Readiness Tracker

**Status:** :yellow_circle: IN PROGRESS
**Completion:** 84%
**Last Updated:** 2026-06-14

---

## 2026-06-14 — Optimization pass (audit + partial fix)

An 11-area read-only audit + adversarial verification produced **181 confirmed
findings** (6 P0, 47 P1, 101 P2, 27 P3). Full list + machine-readable copy live in
`OPTIMIZATION_BACKLOG.md` / `.audit-findings.json`.

**Fixed this pass (all 6 P0 + ~24 P1/P2, tsc clean):**

- **P0 data integrity:** `planType` case mismatch zeroed all MRR + plan-distribution
  cards (DB stores mixed case; lookups were uppercase-only) → all reads now
  case-insensitive. Tenant "Outstanding" always $0 (read nonexistent `Invoice.amount`)
  → `amountDue − amountPaid`. Tenant detail sheet fetched dead `/operator/...` routes
  (always empty) → one `getTenantDetail` action; 4 dead API routes deleted.
- **P0 security:** receipt actions logged literal `"operator"` as userId → real
  operator identity (+IP/UA); added missing `requireNotImpersonating()`.
- **Perf:** collapsed 6→1 (MRR history, revenue trends), 5→1/3 (domain stats, billing
  stats), 10→4 (tenant analysis) via groupBy/JS-bucketing.
- **Fabricated data:** the operator dashboard rendered largely fake data
  (`Math.random` charts, static `defaultDataByRole`, fictional sales personas,
  hardcoded "upcoming" counts) — **all removed and wired to real platform data**;
  8 dead files deleted; detailed charts now live only on `/analytics` (already real).
- **Other:** CSV formula-injection escaping (billing export), partial-payment
  accumulation, projected-12-month formula, impersonation banner visibility,
  dead `operator-auth-guard` (PII log) removed, `theme-selector` `require()` fix,
  Kanban/Products removed from operator nav.

**Remaining (~150, see `OPTIMIZATION_BACKLOG.md`):** catalog TOCTOU/transaction
guards, observability pagination + dead-layer cleanup, sales TOCTOU + CSV-import
batching, domains TOCTOU/FSM, tenant N+1 translation + caching, and the cross-cutting
**i18n sweep (~48)**. The parallel fix-agent wave was rate-limited mid-run — resume by
re-bucketing `.audit-findings.json` by file path. Schema indexes
(School.isActive/planType, Lead.nextFollowUpAt) are deploy-time `db push` items.

---

## MVP Checklist

### Core SaaS Features (COMPLETE)

- [x] Tenants management with comprehensive stats (9 cards), plan distribution, growth tracking
- [x] Billing and invoices with revenue tracking, payment rates, CSV export
- [x] Receipts management with approve/reject workflow and stats dashboard
- [x] Domains management with approval workflow, DNS config, status badges (5 cards)
- [x] Observability with audit logs, provider abstraction (DB + HTTP), filtering
- [x] Dashboard with real-time metrics, delta tracking (7d/30d/90d), MRR/ARR/Churn cards
- [x] RBAC with operator-only access (requireOperator middleware)
- [x] Impersonation with full audit trail
- [x] Server actions with Zod validation throughout
- [x] 4 tenant detail API endpoints (summary, billing, invoices, info)

### Analytics (COMPLETE)

- [x] MRR calculation with 6-month trend chart
- [x] MRR breakdown by plan tier
- [x] Churn rate calculation and dashboard card
- [x] At-risk schools detection (payment failures, low usage, trial expiry)
- [x] Growth indicators (MRR %, ARR projection)

### Catalog Management (COMPLETE)

- [x] Subject catalog with CRUD
- [x] Book catalog with detail views
- [x] Material management
- [x] Question bank with CRUD
- [x] Assignment catalog
- [x] Approval workflow for contributions
- [x] Proposal management
- [x] Analytics dashboard for catalog

### Extended Features (IN PROGRESS)

- [x] Sales management with analytics and import
- [x] User management with analysis
- [x] Product configuration
- [ ] Kanban board (demo-level, needs production implementation)
- [ ] Receipt file storage integration (upload UI present, S3 pending)
- [ ] Payment automation via Stripe webhooks

## Known Issues

> 2026-06-13: `observability/conference/queries.ts` TURN-fallback rate scoped to
> joined participants + `0n` BigInt fallback (metric-correctness only). Owned by
> the conference block — see `school-dashboard/conference/ISSUE.md` (hardening
> pass) and hogwarts#3. No dashboard-level change.

### P0 -- Critical

- None

### P1 -- High

- Receipt file upload UI is present but actual file storage (S3/similar) not integrated
- Stripe webhook endpoint for payment automation not implemented
- Dictionary props not passed to some dashboard components (i18n gap)

### P2 -- Medium

- Bar graph component contains hardcoded test data
- Kanban board is demo-level (client-side only, no persistence)
- Product/profile pages are basic scaffolds
- Chart components have hydration mismatch risk (client-only rendering pattern)
- No data caching strategy for dashboard queries

## Feature Implementation Matrix

| Feature       | Content | Table | Actions | Stats   | API         | Status |
| ------------- | ------- | ----- | ------- | ------- | ----------- | ------ |
| Tenants       | Done    | Done  | Done    | 9 cards | 4 endpoints | Ready  |
| Billing       | Done    | Done  | Done    | 4 cards | CSV export  | Ready  |
| Receipts      | Done    | Done  | Done    | 4 cards | Route       | Ready  |
| Analytics     | Done    | Done  | Done    | 4 cards | MRR/Churn   | Ready  |
| Domains       | Done    | Done  | Done    | 5 cards | -           | Ready  |
| Observability | Done    | Done  | -       | -       | -           | Ready  |
| Dashboard     | Done    | -     | Done    | 7 cards | Metrics     | Ready  |
| Catalog       | Done    | Done  | Done    | -       | -           | Ready  |
| Sales         | Done    | Done  | Done    | -       | -           | Ready  |
| Users         | Done    | Done  | -       | -       | -           | Ready  |
| Kanban        | Partial | -     | Partial | -       | -           | Demo   |
| Product       | Partial | -     | Partial | -       | -           | Demo   |

## Enhancements (Post-MVP)

- [ ] School health scoring algorithm (usage metrics available)
- [ ] Bulk operations via CSV import (pattern ready from school-dashboard)
- [ ] Real-time alert system for trial expiry, payment failures
- [ ] Revenue forecasting with projection algorithms
- [ ] Custom date range reports with email delivery
- [ ] Universal CSV export for all tables
- [ ] Engagement tracking (WAU/MAU, session duration)
- [ ] Onboarding progress tracker per school

---

**Last Review:** 2026-03-19
