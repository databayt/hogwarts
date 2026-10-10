## Pricing — Stripe Billing and Subscription Management

### Overview

Pricing and billing integration connecting the public pricing page to Stripe Checkout and Customer Portal. Handles the end-to-end flow: visitor discovers plans, selects a tier, authenticates, completes checkout, and manages their subscription. Webhooks persist subscription state to the database at both user and school levels.

### Pricing model (2026-10-10)

From the pricing rationale (6,000 SAR a year for 250 students), as one weight per student: **24 SAR per student per year, the first 100 students free on every plan** — annual price = (students − 100) × 24 SAR, so it moves by exactly 24 SAR per student with no bands. Paid **50% at signing, then 12.5% at months 3, 6, 9, 12**; prices before VAT (15% KSA); plus a 3-month free trial. Enterprise (1,000+) = same rate + dedicated contract.

- `rates.ts` — the single source for every number (`quote`, `formatMoney`); the cards, the calculator and the chatbot all read it.
- `exchange-rates.ts` — live SAR → USD/SDG/EGP from open.er-api.com, cached a day, pinned `FALLBACK_RATES` when it fails.
- `currency.tsx` — one currency for the page (SAR · USD · SDG · EGP), remembered per browser via `useSyncExternalStore`.
- `calculator.tsx` — slider steps by one student; annual, monthly, effective per-student cost and the instalment plan, live.
- `config.ts` — what each plan *includes*; its `prices` are a derived legacy USD unit kept only for the Stripe subscription code, which this page no longer launches (CTAs go to `/onboarding` or the sales mailto).

### File Structure

```
src/components/saas-marketing/pricing/
├── content.tsx                     # Main pricing page composition
├── card.tsx                        # Plan card component
├── pricing-header.tsx              # Page header
├── pricing-faqs.tsx                # Pricing FAQ (dictionary-driven)
├── calculator.tsx                  # Per-student price calculator (live, multi-currency)
├── rates.ts                        # 24 SAR/student/yr, free 100, instalments — single source
├── exchange-rates.ts               # Live SAR → USD/SDG/EGP (daily cache + fallback)
├── currency.tsx                    # Page-wide currency context + toggle
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
