## Pricing — Stripe Billing and Subscription Management

### Overview

Pricing and billing integration connecting the public pricing page to Stripe Checkout and Customer Portal. Handles the end-to-end flow: visitor discovers plans, selects a tier, authenticates, completes checkout, and manages their subscription. Webhooks persist subscription state to the database at both user and school levels.

### Pricing model (2026-08-05)

Per-student: **Free $0 (≤100 students) · Pro $1.50/student/mo ($30/mo minimum) · Enterprise $1.00/student/mo (custom-quoted, 1,000+ students)**; yearly billing is 20% off ($1.20/$0.80 units). `config.ts` is the single source of truth (`pricingData`, stable `id: PlanId`; the dictionary overlays display text only). `calculator.tsx` renders the interactive per-student estimator between the cards and the compare table, sharing `getMonthlyCost` with the card math. Stripe checkout still expects flat-fee price ids (env unset) — per-student Stripe wiring is tracked in the "Billing internals" follow-up issue.

### File Structure

```
src/components/saas-marketing/pricing/
├── content.tsx                     # Main pricing page composition
├── card.tsx                        # Plan card component
├── pricing-header.tsx              # Page header
├── pricing-faqs.tsx                # Pricing FAQ (dictionary-driven)
├── calculator.tsx                  # Per-student cost calculator (slider + yearly toggle)
├── billing-toggle.tsx              # Monthly/annual toggle
├── CheckoutLauncher.tsx            # Stripe checkout trigger
├── forms/
│   ├── billing-form-button.tsx     # Calls generateUserStripe action
│   ├── user-auth-form.tsx          # Auth form for pricing
│   ├── user-role-form.tsx          # Role selection form
│   ├── user-role.action.ts         # Role action
│   ├── user-name.action.ts         # Name action
│   └── newsletter-form.tsx         # Newsletter signup
├── sections/
│   ├── hero-landing.tsx            # Pricing hero
│   ├── features.tsx                # Feature comparison
│   ├── bentogrid.tsx               # Bento grid layout
│   ├── testimonials.tsx            # Customer testimonials
│   ├── info-landing.tsx            # Info section
│   ├── preview-landing.tsx         # Preview section
│   └── powered.tsx                 # Powered-by section
├── config/
│   ├── site.ts                     # Site config
│   ├── landing.ts                  # Landing page config
│   ├── marketing.ts                # Marketing config
│   ├── blog.ts                     # Blog config
│   └── docs.ts                     # Docs config
├── types/
│   └── index.d.ts                  # Type definitions
├── shared/                         # Shared UI components
├── modals/                         # Auth modals
├── hooks/                          # Custom hooks
├── emails/
│   └── magic-link-email.tsx        # Magic link email template
├── README.md
└── ISSUE.md
```

### Status

**Completion:** 60% | **Blockers:** Stripe env vars not configured for production, webhook endpoint not deployed

### Integration Points

- **Stripe**: Checkout Sessions and Customer Portal via server actions
- **Auth**: NextAuth v5 session for gating upgrade/manage buttons
- **Database**: `User.stripe*` fields + `Subscription` and `Invoice` models by `schoolId`
- **Webhook**: `src/app/api/webhooks/stripe/route.ts` handles `checkout.session.completed` and `invoice.payment_succeeded`
- **Environment**: `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_*` price IDs required
