## School Admin/Dashboard — Migration Notes (from Pricing Starter Kit)

This document captures the current entry points, imports, and a suggested move map to align the dashboard and admin UI with our structure under `src/components/school/{admin|dashboard}`. Pricing is already utilized; we will reuse its dashboard UI, then relocate.

### Current entry points and imports

- **Admin**
  - `src/app/(school)/admin/layout.tsx`
    - Auth guard using `getCurrentUser` from `@/lib/session`
  - `src/app/(school)/admin/page.tsx`
    - Imports (do NOT exist yet at these paths):
      - `@/components/dashboard/header`
      - `@/components/dashboard/info-card`
      - `@/components/dashboard/transactions-list`
    - Available equivalents under pricing:
      - `@/components/marketing/pricing/dashboard/header`
      - `@/components/marketing/pricing/dashboard/info-card`
      - `@/components/marketing/pricing/dashboard/transactions-list`
  - `src/app/(school)/admin/loading.tsx`
    - Missing: `@/components/dashboard/header`
    - Exists: `@/components/marketing/pricing/dashboard/header`
  - `src/app/(school)/admin/orders/page.tsx`
    - Missing: `@/components/dashboard/header`
    - Missing: `@/components/shared/empty-placeholder`
    - Exists:
      - `@/components/marketing/pricing/dashboard/header`
      - `@/components/marketing/pricing/shared/empty-placeholder`

- **Dashboard**
  - `src/app/(school)/dashboard/page.tsx`
    - Uses: `@/components/marketing/pricing/lib/session`, `@/components/marketing/pricing/lib/utils`, `@/components/marketing/pricing/dashboard/header`
  - `src/app/(school)/dashboard/loading.tsx`
    - Uses: `@/components/marketing/pricing/dashboard/header`
  - `src/app/(school)/dashboard/settings/page.tsx`
    - Uses: `@/components/marketing/pricing/lib/session`, `@/components/marketing/pricing/lib/utils`
    - Uses forms: `@/components/marketing/pricing/forms/{user-name-form,user-role-form}`
    - Uses: `@/components/marketing/pricing/dashboard/delete-account`, `@/components/marketing/pricing/dashboard/header`
  - `src/app/(school)/dashboard/charts/page.tsx`
    - Uses pricing charts: `@/components/marketing/pricing/charts/*`
    - Uses: `@/components/marketing/pricing/dashboard/header`
  - `src/app/(school)/dashboard/billing/page.tsx`
    - Uses: `@/components/marketing/pricing/lib/{session,subscription,utils}`
    - Uses: `@/components/marketing/pricing/dashboard/header`
    - Uses: `@/components/marketing/pricing/billing-info`
    - Uses: `@/components/marketing/pricing/shared/icons`
    - Uses: `@/lib/db` for `Subscription`/`Invoice` lists scoped by `schoolId`
  - `src/app/(school)/dashboard/billing/checkout/page.tsx`
    - Uses: `@/components/marketing/pricing/actions/generate-user-stripe`, `@/auth`

### Components provided by the pricing starter kit

- Dashboard UI: `src/components/marketing/pricing/dashboard/{header,project-switcher,search-command,section-columns,info-card,transactions-list,upgrade-card}.tsx`
- Billing UI: `src/components/marketing/pricing/billing-info.tsx`
- Charts: `src/components/marketing/pricing/charts/*`
- Shared: `src/components/marketing/pricing/shared/{empty-placeholder,icons}.tsx`
- Forms (settings): `src/components/marketing/pricing/forms/{user-name-form,user-role-form}.tsx`
- Helpers: `src/components/marketing/pricing/lib/{session,subscription,utils}.ts`
- Stripe actions: `src/components/marketing/pricing/actions/generate-user-stripe.ts`

### Suggested move map (you will relocate files)

- `src/components/school/admin/`
  - From pricing:
    - `dashboard/header.tsx` → `admin/header.tsx`
    - `dashboard/info-card.tsx` → `admin/info-card.tsx`
    - `dashboard/transactions-list.tsx` → `admin/transactions-list.tsx`
    - `shared/empty-placeholder.tsx` → `admin/empty-placeholder.tsx` (or central shared location)
  - Later: add `content.tsx` and wire route pages to import `{AdminContent}`

- `src/components/school/dashboard/`
  - From pricing:
    - `dashboard/header.tsx` → `dashboard/header.tsx`
    - `dashboard/delete-account.tsx` → `dashboard/delete-account.tsx`
    - `forms/user-name-form.tsx` → `dashboard/forms/user-name-form.tsx`
    - `forms/user-role-form.tsx` → `dashboard/forms/user-role-form.tsx`
    - `billing-info.tsx` → `dashboard/billing-info.tsx`
    - `charts/*` → `dashboard/charts/*`
    - `shared/empty-placeholder.tsx` → `dashboard/empty-placeholder.tsx` (or shared)
  - Keep helpers under pricing lib for now; centralize later

### Minimal import fixes before moving (quick compile)

Update admin route imports temporarily to pricing paths:

- In `src/app/(school)/admin/page.tsx`, `src/app/(school)/admin/loading.tsx`, and `src/app/(school)/admin/orders/page.tsx`:
  - `@/components/dashboard/header` → `@/components/marketing/pricing/dashboard/header`
  - `@/components/dashboard/info-card` → `@/components/marketing/pricing/dashboard/info-card`
  - `@/components/dashboard/transactions-list` → `@/components/marketing/pricing/dashboard/transactions-list`
  - `@/components/shared/empty-placeholder` → `@/components/marketing/pricing/shared/empty-placeholder`

After relocation, switch imports to:

- `@/components/school/admin/...`
- `@/components/school/dashboard/...`

### Mirror pattern entry points to adopt

- `src/app/(school)/admin/page.tsx` should import `{AdminContent}` from `@/components/school/admin/content`
- `src/app/(school)/dashboard/page.tsx` should import `{DashboardContent}` from `@/components/school/dashboard/content`

### Notes

- We assume trial/paid state as a bypass to progress school features.
- Keep tenant scoping: every query/write includes `schoolId`.
- Use shadcn/ui primitives and aliases per workspace rules.


