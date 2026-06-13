# Payment — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 93%
**Last Updated:** 2026-06-13
**Source of truth:** [hogwarts#356](https://github.com/databayt/hogwarts/issues/356) (Aldar UAE payment readiness)

---

## MVP Checklist

### UI Components

- [x] PaymentBlock orchestrator (gateway selection, initiation, confirmation flow) — generic, retained for admission/SaaS contexts
- [x] PaymentMethodCard (per-gateway card with display name/icon)
- [x] PaymentSummary (formatted amount with RTL/LTR locale support)
- [x] PaymentConfirmation (success view with checkout result details)
- [x] FeePaymentMethods (Aldar P0.4 — fee-specific parent picker, tighter ownership check via `createFeePaymentCheckout`)

### Server Actions

- [x] `initiatePayment` with Zod validation
- [x] PaymentTransaction record creation in database
- [x] Delegation to `createPaymentCheckout` provider
- [x] Multi-tenant scoping via `getTenantContext()`
- [x] `createFeePaymentCheckout` extended with optional gateway arg + region-aware routing (Aldar P0.4)
- [x] `markPaymentCleared` server action for offline-payment reconciliation (Aldar P2.1) — `fees:approve` permission, idempotent, `$transaction`-wrapped

### Gateway Support

- [x] Stripe gateway — wallets auto-unlocked (Aldar P0.3 dropped the `payment_method_types: ["card"]` hardcode); Apple Pay + Google Pay surface when Dashboard supports them
- [x] Tap gateway — real integration, AE-first routing, source.payment_method mapped to enum (Aldar P1.3 + P1.4); webhook signature now fails-closed (P1.2)
- [x] Cash gateway
- [x] Bank transfer gateway — full offline flow with deposit slip URL + bank branch + sender IBAN (Aldar P2.1)
- [x] ATM deposit gateway (Aldar P2.2 — new PaymentMethod.ATM_DEPOSIT enum value + form variant)
- [x] Mobile money gateway
- [ ] Bankak gateway — still stub pending Bank of Khartoum API spec (SD-only)

### Validation

- [x] Zod schema for `initiatePayment` (gateway, amount, currency, context, URLs)
- [x] Optional line items and metadata validation
- [x] Customer email validation

### i18n

- [x] RTL-aware currency formatting (Aldar P0.1 — `formatCurrency` requires currency arg)
- [x] Locale-aware summary display
- [x] Localized gateway names and instructions (Aldar P3.4 — Apple Pay / Google Pay / mada / KNET en + ar)
- [x] AED end-to-end audit complete (Aldar P0.1–P0.5)

---

## Recent Work (2026-06-13 — Admission+Finance production-readiness pass)

### Webhook Hardening

- [x] `catch` blocks in both `api/webhooks/stripe/route.ts` and `api/webhooks/tap/route.ts` now call `releaseDedupeAndFail` — webhook retries instead of silent 200 data-loss on handler crash
- [x] `checkout.session.expired` handler: clears stuck admission state (payment link expired → applicant can retry)
- [x] `payment_failed` notification is now language-aware (dispatched in the school's preferred language, not hardcoded English)
- [x] Multi-installment invoice allocation: on payment success, oldest-unpaid invoice credited first using new `UserInvoice.amountPaid` + `PARTIAL` status
- [x] Duplicate webhook handlers removed (conflicting Tap + Stripe duplicate event registrations cleaned up)
- [x] Tap `registration_fee` charge type now handled in the Tap webhook route
- [x] `receiptNumber` generation is now collision-safe (unique constraint + retry logic)
- [x] `createFeePaymentCheckout` is gateway-aware for UAE: auto-routes to Tap for AED currency schools

### Receipt

- [x] Receipt PDF route (`/api/payment/[paymentId]/receipt`) is now status-guarded (only PAID/CLEARED payments), i18n-ready, and includes school name + currency
- [x] Receipt link surfaced in payment metadata and in the my-fees view

### Admission — Fee Stage (PRODUCT DECISION: applying is always free)

- [x] Application wizard fees step is now an informational preview only — no payment-method selection, no bankak/kashi icons; payment happens only after offer acceptance
- [x] `payment` route in the application flow redirects appropriately; success modal label changed from "password" to "Application Tracking Code"
- [x] `callbackUrl` now preserves the full token'd offer path through login so the registration-fee page is reachable after redirect
- [x] Registration-fee success/fail banners shown on the offer page
- [x] Offer payment flow is rate-limited; abandoned-checkout retry path unblocked

---

## Known Issues

### P1 — High

- ~~Unverified gateway implementations~~ — verified during Aldar P0 audit (see #356). Stripe + Tap + Cash + Bank Transfer + ATM Deposit + Mobile Money all real; Bankak remains an intentional stub gated for SD.
- ~~No webhook handling~~ — Stripe + Tap webhooks both wire end-to-end with `ProcessedWebhookEvent` dedupe + `releaseDedupeAndFail` retry; Bankak stub kept for future BoK API spec.

### P2 — Medium

- **No error recovery UI**: If `initiatePayment` fails mid-flow, the user sees an alert but has no retry mechanism beyond re-selecting a gateway.
- **Bank details / cash instructions**: Props exist (`bankDetails`, `cashInstructions`) but rendering logic needs verification for completeness.
- **`PaymentBlock` has no live caller** for fees — replaced by `FeePaymentMethods`. Still used by admission + SaaS contexts; candidate for consolidation in a follow-up.
- **`payment/content.tsx` dead-file cleanup** — file is unused after admission wizard refactor; deferred.

---

## Enhancements (Post-MVP)

- Add retry/back flow when payment initiation fails
- Add loading skeleton during payment processing
- ~~Support payment receipts (PDF generation or email)~~ — server PDF at `/api/payment/[paymentId]/receipt` (Aldar P1.5); email delivery deferred to a future cycle
- Add webhook status sync for async payment methods (Tap FAILED now notifies; subscription invoice_failed still logs only)
- ~~Localize gateway display names and payment instructions via dictionary~~ — done in Aldar P3.4

---

**Last Review:** 2026-06-13
