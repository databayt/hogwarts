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

**Completion:** 70% | **Blockers:** Only Stripe and cash gateways are likely wired to real providers; Tap, bank transfer, and mobile money may be stub implementations in `@/lib/payment/provider`.
