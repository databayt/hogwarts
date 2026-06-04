---
epic: 01
sprint: Q3-2026
title: Payment (multi-gateway block)
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 70
tracker: https://github.com/databayt/hogwarts/issues/313
docs: https://ed.databayt.org/en/docs/fees
last_audited: 2026-05-25
---

# Payment — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 70%
**Last Updated:** 2026-05-25

---

## MVP Checklist

### UI Components

- [x] PaymentBlock orchestrator (gateway selection, initiation, confirmation flow)
- [x] PaymentMethodCard (per-gateway card with display name/icon)
- [x] PaymentSummary (formatted amount with RTL/LTR locale support)
- [x] PaymentConfirmation (success view with checkout result details)

### Server Actions

- [x] `initiatePayment` with Zod validation
- [x] PaymentTransaction record creation in database
- [x] Delegation to `createPaymentCheckout` provider
- [x] Multi-tenant scoping via `getTenantContext()`

### Gateway Support

- [x] Stripe gateway enum and schema entry
- [x] Tap gateway enum and schema entry
- [x] Cash gateway enum and schema entry
- [x] Bank transfer gateway enum and schema entry
- [x] Mobile money gateway enum and schema entry
- [ ] Verify all gateways have working provider implementations in `@/lib/payment/provider`

### Validation

- [x] Zod schema for `initiatePayment` (gateway, amount, currency, context, URLs)
- [x] Optional line items and metadata validation
- [x] Customer email validation

### i18n

- [x] RTL-aware currency formatting
- [x] Locale-aware summary display
- [ ] Localized gateway names and instructions

---

## Known Issues

### P1 — High

- **Unverified gateway implementations**: The `payment-block-actions.ts` schema lists 5 gateways, but it is unclear which have real implementations in `@/lib/payment/provider`. Tap, bank transfer, and mobile money may return errors or stubs in production.
- **No webhook handling in this block**: Payment confirmation relies on redirect URLs. Webhook-based status updates (for async gateways like bank transfer) are not handled here -- verify they exist elsewhere.

### P2 — Medium

- **No error recovery UI**: If `initiatePayment` fails mid-flow, the user sees an alert but has no retry mechanism beyond re-selecting a gateway.
- **Bank details / cash instructions**: Props exist (`bankDetails`, `cashInstructions`) but rendering logic needs verification for completeness.

---

## Enhancements (Post-MVP)

- Add retry/back flow when payment initiation fails
- Add loading skeleton during payment processing
- Support payment receipts (PDF generation or email)
- Add webhook status sync for async payment methods
- Localize gateway display names and payment instructions via dictionary

---

**Last Review:** 2026-03-19
