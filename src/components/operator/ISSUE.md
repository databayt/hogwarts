## Operator Block — Backlog and Acceptance Criteria

This is the canonical backlog to bring the Operator block to "ready" for MVP per docs. Use small, typed, composable edits following shadcn/ui and mirror patterns. All queries/mutations must include `schoolId`.

Status legend: [x] done, [~] in progress, [ ] todo

## Critical Architecture Issues (Priority 1) 🔴

### Mirror Pattern Violation
- [ ] **CRITICAL**: Move `src/components/operator/` to `src/components/platform/operator/`
- [ ] Update all imports in app directory from `/operator/` to `/platform/operator/`
- [ ] Update documentation to reflect correct paths
- [ ] Ensure route mirrors component path correctly

### Typography System Violations (30+ instances)
- [ ] Replace all hardcoded text-* classes with semantic HTML
  - [ ] `tenants/content.tsx`: Lines 121, 136, 140, 145, 149, 156, 160, 177, 192-193
  - [ ] `billing/content.tsx`: Lines 42-43, 56-57, 71-72
  - [ ] `app-sidebar.tsx`: Line 34
  - [ ] `product/detail.tsx`: Lines 15-16
  - [ ] All other instances across codebase
- [ ] Use typography system from `src/styles/typography.css`
- [ ] Add typography validation to CI pipeline
- [ ] Run typography-refactor agent on all affected files

### TypeScript Type Safety Violations
- [ ] Fix all `any` type usage (30+ instances found)
- [ ] Replace `(db as any)` with properly typed Prisma client
- [ ] Add proper type definitions for all interfaces
- [ ] Enable ESLint rule: `"@typescript-eslint/no-explicit-any": "error"`

## Standardization Issues (Priority 2) ⚠️

### Missing Required Files Per Feature
For each feature (tenants, billing, domains, observability, kanban, products):
- [ ] Create `type.ts` - Shared TypeScript types
- [ ] Create `form.tsx` - Form components for data entry
- [ ] Create `util.ts` - Feature-specific utilities
- [ ] Create `constant.ts` - Arrays, enums, static data
- [ ] Create `card.tsx` - Card components
- [ ] Create `all.tsx` - All/list views
- [ ] Create `featured.tsx` - Featured list components

### Component Hierarchy Issues
- [ ] Create atomic components in `src/components/atom/`
- [ ] Refactor direct UI usage to use intermediate abstractions
- [ ] Implement proper progression: UI → Atoms → Templates → Features
- [ ] Create reusable empty state component
- [ ] Standardize loading patterns across features

## Performance Issues (Priority 3) 🚀

### Client-Side Data Fetching
- [ ] Convert `tenants/content.tsx` to use server-side data fetching
- [ ] Remove `useEffect` for data loading in favor of server components
- [ ] Add proper loading.tsx files for each route
- [ ] Implement suspense boundaries for async operations

### Missing Optimizations
- [ ] Add React.memo for expensive components
- [ ] Implement lazy loading for heavy features
- [ ] Add code splitting for large modules
- [ ] Optimize bundle size with dynamic imports

## Testing Gaps (Priority 4) 🧪

### Missing Test Coverage
- [ ] Add `content.test.tsx` for all content components
- [ ] Create UI interaction tests with React Testing Library
- [ ] Add typography validation tests
- [ ] Implement accessibility tests with @testing-library
- [ ] Add performance tests for data-heavy components
- [ ] Create integration tests for multi-tenant safety

## React Best Practices (Priority 5) ⚛️

### Component Issues
- [ ] Split large components (300+ lines) into smaller units
- [ ] Fix hydration mismatch risks from client-side checks
- [ ] Implement proper error boundaries
- [ ] Add comprehensive loading states
- [ ] Fix missing key props in list iterations

### State Management
- [ ] Remove unnecessary client-side state
- [ ] Use server actions for all mutations
- [ ] Implement optimistic UI updates where appropriate
- [ ] Add proper error handling for async operations

## UI/UX Issues (Priority 6) 🎨

### Accessibility
- [ ] Add ARIA labels on all interactive elements
- [ ] Implement proper focus management for modals/drawers
- [ ] Ensure keyboard navigation for all features
- [ ] Add sr-only labels for icon-only buttons
- [ ] Test with screen readers

### Dark Mode & Theming
- [ ] Ensure all components use theme variables
- [ ] Fix any hardcoded colors
- [ ] Test dark mode across all features
- [ ] Implement proper theme switching

### RTL Support
- [ ] Use CSS logical properties instead of directional
- [ ] Remove hardcoded dir attributes
- [ ] Test all components in Arabic locale
- [ ] Fix any RTL layout issues

---

## Original Backlog (Continue Implementation)

### 1) Tenants — List, Filters, Detail

- [~] Implement tenants data table with server-driven pagination, sorting, filtering
  - [x] Columns: name, domain, planType, isActive
  - [x] URL state via `nuqs` (page, perPage, sort, column filters)
  - [x] Server maps filters to Prisma `where`; sorting to `orderBy`
  - [x] Add `createdAt`, `trialEndsAt` to columns and sort options (createdAt sortable; trialEndsAt display)
  - [x] Ensure `pageCount` from server drives pagination
  - [x] Add search box that targets name/domain (hooked into global `search` param)
  - Acceptance: p95 < 2s; URL state persists; `schoolId` scoping enforced in all queries
