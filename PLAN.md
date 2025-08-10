## Dashboard Refactor Plan — Auth.js + Multi‑tenant (Hogwarts)

### Goals
- Replace Clerk with Auth.js across the copied dashboard code.
- Temporarily disable all table usage until our server-side data layer is ready.
- Tune the dashboard to operate as a SaaS admin for a multi‑tenant school management system (tenant = `schoolId`).

Reference: Adopt UI/structure patterns from the source dashboard starter while aligning to Hogwarts standards: [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter).

### Inventory (from copied dashboard code)
- Clerk usages to remove:
  - `src/app/(platform)/dashboard/page.tsx` — `import { auth } from '@clerk/nextjs/server'`
  - `src/components/platform/dashboard/profile/components/profile-view-page.tsx` — `import { UserProfile } from '@clerk/nextjs'`
- Table usages to temporarily disable:
  - `src/app/(platform)/dashboard/product/page.tsx` — `DataTableSkeleton` usage
  - `src/components/platform/dashboard/products/components/product-tables/index.tsx` — `DataTable`, `DataTableToolbar`, `useDataTable`
  - `src/components/platform/dashboard/products/components/product-tables/columns.tsx` — data table columns

Our repo already uses Auth.js (NextAuth v5) with multi‑tenant guardrails; see `src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts`, and docs `src/app/docs/authantication/page.mdx`.

---

## Phase 1 — De‑Clerk and switch to Auth.js

1) Replace server-side auth import in dashboard root page
   - Edit `src/app/(platform)/dashboard/page.tsx`:
     - Change Clerk import to `import { auth } from '@/auth'`.
     - Ensure `const session = await auth()` and gate content accordingly.

2) Replace Clerk profile component
   - Edit `src/components/platform/dashboard/profile/components/profile-view-page.tsx`:
     - Remove `UserProfile` from `@clerk/nextjs`.
     - Replace with our Auth.js-based profile UI:
       - Read user via `useCurrentUser` from `src/components/auth/use-current-user` (client) or `auth()` (server).
       - Render fields (name, email, image) and link to settings flows from `src/components/auth/setting/*`.
       - If needed, provide a placeholder "Profile coming soon" panel to unblock rollout.

3) Remove any lingering Clerk providers/hooks
   - Search for `ClerkProvider`, `useUser`, `SignIn`, `UserButton`. If found in the copied dashboard, remove and replace with our components:
     - Login/Logout buttons: `src/components/auth/login-button.tsx`, `logout-button.tsx`.
     - Role-gated UI: `src/components/auth/role-gate.tsx`.

4) Env and config
   - Remove Clerk env references from any copied docs/components.
   - Ensure Auth.js envs exist: `AUTH_SECRET`, OAuth keys, `NEXT_PUBLIC_APP_URL`.
   - Confirm middleware keeps `/docs/**` public and platform routes protected.

5) Docs alignment
   - In docs, reference `src/app/docs/authantication/page.mdx` for Auth.js usage.
   - Note the migration away from Clerk in any dashboard-related docs.

Acceptance: No imports from `@clerk/*` remain; dashboard renders behind Auth.js auth gate; profile page no longer references Clerk.

---

## Phase 2 — Temporarily disable tables

1) Product route
   - Edit `src/app/(platform)/dashboard/product/page.tsx`:
     - Comment/remove `DataTableSkeleton` and all data table UI.
     - Render a placeholder: "Product table coming soon" with a neutral card.

2) Product tables module
   - Edit `src/components/platform/dashboard/products/components/product-tables/index.tsx` and `columns.tsx`:
     - Comment exports or replace component body with a minimal stub that returns `null` until backend is ready.

3) Navigation
   - Edit `src/components/platform/dashboard/nav-main.tsx` (or equivalent navigation file in the copied area):
     - Hide or comment out the "Products" menu item for now to avoid dead links.

Acceptance: No data table components render or import on product pages; nav hides the unfinished table section.

---

## Phase 3 — Multi‑tenant tuning (schoolId everywhere)

1) Tenant context
   - Source tenant from subdomain or session: `const session = await auth(); const schoolId = session?.user.schoolId;`.
   - Create `getTenantContext()` helper (server-only) to resolve `{ schoolId, requestId }`.

2) Org/School switcher
   - Edit `src/components/platform/dashboard/org-switcher.tsx` to list schools for the current user.
     - Load schools with Prisma scoped to the authenticated user.
     - On change, redirect to the selected tenant subdomain or set a tenant cookie and revalidate.

3) Server actions and queries
   - In any server action or loader under dashboard, include `{ schoolId }` in every Prisma `where` and `create`.
   - Enforce uniqueness within tenant scope.
   - Log `{ requestId, schoolId }` for observability.

4) URL/state
   - Prefer URLs that are tenant-aware (subdomain) and ensure client state (e.g., via `nuqs`) doesn’t leak across tenants.

5) UI polish for SaaS admin
   - Dashboard overview: show tenant-scoped KPIs (students, staff, attendance, payments) using placeholders until APIs are ready.
   - Profile/settings: expose tenant-level settings panels (branding, locale, academic year defaults, billing link) guarded by roles.

Acceptance: All dashboard reads/writes are tenant-scoped; switcher updates tenant; overview panels read tenant-safe data or placeholders.

---

## Phase 4 — Follow-ups (post-MVP)

- Re-enable tables using our shared Data Table block under `src/components/table/*` with server-driven pagination, filters mapped to Prisma, and tenant scoping.
- Add billing/admin panels for SaaS ops (plan, seats, usage) with role gates.
- Add audit logging for sensitive actions with `schoolId` context.

---

## Task Checklist (quick copy/paste)

- [ ] Replace Clerk imports in:
  - [ ] `src/app/(platform)/dashboard/page.tsx`
  - [ ] `src/components/platform/dashboard/profile/components/profile-view-page.tsx`
- [ ] Remove/hide data tables:
  - [ ] `src/app/(platform)/dashboard/product/page.tsx`
  - [ ] `src/components/platform/dashboard/products/components/product-tables/index.tsx`
  - [ ] `src/components/platform/dashboard/products/components/product-tables/columns.tsx`
  - [ ] Hide nav link(s) to product tables
- [ ] Wire tenant context and switcher
  - [ ] Helper to resolve `{ schoolId, requestId }`
  - [ ] Update `org-switcher.tsx`
  - [ ] Ensure all dashboard server actions/queries include `schoolId`
- [ ] Docs: point to `src/app/docs/authantication/page.mdx` and remove Clerk references
- [ ] Env: ensure Auth.js variables; remove any Clerk envs in copied code

---

## Notes
- UI rules: use shadcn/ui primitives, Tailwind utilities, `cn` helper, and compositional patterns.
- Server Actions: "use server", Zod-parse inputs, return typed results, revalidate/redirect on success.
- Multi‑tenant: every DB call includes `schoolId`; all uniqueness is within tenant scope.


