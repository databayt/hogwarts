## Billing — Readiness Checklist

Scope: Manual/operator billing flows; Stripe-ready models and webhooks present, config pending.

### Evidence

- Prisma: `Subscription`, `Invoice` (school-scoped), user Stripe fields in `auth.prisma`; migrations added.
- Operator UI: `/(platform)/operator/billing/page.tsx`; actions for receipts and invoices.
- Pricing block: `src/components/marketing/pricing/*` with ISSUE checklist.
- Webhooks: `src/app/api/webhooks/stripe/route.ts` present; requires secret config.

### Gaps to MVP

- [ ] Configure env: STRIPE keys and webhook secret
- [ ] Confirm `generateUserStripe` flow and role guards
- [ ] Manual receipt upload/review flow for Sudan context
- [ ] Operator billing list QA
- [ ] i18n strings
- [ ] Minimal tests for webhook handlers (happy path) and operator actions

### Decision

- Status: PARTIAL — Keep manual/admin-only for MVP; defer self-serve Stripe for later



