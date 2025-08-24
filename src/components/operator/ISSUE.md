## Operator Block — Backlog and Acceptance Criteria

This is the canonical backlog to bring the Operator block to “ready” for MVP per docs. Use small, typed, composable edits following shadcn/ui and mirror patterns. All queries/mutations must include `schoolId`.

Status legend: [x] done, [~] in progress, [ ] todo

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


