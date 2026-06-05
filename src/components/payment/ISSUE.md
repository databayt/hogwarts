# Payment — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 85% (after Aldar P0–P3 ship)
**Last Updated:** 2026-05-28
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

## Known Issues

### P1 — High

- ~~Unverified gateway implementations~~ — verified during Aldar P0 audit (see #356). Stripe + Tap + Cash + Bank Transfer + ATM Deposit + Mobile Money all real; Bankak remains an intentional stub gated for SD.
- ~~No webhook handling~~ — Stripe + Tap webhooks both wire end-to-end with `ProcessedWebhookEvent` dedupe; Bankak stub kept for future BoK API spec.

### P2 — Medium

- **No error recovery UI**: If `initiatePayment` fails mid-flow, the user sees an alert but has no retry mechanism beyond re-selecting a gateway.
- **Bank details / cash instructions**: Props exist (`bankDetails`, `cashInstructions`) but rendering logic needs verification for completeness.
- **`PaymentBlock` has no live caller** for fees — replaced by `FeePaymentMethods`. Still used by admission + SaaS contexts; candidate for consolidation in a follow-up.

---

## Enhancements (Post-MVP)

- Add retry/back flow when payment initiation fails
- Add loading skeleton during payment processing
- ~~Support payment receipts (PDF generation or email)~~ — server PDF at `/api/payment/[paymentId]/receipt` (Aldar P1.5); email delivery deferred to a future cycle
- Add webhook status sync for async payment methods (Tap FAILED now notifies; subscription invoice_failed still logs only)
- ~~Localize gateway display names and payment instructions via dictionary~~ — done in Aldar P3.4

---

**Last Review:** 2026-05-28
