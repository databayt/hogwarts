# Pricing — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 60%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] Public pricing page with plan cards
- [x] Billing frequency toggle (monthly/annual)
- [x] Feature comparison table
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

- Stripe env vars not configured for production deployment
- Central DB client usage needs audit for consistency (some files may import non-existent `prisma` from `@/lib/db`)

### P2 -- Medium

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
