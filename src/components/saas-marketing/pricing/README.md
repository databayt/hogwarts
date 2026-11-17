## Pricing — Stripe Billing and Subscription Management

### Overview

Pricing and billing integration connecting the public pricing page to Stripe Checkout and Customer Portal. Handles the end-to-end flow: visitor discovers plans, selects a tier, authenticates, completes checkout, and manages their subscription. Webhooks persist subscription state to the database at both user and school levels.

### Pricing model (2026-11-17)

Graduated and proportional per student, in SAR (kun decision D-20261117-pricing-proportional-sar, supersedes D-20261108): **24 SAR per student a year for students 1–250, 16 SAR for 251–500, 14 SAR for 501 and above** — `annualPriceSAR(n) = 24·min(n,250) + 16·clamp(n−250,0,250) + 14·max(n−500,0)`. Anchors: 250 students = 6,000 SAR, 500 = 10,000, 1,000 = 17,000; above 1,000 the same 14 SAR under its own contract. No flat bands, so no cliffs. Every new school gets **one free month** first (`TRIAL_MONTHS`), no free allowance at any size. Paid **50% when the free month ends, then 4 × 12.5% ending with the school year**; prices before tax. Live classes are included up to a fair-use allowance (100 / 200 / 400 hours a month for schools up to 250 / 500 / 1,000 students; more is quoted). Schools in Sudan pay the USD price in SDG at the bank rate on the day, by bank transfer.

- `rates.ts` — the single source for every number (`quote`, `formatMoney`); the cards, the calculator and the chatbot all read it.
- `exchange-rates.ts` — live SAR → USD/SDG/EGP from open.er-api.com, cached a day, pinned `FALLBACK_RATES` when it fails.
- `currency.tsx` — one currency for the page (SAR · USD · SDG · EGP), remembered per browser via `useSyncExternalStore`.
- `calculator.tsx` — slider steps by one student; annual, monthly, average per-student cost and the instalment plan, live.
- `card.tsx` — fixed anatomy so the three cards line up: four header rows (name · price · one-line description · one-line note), an "Includes" / "Everything in Free, plus" / "Everything in Pro, plus" list (4 / 5 / 6 rows), and one footer (sm button + "More info ↗") pinned with `mt-auto`. Equal heights come from the grid's `items-stretch`.
- `billing-toggle.tsx` — Monthly / Yearly (2026-10-15): display only — the same rate read per month (÷ 12) or per year, no yearly discount. Sits beside the currency toggle.
- Plan names: Free · Pro · **Ultra** — the third plan's id stays `enterprise` (Stripe ids, `lib/subscription`); only its title says Ultra.
- `config.ts` — what each plan *includes*; its `prices` are a derived legacy USD unit kept only for the Stripe subscription code, which this page no longer launches (CTAs go to `/onboarding` or the sales mailto).

### File Structure

```
src/components/saas-marketing/pricing/
├── content.tsx                     # Main pricing page composition
├── card.tsx                        # Plan card — fixed header rows, pinned footer
├── billing-toggle.tsx              # Monthly / Yearly display toggle
├── pricing-header.tsx              # Page header
├── pricing-faqs.tsx                # Pricing FAQ (dictionary-driven)
├── calculator.tsx                  # Per-student price calculator (live, multi-currency)
├── rates.ts                        # RATE_TIERS (24/16/14 SAR/student/yr), instalments — single source
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
