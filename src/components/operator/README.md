## Operator Block — Overview

The Operator block provides platform-level SaaS management tools to manage schools (tenants), domains, billing, observability, and high-level product configuration across the multi-tenant system.

**Architecture:** Operator (SaaS management) is separate from Platform (individual school management)
- **Operator**: `src/components/operator/*` → `src/app/[lang]/(operator)/*` - Manages multiple schools
- **Platform**: `src/components/platform/*` → `src/app/[lang]/s/[subdomain]/(platform)/*` - School-specific operations

**Tech Stack:**
- Next.js 15 App Router with React 19, TypeScript (strict mode)
- Styling: Tailwind CSS 4 + shadcn/ui (New York style)
- Database: PostgreSQL (Neon) with Prisma ORM
- Auth: NextAuth v5 with RBAC (requireOperator middleware)
- Forms & Validation: react-hook-form + Zod
- Tables: @tanstack/react-table with server-side pagination

**Security & Multi-Tenant:**
- All queries scoped by tenant (no cross-tenant data leakage)
- Operator role required for all routes
- Audit logging for all operator actions
- Impersonation with full audit trail

### Directory Structure

- **Components**: `src/components/operator/*`
- **Routes**: `src/app/[lang]/(operator)/*`
- **API Routes**: `src/app/[lang]/(operator)/*/route.ts`

### Reusable Blocks Architecture

The operator dashboard leverages battle-tested components from the platform (school management) system:

#### 1. **Data Tables** (`src/components/table/`)
Generic, reusable table system with:
- Server-side pagination, sorting, filtering
- Column customization and pinning
- Faceted filters and search
- Row selection and bulk actions
- Loading skeletons and empty states

**Used in:** Tenants, Invoices, Domains, Audit Logs, Receipts

#### 2. **CSV Export** (`src/components/platform/*/export-button.tsx`)
Standardized export pattern:
- Server action generates CSV with applied filters
- Browser-side download with auto-generated filename
- Loading states and error handling
- Respects current table filters

**Pattern:** ExportButton → Server Action → CSV Generation → Download

#### 3. **CSV Import** (`src/components/platform/import/csv-import.tsx`)
Full bulk import workflow:
- Drag-and-drop file upload
- Template download for correct format
- Row-by-row validation with detailed errors
- Success/warning/error reporting
- Progress indicators

**Ready to adapt for:** Bulk tenant operations, bulk plan changes

#### 4. **File Upload** (`src/components/operator/file-uploader.tsx`)
Production-ready file uploader:
- Drag & drop with react-dropzone
- Multiple file support
- File preview (images)
- Progress tracking
- Size and type validation

**Used in:** Receipt uploads, document attachments

#### 5. **Invoice System** (`src/components/invoice/`)
Complete billing infrastructure:
- Invoice table with filtering
- Create/edit forms
- Invoice dashboard with charts
- Stripe integration ready
- Payment tracking

**Reusable for:** Operator billing features, revenue analytics

### Current Implementation

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

### Production-Ready Status ✅

**✅ Core SaaS Features Implemented:**
- [x] **Tenants Management** - Full CRUD with comprehensive stats (9 cards), plan distribution, growth tracking
- [x] **Billing & Invoices** - Revenue tracking, payment rates, invoice management with stats (4 cards), CSV export
- [x] **Receipts Management** - Full review workflow with approve/reject, stats dashboard (4 cards), server actions
- [x] **Analytics Dashboard** - MRR calculation with 6-month trend, plan breakdown, churn rate, at-risk detection
- [x] **Financial Metrics** - MRR, ARR, churn rate cards on main dashboard with growth indicators
- [x] **Domains Management** - Approval workflow, DNS configuration tracking, status badges (5 stats cards)
- [x] **Observability** - Audit logs with provider abstraction (DB + HTTP), filtering, pagination
- [x] **Dashboard** - Real-time metrics with delta tracking (7d/30d/90d periods), MRR/ARR/Churn cards
- [x] **Impersonation** - Full impersonation workflow with audit trail and banner
- [x] **RBAC** - Operator-only access with requireOperator() middleware
- [x] **Server Actions** - All mutations use Zod validation and proper error handling
- [x] **API Routes** - 4 tenant detail endpoints (summary, billing, invoices, info)
- [x] **CSV Exports** - Invoice exports with filter support, auto-generated filenames

**✅ Recently Completed:**
- [x] **Receipts Management** - Full table with approve/reject workflow, stats dashboard, route at `/operator/billing/receipts`
- [x] **MRR Analytics** - Complete MRR calculation, 6-month trend chart, plan breakdown, route at `/operator/analytics`
- [x] **Churn Analysis** - Churn rate calculation, at-risk school detection, dashboard cards with trend indicators
- [x] **CSV Exports** - Invoice export with filter support, auto-generated filenames, 10k row limit

