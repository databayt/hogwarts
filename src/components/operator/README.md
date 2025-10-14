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
- [x] **Billing & Invoices** - Revenue tracking, payment rates, invoice management with stats (4 cards)
- [x] **Domains Management** - Approval workflow, DNS configuration tracking, status badges (5 stats cards)
- [x] **Observability** - Audit logs with provider abstraction (DB + HTTP), filtering, pagination
- [x] **Dashboard** - Real-time metrics with delta tracking (7d/30d/90d periods)
- [x] **Impersonation** - Full impersonation workflow with audit trail and banner
- [x] **RBAC** - Operator-only access with requireOperator() middleware
- [x] **Server Actions** - All mutations use Zod validation and proper error handling
- [x] **API Routes** - 4 tenant detail endpoints (summary, billing, invoices, info)

**⚠️ Ready for Enhancement:**
- [ ] **Receipts Management** - Table structure exists, needs file upload integration
- [ ] **MRR Analytics** - Revenue tracking implemented, needs MRR calculation and charting
- [ ] **School Health Scoring** - Usage metrics available, needs health score algorithm
- [ ] **CSV Exports** - Pattern exists in platform, needs integration to operator tables
- [ ] **Bulk Operations** - CSV import pattern ready, needs operator-specific workflows
- [ ] **Notifications** - Toast system in place, needs real-time alert system

### Feature Implementation Matrix

| Feature | Content | Table | Actions | Columns | Stats | API Routes | Status |
|---------|---------|-------|---------|---------|-------|------------|--------|
| **Tenants** | ✅ SSR | ✅ Paginated | ✅ Zod | ✅ Typed | ✅ 9 cards | ✅ 4 endpoints | 🟢 Production |
| **Billing** | ✅ SSR | ✅ Invoices | ✅ Actions | ✅ Typed | ✅ 4 cards | ⚠️ Partial | 🟡 Needs Receipts |
| **Domains** | ✅ SSR | ✅ Paginated | ✅ Actions | ✅ Typed | ✅ 5 cards | N/A | 🟢 Production |
| **Observability** | ✅ SSR | ✅ Logs | N/A | ✅ Typed | N/A | N/A | 🟢 Production |
| **Dashboard** | ✅ SSR | N/A | ✅ Metrics | N/A | ✅ 4 cards | ✅ Deltas | 🟡 Needs Charts |
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

### Phase 1: Revenue & Financial Analytics 💰
- MRR (Monthly Recurring Revenue) dashboard
- Revenue trends (6-month chart)
- Churn rate analysis and at-risk schools detection
- **Reuses:** Invoice components + Recharts from dashboard

### Phase 2: Complete Billing Features 📄
- Receipts management with file upload
- CSV exports for all billing tables
- Payment automation via Stripe webhooks
- **Reuses:** FileUploader + ExportButton pattern

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