- [~] Tenant detail drawer/page
  - Overview: plan, usage, domain(s), owner(s)
  - [x] Actions: start/stop impersonation, toggle active (suspend/activate), change plan, end trial
  - [x] Overview with owners and usage metrics (students, teachers, classes)
  - [x] Billing snapshot (plan, outstanding, trial, next invoice)
  - [x] Recent invoices list (last 10)
  - Acceptance: actions are server-validated (Zod), audit entries created

### 2) Domains — Subdomains and Custom Domains

- [~] Domains list table
  - [x] Server fetch from `DomainRequest` with tenant name
  - [x] Actions: approve, reject, verify (server actions wired, audit logged)
  - [x] Add pagination and filters; show createdAt and status badges
  - Acceptance: server is source of truth; verification status reflects backend
- [x] Custom domain request flow
  - [x] Form: hostname, tenant selection, notes
  - [x] Server Action: persist request with `schoolId` and audit
  - Acceptance: success path revalidates domains list; validation via Zod

### 3) Billing — Plans, Invoices, Manual Receipts

- [ ] Billing overview per tenant
  - Shows plan, trial countdown, next invoice date, outstanding balance
  - [x] Snapshot in tenant detail (read-only)
  - Acceptance: matches data model and handles trial/grace states
- [~] Invoices table
  - [x] Table uses reusable Data Table block with URL state and pageCount
  - [x] Columns: number, school, period, amount, status, createdAt (badges for status)
  - [x] Filters: number, school, status via toolbar; CSV export
  - [x] Actions: mark paid, void (with toasts)
  - Acceptance: server paginated; zero-state friendly; toasts on actions
- [~] Manual receipt upload workflow
  - [x] Uses `file-uploader.tsx`; associates receipt to invoice/tenant
  - [x] Review action: approve/reject with notes; audit logged
  - [x] Toaster on success/error for review actions
  - Acceptance: happy/sad paths handled; file types validated client+server

### 4) Observability — Logs and Metrics

- [~] Logs view
  - [x] Audit log table wired with reusable Data Table, filters, empty state, skeleton
  - [x] Server pagination and basic action filter
  - [x] Date range and IP filters; shape includes IP
  - [x] Provider abstraction; added Level and Request ID filters (DB fallback has nulls)
  - [x] External HTTP provider integration via `LOG_API_URL` + `LOG_API_TOKEN`
  - Acceptance: p95 < 2s with server pagination
- [ ] Metrics snapshot
  - Cards: active schools, attendance submissions/day, announcements/day
  - Acceptance: zero-state friendly; loading skeletons applied

### 5) Overview — Metrics Cards

- [~] Founder dashboard metrics
  - [x] Total Schools, Active Schools, Total Users, Total Students cards
  - [x] Add route-level loading skeleton and error boundary
  - [x] Wire real trend deltas (+/-) for 7d via `/operator/overview/metrics`
  - [x] Add period switcher (7d/30d/90d) UI
  - [x] Wire switcher to metrics endpoint and card deltas
  - Acceptance: lightweight queries, resilient UI

### 6) Impersonation — Safe Operator Tools

- [x] Start/stop impersonation actions
  - Banner (`impersonation-banner.tsx`) reflects state; stop is one click
  - Acceptance: RBAC enforced; audit log created with actor and target `schoolId`

<!-- ### 6) i18n (ar/en) and RTL

- [ ] Extract visible UI strings to i18n files for Operator pages
  - Acceptance: Arabic and English switch; RTL respected in layout and tables -->

### 7) Accessibility & UX Polish

- [ ] Keyboard nav, focus states, aria labels for interactive elements
  - [x] Loading skeletons for data tables (tenants, domains, invoices)
  - [x] Explicit empty states for all tables (tenants, domains, invoices, receipts)
  - Acceptance: meets WCAG AA basics; tab order logical

### 8) Server Actions & Validation

- [x] Add `actions.ts` per feature folder with Zod parsing and typed returns
  - [x] Tenants: `tenants/actions.ts`
  - [x] Domains: `domains/actions.ts`
  - [x] Billing: `billing/actions.ts`
  - Acceptance: uses "use server", revalidates relevant paths, includes `schoolId`

### 9) Testing

- [x] Unit tests for utilities and server actions
  - Added tests for tenants queries, domains/billing/tenants actions, logs provider mapping
- [x] Integration tests for Prisma queries with tenant scoping (mocked Prisma layer)
- [-] E2E smoke (Playwright) — removed in favor of integration smoke via Vitest
  - Acceptance: green CI; no cross-tenant leakage in tests

### 10) Documentation

- [x] Keep `README.md` in sync with progress and links to key files
  - Added Testing and E2E instructions; Observability provider env; Overview metrics
  - Acceptance: checklist updated as tasks land

---

Dependencies and references:
- Requirements: `src/app/docs/requeriments/page.mdx`
- Roadmap: `src/app/docs/roadmap/page.mdx`
- Arrangements: `src/app/docs/arrangements/page.mdx`
- UI patterns: shadcn/ui; place primitives in `src/components/ui/*`
- Mirror pattern: route `src/app/(platform)/operator/<segment>` mirrors `src/components/platform/operator/<segment>` and exports `<FolderName>Content`


