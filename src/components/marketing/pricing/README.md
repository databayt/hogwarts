### Pricing, Stripe, and Billing Integration

This document explains how the pricing and billing block integrates Stripe with our multi-tenant SaaS. It describes the end-to-end journey from a public visitor discovering plans to authentication, checkout, and subscription management, aligned with our arrangements, authentication, and database architecture.

### Journey: Visitor → Plan → Auth → Checkout → Active Subscription

- **Discover plans**: Public visitor opens `/pricing` and sees plan cards and a comparison table.
- **Select plan**: Clicking Upgrade triggers the billing action.
- **Authenticate**: If not logged in, the user is prompted to sign in/register (Auth.js v5).
- **Checkout/Manage**:
  - Free → Paid: Create a Stripe Checkout Session to subscribe.
  - Paid → Manage: Open Stripe Customer Portal.
- **Webhook updates**: Stripe webhook updates our database with subscription details.
- **Return to app**: Redirect back to `/pricing` and show updated subscription state. Admins see billing options in their dashboard.

### Key Files and Responsibilities

- Route UI
  - `src/app/(marketing)/pricing/page.tsx`: Server component assembling pricing page.
  - `src/app/(marketing)/pricing/loading.tsx`: Loading state.
- Components
  - `src/components/marketing/pricing/pricing/pricing-cards.tsx`: Plan cards + CTA.
  - `src/components/marketing/pricing/pricing/compare-plans.tsx`: Feature matrix.
  - `src/components/marketing/pricing/pricing/pricing-faq.tsx`: FAQ.
- Server actions (mutations)
  - `src/components/marketing/pricing/actions/generate-user-stripe.ts`: Creates Checkout Session or opens Customer Portal based on current plan.
  - `src/components/marketing/pricing/actions/open-customer-portal.ts`: Direct portal action (used by portal button).
- Forms (client components)
  - `src/components/marketing/pricing/forms/billing-form-button.tsx`: Calls `generateUserStripe`.
  - `src/components/marketing/pricing/forms/customer-portal-button.tsx`: Calls `openCustomerPortal`.
- Stripe integration
  - `src/env.mjs`: Central env schema and validation via `@t3-oss/env-nextjs`.
  - `src/components/marketing/pricing/lib/stripe.ts`: Stripe SDK client.
  - `src/components/marketing/pricing/api/webhooks/stripe/route.ts`: Webhook handler—persists subscription updates.
- Subscription logic and user session
  - `src/components/marketing/pricing/lib/subscription.ts`: Derives the user’s plan (paid/free, current period end, interval).
  - `src/components/marketing/pricing/lib/session.ts`: Reads the Auth.js session.
  - `src/components/marketing/pricing/config/subscriptions.ts`: Plan catalog and Stripe Price IDs.

### Data Model and Multi‑Tenant Notes

- Auth session: `src/auth.ts` extends session with `user.id`, `user.role`, `user.schoolId`, etc.
- Subscription fields on `User` (compat layer for pricing UI):
  - `stripeSubscriptionId: string | null`
  - `stripeCustomerId: string | null`
  - `stripePriceId: string | null`
  - `stripeCurrentPeriodEnd: Date | null`
- School-level records (production-ready):
  - `Subscription` with `schoolId`, `stripeSubscriptionId`, `stripeCustomerId`, `stripePriceId`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `status`.
  - `Invoice` with `schoolId`, `stripeInvoiceId`, `amountDue`, `amountPaid`, `currency`, `status`, `periodStart`, `periodEnd`.
  - Webhooks upsert these records so billing can be school-centric while UI remains user-centric.

- Multi-tenant guardrail: Derive tenant context from `session.user.schoolId`; all queries include `schoolId`.

Migration reminder (if fields are missing):

```prisma
model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  // ...other fields...

  stripeSubscriptionId  String?
  stripeCustomerId      String?
  stripePriceId         String?
  stripeCurrentPeriodEnd Date?
}
```

### Environment Variables

Required in `.env` (or project env):

