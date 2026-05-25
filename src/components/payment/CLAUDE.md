---
epic: 01
sprint: Q3-2026
title: Payment (multi-gateway block)
file_type: claude
owner: Abdout
maturity: Built+Polish
completion: 70
tracker: https://github.com/databayt/hogwarts/issues/313
docs: https://ed.databayt.org/en/docs/fees
last_audited: 2026-05-25
---

# Payment Block

## Context

Self-contained multi-gateway payment block (Stripe, Tap, cash, bank transfer, mobile money, bankak). Consumed by admission, fees, and any feature collecting money. Handles gateway selection → `initiatePayment` server action → `PaymentTransaction` record → provider checkout → confirmation. 70% complete; Stripe + cash + (now) bankak are live, the rest are stubs in `@/lib/payment/provider`.

## Before You Start

1. Read `README.md` here for props, types, and dependencies
2. Read `ISSUE.md` here for gateway-wiring P1s and post-MVP backlog
3. Read `@/lib/payment/provider` to see which gateways have real implementations vs stubs
4. Read `@/lib/payment/constants` for gateway display names + currency helpers

## Key Decisions

- `initiatePayment` is the only server action — it validates, creates a `PaymentTransaction`, and delegates to `createPaymentCheckout`. Do not bypass it.
- `schoolId` is resolved via `getTenantContext()` — never read from session directly
- Currency formatting goes through `@/lib/payment/currency` `formatCurrency()` with locale; no hardcoded `$`/`SDG`
- Gateway-specific UI lives in `payment-method-card.tsx`; new gateway = add a card variant + a provider entry
- Confirmation view is purely client-side from the redirect — webhook-based async confirmation lives in `api/webhooks/*/route.ts`, not here

## Danger Zones

- Webhook idempotency lives in `api/webhooks/stripe/route.ts` (event ID dedupe) — don't shortcut it from this block
- `bankak` provider is intentionally a placeholder until BoK API spec lands — `createCheckout` returns `success:false`. Treat it as expected, not a bug
- Refunds are NOT in the `PaymentProvider` interface yet (see [finance ISSUE.md](../school-dashboard/finance/ISSUE.md) P2). Don't introduce per-gateway refund logic here without updating the interface first
- The block does not handle webhook-based status updates — bank transfer / async gateways need their own webhook route, or the user re-checks status

## Related Blocks

- [Finance](../school-dashboard/finance/CLAUDE.md) — invoice/fees/payroll consume this block
- [Admission](../onboarding/CLAUDE.md) — admission fees flow through here
- `src/lib/payment/` — provider implementations + types live here, NOT in this block

## After You Finish

1. Update `ISSUE.md` — check off completed items, bump `completion` in frontmatter
2. Run `pnpm tsc --noEmit` — finance/payment type graph is heavy; use `NODE_OPTIONS='--max-old-space-size=8192'` if it OOMs
3. If you added a gateway: confirm webhook handler exists in `api/webhooks/<gateway>/route.ts`
4. Test on `demo.databayt.org` with the Stripe test card or the cash flow
