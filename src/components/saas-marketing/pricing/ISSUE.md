### Epic: Stripe Billing Integration Alignment

Goal: Make the Stripe pricing block fit smoothly with our auth and multi-tenant database, from visitor plan discovery to payment and subscription management.

#### Scope

- Public pricing UI, authenticated upgrade/management, Stripe Checkout + Customer Portal, webhooks, and DB updates on `User`.

#### Tasks

- [ ] Plans data
  - [ ] Fill env price IDs in `src/components/marketing/pricing/config/subscriptions.ts` from Stripe Dashboard.
  - [ ] Confirm plan names and descriptions match marketing copy.

- [ ] Authentication
  - [ ] Ensure `/pricing` renders for visitors and reads session when available.
  - [ ] Confirm `getCurrentUser()` aligns with `src/auth.ts` session shape (id, role, schoolId).
  - [x] Pass `userRole` through pricing to gate upgrade/manage button.

- [x] Database fields on `User`
  - [x] Add: `stripeSubscriptionId`, `stripeCustomerId`, `stripePriceId`, `stripeCurrentPeriodEnd`.
  - [x] Migrate Prisma schema.

- [x] School-level billing models
  - [x] Add `Subscription` and `Invoice` models linked by `schoolId`.
  - [x] Migrate Prisma schema.

- [ ] Server actions and buttons
  - [x] `generateUserStripe` creates Checkout Session for free users and Portal for paid users.
  - [x] `BillingFormButton` wires to correct priceId and handles pending state.
  - [x] Gate management actions by role (ADMIN/DEVELOPER).

- [x] Webhooks
  - [ ] Configure Stripe webhook endpoint and set `STRIPE_WEBHOOK_SECRET`.
  - [x] Handle `checkout.session.completed` → set user fields and upsert school `Subscription`.
  - [x] Handle `invoice.payment_succeeded` → update user fields, upsert school `Subscription`, and record `Invoice`.
  - [x] Use the central DB client consistently in the webhook route.

- [x] Admin Billing Page (Starter)
  - [x] Use `src/app/starter/dashboard/billing/page.tsx` to list `Subscription` and `Invoice` by `schoolId`.
  - [x] Restrict visibility to `DEVELOPER`/`ADMIN`/`ACCOUNTANT`.
  - [x] Keep user plan card visible for all users.

- [x] Environment
  - [x] Add dependency `@t3-oss/env-nextjs` and wire central `src/env.mjs` used across pricing.
  - [ ] Set `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, and all `NEXT_PUBLIC_STRIPE_*` price IDs.
  - [ ] Set `NEXT_PUBLIC_APP_URL`.

- [ ] Testing
  - [ ] Local: `pnpm dev` and `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
  - [ ] Trigger `checkout.session.completed` and `invoice.payment_succeeded` to verify DB updates.
  - [ ] Manual E2E: visitor → login → upgrade → return to `/pricing` → portal manage.

#### Follow-ups (Optional / v2)

- [ ] Move subscription ownership from `User` → `School` for org-level billing (owner-linked).
- [ ] Trials and grace periods with banners and lockouts.
- [ ] Per-plan quota checks (e.g., maxStudents) enforced via middleware and UI messaging.
- [ ] Admin billing page under platform dashboard with invoices history.

#### Acceptance Criteria

- [ ] Users can subscribe/upgrade and manage their subscription without errors.
- [ ] Webhooks reliably persist subscription state to DB.
- [ ] UI reflects correct button state (Upgrade vs Manage Subscription) based on plan.
- [ ] All env vars configured and documented in README.
