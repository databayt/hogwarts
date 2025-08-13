## Observability & Backups — Readiness Checklist

Scope: Structured logs with requestId and `schoolId`, basic metrics, error tracking, and DB backups.

### Evidence

- Docs: Requirements mention structured logs and backups. Operator Observability page exists (placeholder).

### Gaps to MVP

- [ ] Logging adapter that injects requestId + schoolId; use in actions and API routes
- [ ] Error tracking (Sentry or similar) with release tags and user/tenant context
- [ ] KPI counters (signups, active schools, attendance events/day)
- [ ] Operator Observability page wiring
- [ ] Backup job docs and runbook reference

### Decision

- Status: NOT IMPLEMENTED — Track in operator backlog; not blocking first shipments



