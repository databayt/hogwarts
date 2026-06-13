---
epic: 01
sprint: Q3-2026
title: Payment (multi-gateway block)
file_type: readme
owner: Abdout
maturity: Built+Polish
completion: 93
tracker: https://github.com/databayt/hogwarts/issues/313
docs: https://ed.databayt.org/en/docs/fees
last_audited: 2026-06-13
---

## Payment — Reusable multi-gateway payment block

### Overview

The payment block provides a self-contained, reusable payment UI that supports multiple payment gateways (Stripe, Tap, cash, bank transfer, mobile money). It is consumed by any feature that needs to collect payments -- currently used in the application flow for admission fees. The block handles gateway selection, payment initiation via server action, summary display, and confirmation.

### File Structure

```
payment/
├── payment-block.tsx           # Main orchestrator component (client)
├── payment-block-actions.ts    # Server action: initiatePayment (validates, creates PaymentTransaction, calls provider)
├── payment-method-card.tsx     # Individual gateway selection card (client)
├── payment-summary.tsx         # Amount/currency display with RTL support (client)
└── payment-confirmation.tsx    # Post-payment success view with checkout result (client)
```

### Key Types

- **PaymentBlockProps**: `context`, `amount`, `currency`, `methods` (gateways), `referenceId`, `schoolId`, `locale`, `successUrl`, `cancelUrl`, optional `bankDetails`, `cashInstructions`, callbacks.
- **PaymentContext**: `"admission_fee" | "saas_subscription" | "tuition_fee" | "school_fee" | "salary_payout" | "course_enrollment"`
- **PaymentGateway**: `"stripe" | "tap" | "cash" | "bank_transfer" | "mobile_money"`

### Server Action

`initiatePayment` validates input with Zod, resolves `schoolId` via `getTenantContext()`, creates a `PaymentTransaction` record in the database, and delegates to `createPaymentCheckout` from `@/lib/payment/provider`. Supports optional `lineItems` and `metadata`.

### Dependencies

- `@/lib/payment/constants` -- gateway display names
- `@/lib/payment/types` -- shared payment types
- `@/lib/payment/currency` -- `formatCurrency()` with locale support
- `@/lib/payment/provider` -- gateway-specific checkout creation

### Status

**Completion:** 93% | Stripe, Tap, cash, bank transfer, ATM deposit, and mobile money all real. Bankak is an intentional stub (BoK API spec pending). Webhooks hardened with `releaseDedupeAndFail` retry, multi-installment allocation, language-aware failure notifications, and collision-safe receipt numbers. **PRODUCT DECISION (2026-06-13): applying to a school is always free — the admission wizard no longer collects an application fee here. Payment occurs only at the fee stage (registration fee on offer acceptance + tuition invoices).**

### Agents & Skills

- `agent:revenue` — payments, gateway selection, refund flows
- `agent:prisma` — `PaymentTransaction` schema + multi-tenant scoping
- `agent:guardian` — OWASP audit (webhook validation, idempotency)
- `skill:/security` — security sweep
- `skill:/guard` — auth + validation sweep
- `skill:/check` — quality gate before ship