```env
# Stripe core
STRIPE_API_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs (public)
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Stripe Dashboard Setup

1) Create Products and Prices in Stripe:
   - Pro (Monthly and Yearly) → map to `NEXT_PUBLIC_STRIPE_PRO_*`.
   - Business (Monthly and Yearly) → map to `NEXT_PUBLIC_STRIPE_BUSINESS_*`.
2) Add a webhook endpoint pointing to:
   - Local via Stripe CLI: `/api/webhooks/stripe`
   - Production: `{YOUR_DOMAIN}/api/webhooks/stripe`
   - Listen to `checkout.session.completed` and `invoice.payment_succeeded`.
3) Set `STRIPE_WEBHOOK_SECRET` from the created endpoint.

### Flow Details

- Pricing page loads with `getCurrentUser()` and optionally `getUserSubscriptionPlan(user.id)` to compute plan state.
- `BillingFormButton` calls the server action `generateUserStripe(priceId)`:
  - If the user already has an active paid plan with a `stripeCustomerId` → open Customer Portal.
  - If free/no active plan → create a Checkout Session with line item `priceId`.
- Webhook handler persists data:
  - On `checkout.session.completed`: set user fields and upsert `Subscription` for the user’s `schoolId`.
  - On `invoice.payment_succeeded`: update user fields, upsert `Subscription`, and upsert `Invoice`.
- After checkout/portal, user is redirected to `/pricing` where the UI reflects updated status.

### Testing Locally with Stripe CLI

```bash
# 1) Install deps and run dev
pnpm install
pnpm dev

