## Billing — SaaS subscription and payment management

### Overview

Production-ready billing system for managing school subscriptions with Stripe integration. Handles subscription lifecycle (upgrade, downgrade, cancel), payment methods, invoices, usage tracking, credit notes, and financial analytics with multi-tenant isolation.

### File Structure

- `actions.ts` — Server actions (subscriptions, payments, invoices, usage, preferences)
- `validation.ts` — Zod schemas for all billing inputs
- `config.ts` — Currency, thresholds, retry config, feature flags
- `types.ts` — TypeScript type definitions
- `adapters.ts` — Data adapters and transformers
- `content.tsx` — Server component (main entry)
- `dashboard.tsx` — Dashboard UI component
- `billing-dashboard.tsx` — Alternative dashboard layout
- `billing-page.tsx` — Billing page component
- `invoice-history.tsx` — Invoice list with filtering
- `resource-usage.tsx` — Usage tracking with progress bars
- `*-demo.tsx` — Demo components (payment card, invoice history, subscription management, billing settings, usage pricing, trial expiry, upcoming charges)

### Status

**Completion:** 90% | **Blockers:** Email notifications (Resend pending), PDF invoice generation, advanced analytics charts