**⚠️ Ready for Enhancement:**
- [ ] **School Health Scoring** - Usage metrics available, needs health score algorithm
- [ ] **Bulk Operations** - CSV import pattern ready, needs operator-specific workflows
- [ ] **Notifications** - Toast system in place, needs real-time alert system
- [ ] **Receipt File Storage** - Upload UI present, needs S3/storage integration
- [ ] **Revenue Forecasting** - MRR calculated, needs projection algorithms

### Feature Implementation Matrix

| Feature | Content | Table | Actions | Columns | Stats | API Routes | Status |
|---------|---------|-------|---------|---------|-------|------------|--------|
| **Tenants** | ✅ SSR | ✅ Paginated | ✅ Zod | ✅ Typed | ✅ 9 cards | ✅ 4 endpoints | 🟢 Production |
| **Billing** | ✅ SSR | ✅ Invoices | ✅ Actions | ✅ Typed | ✅ 4 cards | ✅ CSV Export | 🟢 Production |
| **Receipts** | ✅ SSR | ✅ Paginated | ✅ Review | ✅ Typed | ✅ 4 cards | ✅ Route | 🟢 Production |
| **Analytics** | ✅ SSR | ✅ Tables | ✅ Metrics | ✅ Typed | ✅ 4 cards | ✅ MRR/Churn | 🟢 Production |
| **Domains** | ✅ SSR | ✅ Paginated | ✅ Actions | ✅ Typed | ✅ 5 cards | N/A | 🟢 Production |
| **Observability** | ✅ SSR | ✅ Logs | N/A | ✅ Typed | N/A | N/A | 🟢 Production |
| **Dashboard** | ✅ SSR | N/A | ✅ Metrics | N/A | ✅ 7 cards | ✅ MRR/ARR/Churn | 🟢 Production |
| **Profile** | ⚠️ Basic | N/A | ⚠️ Partial | N/A | N/A | N/A | 🔴 Demo |
| **Kanban** | ⚠️ Demo | N/A | ⚠️ Client | N/A | N/A | N/A | 🔴 Demo |

**Legend:**
- 🟢 Production Ready
- 🟡 Functional but needs enhancement
- 🔴 Demo/incomplete

**Architecture Notes:**
- All data tables use server-side rendering (SSR) with pagination
- Server actions follow "use server" directive with Zod validation
- All queries respect tenant boundaries (no schoolId in operator context)
- Audit logging implemented for all operator actions

## Production Roadmap (see ISSUE.md for details)

The operator dashboard is production-ready for core tenant management. Next phases focus on advanced SaaS metrics and automation:

### ✅ Phase 1: Revenue & Financial Analytics 💰 [COMPLETED]
- [x] MRR (Monthly Recurring Revenue) dashboard with 6-month trend chart
- [x] MRR breakdown by plan tier (bar chart)
- [x] Churn rate calculation and dashboard card
- [x] At-risk schools detection (payment failures, low usage, trial expiry)
- [x] Revenue trends tracking
- [x] Growth indicators (MRR %, ARR projection)
- **Implementation:** `/operator/analytics` route, analytics/actions.ts with 5 server actions

### ✅ Phase 2: Complete Billing Features 📄 [MOSTLY COMPLETED]
- [x] Receipts management with full table and review workflow
- [x] Receipt approve/reject actions with audit logging
- [x] CSV export for invoices with filter support
- [x] Stats dashboard for receipts (4 cards)
- [~] File upload integration (UI present, storage pending)
- [ ] Payment automation via Stripe webhooks
- **Implementation:** `/operator/billing/receipts` route, receipts/actions.ts

### Phase 3: School Health & Engagement 📊
- School health score calculation
- Usage analytics per school
- Engagement trends over time
- **Reuses:** DataTable + StatsCards pattern

### Phase 4: Advanced Tenant Management 🔍
- Growth tracking per school
- Onboarding progress tracker
- Bulk operations (CSV import for plan changes)
- **Reuses:** CSV import workflow from platform

### Phase 5: Notifications & Alerts 🔔
- Real-time alerts (trial expiring, payment failures)
- Notification center with read/unread
- **Reuses:** Toast + Badge components

### Phase 6: Reporting & Exports 📈
- CSV export for all tables
- Custom date range reports
- Email delivery of reports
- **Reuses:** ExportButton pattern across all features

See `ISSUE.md` for detailed tasks, acceptance criteria, and priorities.

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