# 2) In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 3) Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
```

### Integration Checks and Known Gaps

- Imports alignment:
  - Prefer the central Prisma client at `@/lib/db` (exports `db`).
  - If a helper needs `prisma`, expose it from the central module or refactor to use `db` consistently.
  - Ensure files under `pricing/lib/*` don’t import a non-existent `prisma` from `@/lib/db`.
- Webhook handler consistency:
  - Use the same DB client (`db`) for all updates inside `api/webhooks/stripe/route.ts`.
- Authorization:
  - Only authenticated users should be able to start checkout or open portal.
  - Gate manage/upgrade buttons by role if needed (e.g., only OWNER/ADMIN).
- Tenant safety:
  - Use `session.user.schoolId` to scope tenant-specific UI and quota checks.
- Trials and grace periods:
  - Not implemented in this block—handled elsewhere per arrangements. Consider adding trial banners and expiry logic.

### Acceptance Criteria (v1)

- Public `/pricing` is accessible and shows plans.
- Authenticated user can start a checkout for Pro/Business and return successfully.
- Webhooks update the user’s subscription fields.
- Users with an active paid plan see “Manage Subscription” (portal), others see “Upgrade”.
- Central DB client usage is consistent and type-safe; no `any` leakage.
- Starter admin billing page lists school `Subscription` and `Invoice` for privileged roles.

### References

- Stripe with dashboard built from starter saa kit at:
https://github.com/mickasmt/next-saas-stripe-starter
https://next-saas-stripe-starter.vercel.app/


- Arrangements: `src/app/docs/arrangements/page.mdx`
- Authentication: `src/app/docs/authantication/page.mdx`, `src/auth.ts`
- Database: `src/app/docs/database/*`, `src/lib/db.ts`


### Apendix

# Neon connection
DATABASE_URL="postgresql://neondb_owner:npg_T2oXm6LEBiRQ@ep-fancy-art-aemvq040-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:npg_T2oXm6LEBiRQ@ep-fancy-art-aemvq040-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"


# Google OAuth credentials
GOOGLE_CLIENT_ID=808790055218-sm34pfo7aeu28i3rhp5fss8eafai4741.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=***REMOVED***

# Facebook OAuth
FACEBOOK_CLIENT_ID=1985407775320438
FACEBOOK_CLIENT_SECRET=19eeeb99ccc25ebd227b6a8382d7c420

AUTH_SECRET=secret
NEXTAUTH_URL=http://localhost:3000 

RESEND_API_KEY=re_hyFmypBG_6oac4nHXtpfiFNVSJJWTtSPo

NEXT_PUBLIC_APP_URL=http://localhost:3000
DOMAIN=http://localhost:3000

# Production
# Subdomain is now used instead of base path
NEXT_PUBLIC_MAIN_APP_URL=https://hc.databayt.org

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dfgvcib7o
NEXT_PUBLIC_CLOUDINARY_API_KEY=982149576696869
NEXT_PUBLIC_CLOUDINARY_API_SECRET=9aKxJkYi0OlmfRCt5SDg0z6cEgs
NEXT_PUBLIC_CLOUDINARY_URL=cloudinary://982149576696869:9aKxJkYi0OlmfRCt5SDg0z6cEgs@dfgvcib7o
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=nmbdnmbd

TELEGRAM_NOTIFICATIONS_ENABLED=true
TELEGRAM_BOT_TOKEN=7532530964:AAHWWKT9yNv1SbZpSj6hJtCBBm0ScoGiX4g
MEMBERSHIP_SECRETARY_TELEGRAM_CHAT_ID=5357183430
MEMBERSHIP_NOTIFICATIONS_CHANNEL=@your_channel_name

NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_1bYFu1DYeOL9zgvEat7B+VCDa0I=
IMAGEKIT_PRIVATE_KEY=private_jW/1hSbpX17APTjkO34mpB36yBg=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/abdout


# ------------------------------
# App Core
# ------------------------------
NODE_ENV=production

# Public app URL
# - Dev: http://localhost:3000
# - Prod: https://your-domain.tld
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth / Auth.js
# - In prod, set NEXTAUTH_URL to your public URL
# NEXTAUTH_URL=https://your-domain.tld
# Generate with: openssl rand -base64 32
# AUTH_SECRET=replace-with-32-bytes-secret

# ------------------------------
# Multi-tenant / Domains
# ------------------------------
# Used by middleware to resolve subdomains → school context
# Example: subdomain.school root domain is hogwarts.app → set this to hogwarts.app
NEXT_PUBLIC_ROOT_DOMAIN=hogwarts.app
# Default demo school subdomain for local/dev flows
DEFAULT_SCHOOL_DOMAIN=demo
# Allow self-serve school signup from marketing
ALLOW_SCHOOL_SIGNUP=true

# ------------------------------
# Database (Neon Postgres / Postgres)
# ------------------------------
# Postgres connection string (pooled if available)
# DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public

# ------------------------------
# Stripe (Server)
# ------------------------------
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51RuqjqBk7648DxDsnIprNZSisoTcnmOjsQi6iXZwXeBDr2Op3Eu70Z7n57EZsr99iE4080fd8fRzr3fVNHmHfNbC00camXNfpg"
STRIPE_API_KEY="***REMOVED***"


# Webhook secret from Stripe endpoint config (or Stripe CLI)
# Dev (Stripe CLI): `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
# Prod (Dashboard): endpoint https://your-domain.tld/api/webhooks/stripe
STRIPE_WEBHOOK_SECRET=secret

# ------------------------------
# Stripe (Public plan price IDs)
# ------------------------------
# Map to your Products/Prices in Stripe
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_xxx
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_xxx
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_xxx
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_xxx

# ------------------------------
# Email (Resend)
# ------------------------------
# RESEND_API_KEY=re_xxx

# ------------------------------
# OAuth Providers (Optional now; enable when ready)
# ------------------------------
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# FACEBOOK_CLIENT_ID=
# FACEBOOK_CLIENT_SECRET=

# ------------------------------
# Feature Limits (per plan)
# ------------------------------
BASIC_MAX_STUDENTS=100
PREMIUM_MAX_STUDENTS=500
ENTERPRISE_MAX_STUDENTS=2000

# ------------------------------
# Build/Runtime (recommended for large builds)
# ------------------------------
# Increase Node memory for Next.js build
NODE_OPTIONS=--max_old_space_size=4096
# Disable Next telemetry if desired
NEXT_TELEMETRY_DISABLED=1


