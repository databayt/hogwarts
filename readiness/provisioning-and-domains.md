## Provisioning & Domains — Readiness Checklist

Scope: Operator-led tenant provisioning and custom domain request/verification.

### Evidence

- Prisma: `DomainRequest` with `@@unique([schoolId, domain])`.
- Operator actions: create/approve/reject/verify under `/(platform)/operator/actions/domains/*`.
- Operator UI: `/(platform)/operator/domains/page.tsx` + content and table.
- Docs: `/docs/add-school`, `/docs/domain`, `/docs/arrangements`.

### Gaps to MVP

- [ ] Self-serve school creation (public or under /(auth)/join) with subdomain reservation
- [ ] Seed defaults (roles, sample classes/subjects) on create
- [ ] Settings surface domain status and request form (tenant)
- [ ] DNS/CNAME instructions surfaced in UI
- [ ] Minimal tests for operator actions and tenant safety

### Decision

- Status: PARTIAL — Operator flows OK; self-serve later


