# Pricing — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 70%
**Last Updated:** 2026-08-05

---

## MVP Checklist

- [x] Public pricing page with plan cards
- [x] Billing frequency toggle (monthly/annual)
- [x] Feature comparison table
- [x] Per-student pricing model (2026-08-05): Free $0 ≤100 students / Pro $1.50/student/mo (min $30) / Enterprise $1.00/student/mo custom — competitor-grounded (category norm $2–$15/student/mo), tiers renamed Free/Pro/Enterprise, stable `id: PlanId` decouples CTA branching from localized titles (fixes silent /ar breakage)
- [x] Per-student cost calculator (`calculator.tsx`) with slider + yearly toggle
- [x] CTA dead-ends fixed: anonymous cards → `/onboarding` (was nonexistent `/starter/dashboard/billing` → 404), Enterprise + unavailable-Stripe states → `contactHref` mailto (enterprise band's dead `/docs/community/support` link too)
- [x] School-product dictionary copy EN+AR (template "Advanced animations / SEO optimization / One Project / Strategic Partner" junk removed; 6 real FAQs)
- [x] Stripe Checkout Session creation for free-to-paid upgrade
- [x] Stripe Customer Portal for existing subscribers
- [x] Database fields on User (stripeSubscriptionId, stripeCustomerId, stripePriceId, stripeCurrentPeriodEnd)
- [x] School-level Subscription and Invoice models
- [x] Webhook handler for checkout.session.completed and invoice.payment_succeeded
- [x] Role-gated upgrade/manage buttons (ADMIN/DEVELOPER)
- [x] Admin billing page listing Subscription and Invoice by schoolId
- [ ] Fill env price IDs from Stripe Dashboard
- [ ] Configure STRIPE_WEBHOOK_SECRET for production
- [ ] Set NEXT_PUBLIC_APP_URL for production
- [ ] End-to-end manual test: visitor -> login -> upgrade -> portal manage
- [ ] Stripe CLI local webhook testing verified

## Known Issues

### P0 -- Critical

None

### P1 -- High

- Stripe env vars not configured for production deployment — AND the flat-fee Stripe prices they'd point at no longer match the per-student model; billing internals need per-student (quantity/metered) Stripe prices. See the "Billing internals" follow-up issue.
- Central DB client usage needs audit for consistency (some files may import non-existent `prisma` from `@/lib/db`)

### P2 -- Medium

- Operator MRR (`saas-dashboard/billing/config.ts` PLAN_PRICING $99/$299/$999) measures fictional prices — reconcile with the per-student model
- Arabic pricing copy is a draft register — needs Abdout's native pass before ship
- No trial/grace period banners implemented
- Per-plan quota checks (maxStudents) not enforced
- Promotional code support not implemented

## Enhancements (Post-MVP)

- [ ] Move subscription ownership from User to School for org-level billing
- [ ] Trials and grace periods with banners and lockouts
- [ ] Per-plan quota enforcement via middleware and UI messaging
- [ ] Admin billing page under platform dashboard with invoice history
- [ ] A/B testing for pricing tiers

---

**Last Review:** 2026-03-19
