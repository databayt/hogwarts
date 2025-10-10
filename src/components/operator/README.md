## Operator Block — Overview

The Operator block provides platform-level tools to manage schools (tenants), domains, billing, observability, and high-level product configuration across the multi-tenant system.

- Tech & conventions: Next.js App Router, TypeScript (strict), Tailwind, shadcn/ui (+ Radix), Zod. Follow mirror pattern between `src/components/platform/operator/*` and `src/app/(platform)/operator/*`.
- Multi-tenant guardrails: Every query and mutation must include `schoolId`. Uniqueness is scoped by `schoolId`.
- Auth: NextAuth v5 (Auth.js). Session shape extended in `src/auth.ts`. Keep callbacks pure and typed.

### Directory Structure (mirror pattern)

- Components: `src/components/platform/operator/*`
- Route: `src/app/(platform)/operator/*`

Key primitives and compositions present:

- Navigation and shell: `app-sidebar.tsx`, `nav-main.tsx`, `nav-user.tsx`, `nav-projects.tsx`, `breadcrumbs.tsx`, `search-input.tsx`
- Theming & session UX: `theme-selector.tsx`, `impersonation-banner.tsx`, `org-switcher.tsx`, `user-avatar-profile.tsx`
- Building blocks: `file-uploader.tsx`, `form-card-skeleton.tsx`, `icons.tsx`
- Feature areas (scaffolded): `tenants/`, `profile/`, `products/`, `domains/`, `billing/`, `observability/`, `overview/`, `kanban/`
- App mirror exists at `src/app/(platform)/operator/*` including `layout.tsx` and `page.tsx` with feature directories.

### What “Operator” owns (from docs)

Requirements and roadmap alignment extracted from:
- `docs/requeriments/page.mdx`
- `docs/roadmap/page.mdx`
- `docs/arrangements/page.mdx`

- Tenants: create/view schools, plan/trial status, subscription snapshot
- Domains: subdomain lifecycle, custom domain guidance and verification
- Billing: invoices list, manual receipt upload/review; online-ready later
- Observability: logs (requestId, schoolId), basic metrics, error tracking
- Access & safety: RBAC for operator-only tools, impersonation with audit

## Current Implementation Snapshot

Status legend: [x] done, [~] in progress, [ ] todo

### ✅ What's Working Well
- [x] Server Actions with proper "use server" directive
- [x] Validation using Zod schemas
- [x] Basic test coverage for critical features
- [x] RBAC enforcement with requireOperator()
- [x] Audit logging for all operator actions
- [x] Impersonation with proper session management

### ⚠️ Architecture Compliance Issues
- **Mirror Pattern**: Currently at wrong path (`src/components/operator/` should be `src/components/platform/operator/`)
- **Typography**: 30+ violations using hardcoded text-* classes instead of semantic HTML
- **Standardization**: Missing required files (type.ts, form.tsx, config.ts, etc.)
- **Component Hierarchy**: Not following UI → Atoms → Features pattern
- **TypeScript**: Extensive `any` usage (30+ instances), Prisma types bypassed with `(db as any)`
- **Performance**: Client-side data fetching instead of server components

### Component Implementation Status
- Shell & navigation
  - [x] App layout and sidebar (`layout.tsx`, `app-sidebar.tsx`)
  - [x] Top-level nav and breadcrumbs (`nav-main.tsx`, `breadcrumbs.tsx`)
  - [x] User menu and avatar (`nav-user.tsx`, `user-avatar-profile.tsx`)
  - [x] Project/org quick nav (`nav-projects.tsx`)
  - [x] Search input (`search-input.tsx`)
- Cross-cutting UX
  - [x] Theme selector (`theme-selector.tsx`)
  - [x] Org switcher (`org-switcher.tsx`)
  - [x] Impersonation banner (`impersonation-banner.tsx`)
  - [x] File uploader building block (`file-uploader.tsx`)
  - [x] Form skeletons (`form-card-skeleton.tsx`)
- Feature scaffolds (routes + component folders)
  - [~] Tenants (`/operator/tenants`) - Missing standardized files
  - [~] Domains (`/operator/domains`) - Missing standardized files
  - [~] Billing (`/operator/billing`) - Missing standardized files
  - [~] Observability (`/operator/observability`) - Missing standardized files
  - [~] Overview (`/operator/overview`) - Performance issues
  - [~] Products (`/operator/product`) - Needs renaming to `products`
  - [~] Profile (`/operator/profile`) - Incomplete
  - [~] Kanban demo (`/operator/kanban`) - Demo status

Notes:
- Server Actions folder exists: `src/app/(platform)/operator/actions/*` (to be filled with typed actions using Zod + "use server").
- Ensure all mutations and queries include `schoolId`.

## Implementation Plan (tracked in ISSUE.md)

High-level phases to reach “Operator-ready”:

1) Data tables and filtering for Tenants, Domains, Billing
2) Server Actions with Zod parsing and tenant scoping
3) Impersonation flow (start/stop + audit) wired to RBAC
4) Observability pages (logs/metrics placeholders wired to providers)
5) i18n (ar/en) for visible strings in Operator UI
6) Accessibility pass (keyboard nav, focus rings, semantics)
7) Tests: unit (utils/actions), integration (tenant scoping), E2E critical flows

See `ISSUE.md` for the detailed backlog with acceptance criteria.

## Local Development

Commands (pnpm preferred):

```bash
pnpm install
pnpm dev
# build/check
pnpm build
# tests (Vitest only)
pnpm test
```

## Conventions and Guardrails

- UI: Use shadcn/ui primitives in `src/components/ui/*`; compose atoms in `src/components/atom/*` when needed.
- Mirror pattern: Each route in `src/app/(platform)/operator/<segment>` mirrors components under `src/components/platform/operator/<segment>` and exposes `<FolderName>Content`.
- Validation: Co-locate `validation.ts` with `form.tsx`, infer types with Zod, parse again on server.
- Server Actions: Start with "use server", return typed results, `revalidatePath` or `redirect` on success.
- Multi-tenant safety: Include `schoolId` on every read/write; uniqueness scoped by `schoolId`.
- Observability: Log `requestId` and `schoolId` for traceability.

## Testing

- Unit & integration: Vitest with React Testing Library (see `vitest.config.ts`).
  - Tests live under `src/components/platform/operator/**/__tests__/*`.
  - E2E removed; focus on smoke via integration tests.

## Observability Provider

- Default DB provider aggregates `AuditLog` with user email and school name.
- External HTTP provider supported via env:
  - `NEXT_PUBLIC_LOG_PROVIDER=http`
  - `LOG_API_URL=https://logs.example.com`
  - `LOG_API_TOKEN=...` (optional Bearer token)

## Overview Metrics

- Deltas endpoint: `GET /operator/overview/metrics?period=7d|30d|90d`
- UI period switcher updates URL and fetches live deltas in `MetricsCards`.

## Where to add code next

- `src/components/platform/operator/tenants/*` + `src/app/(platform)/operator/tenants/*`
- `src/components/platform/operator/domains/*` + `src/app/(platform)/operator/domains/*`
- `src/components/platform/operator/billing/*` + `src/app/(platform)/operator/billing/*`
- `src/components/platform/operator/observability/*` + `src/app/(platform)/operator/observability/*`
- `src/app/(platform)/operator/actions/*` for server actions

Refer to `ISSUE.md` for granular tasks and acceptance criteria.


