# SaaS Dashboard — Optimization Backlog

> Source: 11-area read-only audit + adversarial verification (2026-06-14). 181 confirmed
> findings (6 P0, 47 P1, 101 P2, 27 P3). Machine-readable copy: `.audit-findings.json`.
> Re-run the fix wave by re-bucketing `.audit-findings.json` by file path and dispatching
> one agent per bucket (the original wave was rate-limited mid-run).

## ✅ Completed — 2026-06-14 optimization pass (tsc clean, solo)

**All 6 P0s:**

- analytics: `planType` case mismatch zeroed all MRR → case-insensitive lookups + trial exclusion.
- billing/receipts: audit log wrote literal `"operator"` → real operator id via `logOperatorAudit` (+IP/UA).
- billing/receipts: `reviewReceipt`/`uploadReceipt` missing `requireNotImpersonating()` → added.
- tenants: detail sheet fetched nonexistent `/operator/...` (always empty) → single `getTenantDetail` action; 4 dead API routes deleted.
- tenants: outstanding balance read nonexistent `Invoice.amount` (always $0) → `amountDue − amountPaid`.
- tenants: analysis plan counts used uppercase planType (always 0) → case-insensitive groupBy.

**P1/P2 also fixed:**

- analytics: `getMRRHistory` 6→1 query, `getRevenueTrends` 6→1 (+end-of-month gap), `calculateMRR` 2→1, projected-12-month formula corrected.
- billing: `getBillingStats` 5→3 (groupBy), `paymentRate` denominator excludes void/draft/uncollectible, CSV formula-injection escaping, receipt `amountPaid` now accumulates (partial payments).
- domains: `getDomainStats` 5→1 (groupBy).
- tenants: analysis 10→4 queries (plan×active groupBy matrix).
- **dashboard (headline):** removed ALL fabricated operator data — `Math.random` charts, static `defaultDataByRole` chart/invoice/resource sections, fictional `RecentSales` personas, hardcoded `SaasUpcoming` counts; wired real data (recent paid invoices, live trial/domain/receipt counts); deleted 8 dead files (overview + bar/area/pie graphs + 4 skeletons); removed 404'ing metrics delta fetch.
- nav: demo-only Kanban/Products removed from operator sidebar.
- shell: deleted dead `operator-auth-guard` (PII console.log) + its skeleton; `theme-selector` `require()`→static import; impersonation banner now actually renders (non-httpOnly hint cookies set on start / cleared on stop).
- catalog: analytics "Assignments" card now counts catalog `Assignment` templates (was school-scoped `SchoolAssignment`).
- sales: `updateOperatorLead` write scoped by schoolId via `updateMany` (TOCTOU).
- observability: deleted the dead component layer (`all.tsx`, `card.tsx`, `featured.tsx`, `hooks/use-observability.ts`) — tsc-confirmed unimported. `provider.ts`/`types.ts` kept (test-covered).

### Pre-existing test failures (NOT caused by this pass — backlog)

- `sales/actions.test.ts` (6): auth tests expect `"Unauthorized: Platform admin access required"` but actions throw `requireOperator()` → `"Forbidden"`. Reconcile the contract.
- `observability/provider.test.ts` + `provider-tenant.test.ts` (2): test db mock missing `db.user.findMany`.
- `tenants/queries.test.ts` (2) + `tenants/columns.test.tsx` (1): planType/status filter-meta expectations (ties into the open planType-casing + `'active'` vs `'true'` filter-mismatch findings).

## ⏳ Remaining (full audit — completed items above are struck from active work)

> Highest-value remaining: catalog TOCTOU + count-transactions, observability pagination/dead-layer,
> sales TOCTOU + CSV-import batching, domains TOCTOU/FSM, tenants N+1 translation + caching.
> Then the cross-cutting **i18n sweep (~48 findings)** — needs coordinated dictionary keys (en+ar),
> best done as a single-owner pass to avoid JSON conflicts. Schema indexes (School.isActive/planType,
> Lead.nextFollowUpAt) are deploy-time `db push` items, not code.

### analytics

- [P0/correctness] planType case mismatch: all MRR calculations silently return $0 — `src/components/saas-dashboard/analytics/actions.ts`
- [P1/perf] getMRRHistory fires 6 redundant superset queries — consolidate to 1 + JS bucketing — `src/components/saas-dashboard/analytics/actions.ts`
- [P1/correctness] Projected 12 Months metric overstates future revenue by up to 76% — `src/components/saas-dashboard/analytics/content.tsx`
- [P1/correctness] getMRRHistory uses current isActive state — churned schools disappear from all historical months — `src/components/saas-dashboard/analytics/actions.ts`
- [P1/perf] getMRRHistory fires 6 parallel DB queries (full table scan per month); getRevenueTrends fires 6 more aggregates — `src/components/saas-dashboard/analytics/actions.ts`
- [P2/correctness] getRevenueTrends endDate misses invoices created during final hours of each month — `src/components/saas-dashboard/analytics/actions.ts`
- [P2/deadcode] calculateChurnRate and getAtRiskSchools exported but never rendered in any UI — `src/components/saas-dashboard/analytics/actions.ts`
- [P2/i18n] Month labels hardcoded to 'en-US' locale in server actions — `src/components/saas-dashboard/analytics/actions.ts`
- [P2/i18n] MRRChart client component — 3 user-visible strings hardcoded in English — `src/components/saas-dashboard/analytics/mrr-chart.tsx`
- [P2/i18n] MRRByPlan client component — all user-visible strings hardcoded in English — `src/components/saas-dashboard/analytics/mrr-by-plan.tsx`
- [P2/i18n] Invoice count pluralization uses English-only plural rules — `src/components/saas-dashboard/analytics/content.tsx`
- [P2/correctness] churnRate denominator includes already-inactive schools, understating churn rate — `src/components/saas-dashboard/analytics/actions.ts`
- [P2/perf] No unstable_cache on any analytics function — full DB round-trip on every navigation — `src/components/saas-dashboard/analytics/actions.ts`
- [P2/perf] getRevenueTrends fires 6 aggregate queries — consolidate to groupBy or raw SQL — `src/components/saas-dashboard/analytics/actions.ts`
- [P2/correctness] Churn rate metric uses updatedAt as proxy for deactivation, producing false positives — `src/components/saas-dashboard/analytics/actions.ts`

### billing

- [P0/security] Hardcoded 'operator' string in audit log breaks accountability — `src/components/saas-dashboard/billing/receipts/actions.ts`
- [P0/security] reviewReceipt and uploadReceipt skip requireNotImpersonating() — `src/components/saas-dashboard/billing/receipts/actions.ts`
- [P1/correctness] revalidatePath uses bare '/billing' — never invalidates localized cache — `src/components/saas-dashboard/billing/actions.ts, src/components/saas-dashboard/billing/receipts/actions.ts`
- [P1/rendering] Upload Receipt button is a dead UI element — ReceiptUpload never rendered — `src/components/saas-dashboard/billing/receipts/content.tsx`
- [P1/perf] getBillingStats fires 5 separate DB round-trips — consolidate with groupBy — `src/components/saas-dashboard/billing/content.tsx`
- [P1/correctness] paymentRate denominator includes void/draft/uncollectible invoices — misleading metric — `src/components/saas-dashboard/billing/content.tsx`
- [P1/correctness] reviewReceipt overwrites amountPaid instead of accumulating — incorrect for partial payments — `src/components/saas-dashboard/billing/receipts/actions.ts`
- [P1/i18n] receipts/columns.tsx accepts no dictionary — all strings hardcoded English — `src/components/saas-dashboard/billing/receipts/columns.tsx`
- [P1/i18n] receipts/content.tsx has ~12 hardcoded English UI strings — `src/components/saas-dashboard/billing/receipts/content.tsx`
- [P1/security] CSV export vulnerable to formula injection (school name, domain, invoice fields) — `src/components/saas-dashboard/billing/actions.ts`
- [P1/correctness] Audit log writes literal string 'operator' as userId instead of actual user ID — `src/components/saas-dashboard/billing/receipts/actions.ts`
- [P2/perf] getReceiptStats fires 4 separate count queries — consolidate with groupBy — `src/components/saas-dashboard/billing/receipts/content.tsx`
- [P2/correctness] CSV export hardcodes Arabic locale for all date cells — `src/components/saas-dashboard/billing/actions.ts`
- [P2/security] CSV injection via school.name / school.domain — formula prefix not sanitized — `src/components/saas-dashboard/billing/actions.ts`
- [P2/i18n] receipts/upload.tsx toast messages and labels hardcoded English — `src/components/saas-dashboard/billing/receipts/upload.tsx`
- [x] ~~[P2/correctness] invoiceUpdateStatus applies no state-machine guard — can void a paid invoice~~ — FIXED 2026-06-21 (`3be3506ed`): server fetches current status + rejects illegal transitions (canPayInvoice/canVoidInvoice); columns gate the buttons per row; test added — `src/components/saas-dashboard/billing/actions.ts`
- [P2/deadcode] Duplicate where-clause logic across getInvoicesData, getInvoices, and getInvoicesCSV — `src/components/saas-dashboard/billing/content.tsx, src/components/saas-dashboard/billing/actions.ts`
- [P2/deadcode] useBillingData hook calls /api/billing which does not exist — `src/components/saas-dashboard/billing/hooks/use-billing.ts`
- [P2/deadcode] card.tsx / featured.tsx / all.tsx components are not rendered anywhere in live routes — `src/components/saas-dashboard/billing/card.tsx, src/components/saas-dashboard/billing/featured.tsx, src/components/saas-dashboard/billing/all.tsx`
- [P2/correctness] PLAN_PRICING is a hardcoded table instead of live Stripe price lookup — `src/components/saas-dashboard/billing/config.ts`
- [P2/i18n] billing/receipts/upload.tsx: ErrorToast and SuccessToast messages are hardcoded English — `src/components/saas-dashboard/billing/receipts/upload.tsx`
- [P3/deadcode] FileUploader imported but unused in receipts/content.tsx — `src/components/saas-dashboard/billing/receipts/content.tsx`
- [P3/dx] Two parallel CSV export paths cause UX confusion and code duplication — `src/components/saas-dashboard/billing/table.tsx, src/components/saas-dashboard/billing/export-button.tsx`

### catalog

- [P1/correctness] Analytics 'Assignments' card counts SchoolAssignment (school scope) instead of catalog Assignment templates — `src/components/saas-dashboard/catalog/analytics-content.tsx`
- [P1/correctness] TOCTOU in rejectProposal — status guard is outside transaction, enabling double-reject — `src/components/saas-dashboard/catalog/proposal-actions.ts`
- [P1/correctness] TOCTOU in approveExam/rejectExam/approveExamTemplate/rejectExamTemplate — no status guard and existence check is outside transaction — `src/components/saas-dashboard/catalog/exam-approval-actions.ts`
- [P1/correctness] Denormalized chapter/lesson count updates run outside a transaction — race condition corrupts counts — `src/components/saas-dashboard/catalog/actions.ts`
- [P1/correctness] S3 thumbnail upload succeeds before DB update — failure orphans the S3 object — `src/components/saas-dashboard/catalog/image-actions.ts`
- [P2/correctness] approveContent has no idempotency guard — double-clicking Approve silently overwrites approvedAt — `src/components/saas-dashboard/catalog/approval-actions.ts`
- [P2/correctness] approvedAt is set on REJECTION — semantic field naming bug leads to wrong audit trail — `src/components/saas-dashboard/catalog/approval-actions.ts`
- [P2/perf] Unbounded slug-dedup loop inside $transaction — N×findUnique round-trips, no iteration cap — `src/components/saas-dashboard/catalog/proposal-actions.ts`
- [P2/rendering] ProposalReviewContent is a pure CSR component — loading flash and waterfall on every visit — `src/components/saas-dashboard/catalog/proposal-content.tsx`
- [P2/i18n] Hardcoded English strings in approval-content.tsx — dictionary prop received but never used for UI chrome — `src/components/saas-dashboard/catalog/approval-content.tsx`
- [P2/i18n] Hardcoded English strings throughout question-content.tsx and assignment-content.tsx card headers/page titles — `src/components/saas-dashboard/catalog/question-content.tsx`
- [P2/i18n] Hardcoded English toast messages and button labels in create-question-dialog and create-assignment-dialog — `src/components/saas-dashboard/catalog/create-question-dialog.tsx`
- [P2/i18n] Hardcoded English column headers in approval-table, question-columns, assignment-columns — `src/components/saas-dashboard/catalog/approval-table.tsx`
- [P2/i18n] Hardcoded English in video-approve-dialog — labels, select options, toast, title, description — `src/components/saas-dashboard/catalog/video-approve-dialog.tsx`
- [P2/perf] book-content fires two redundant DB count queries whose values are computable from fetched rows — `src/components/saas-dashboard/catalog/book-content.tsx`
- [P2/perf] VideoManager always loads videos client-side via useEffect — loading flash and redundant refetch after add — `src/components/saas-dashboard/catalog/video-manager.tsx`
- [P2/i18n] Pervasive hardcoded English strings in analytics-content.tsx — violates i18n contract — `src/components/saas-dashboard/catalog/analytics-content.tsx`
- [P2/i18n] Hardcoded English toast messages and button labels throughout detail.tsx — `src/components/saas-dashboard/catalog/detail.tsx`
- [P2/i18n] Hardcoded English strings in image-upload.tsx toasts and dropzone labels — `src/components/saas-dashboard/catalog/image-upload.tsx`
- [P2/perf] create-subject-dialog: serial N+M server round trips for chapter+lesson batch creation — `src/components/saas-dashboard/catalog/create-subject-dialog.tsx`
- [P2/rendering] Duplicate CatalogImageUpload rendered twice for the same subject entity — `src/components/saas-dashboard/catalog/detail.tsx`
- [P2/i18n] Zod validation schemas contain hardcoded English error messages surfaced to users — `src/components/saas-dashboard/catalog/validation.ts`
- [P2/correctness] Math.random() used for slug generation on non-ASCII proposal names — `src/components/saas-dashboard/catalog/proposal-actions.ts`
- [P2/i18n] Hardcoded English strings in create-subject-dialog and create-material-dialog — `src/components/saas-dashboard/catalog/create-subject-dialog.tsx`
- [P3/perf] Redundant findUnique before update/delete in updateQuestion, deleteQuestion, updateAssignment, deleteAssignment — `src/components/saas-dashboard/catalog/question-actions.ts`
- [P3/security] approvalStatus included in Zod update schema for Question — setting it to undefined relies on Prisma undefined-skip behavior — `src/components/saas-dashboard/catalog/question-validation.ts`
- [P3/dx] Approval-table 'Contributed By' column renders raw userId string — no name resolution — `src/components/saas-dashboard/catalog/approval-table.tsx`
- [P3/perf] deleteBook / updateBook fire a redundant findUnique before delete/update — `src/components/saas-dashboard/catalog/book-actions.ts`
- [P3/deadcode] CatalogContent and AnalyticsContent declare a dictionary prop but never use it — `src/components/saas-dashboard/catalog/content.tsx`

### dashboard

- [P1/fabricated] bar-graph.tsx generates Math.random() chart data on every render — `src/components/saas-dashboard/dashboard/bar-graph.tsx`
- [P1/fabricated] RecentSales shows five fictional personas as live operator sales — `src/components/saas-dashboard/dashboard/recent-sales.tsx`
- [P1/fabricated] AreaGraph renders hardcoded static 2024 visitor data with fabricated trend text — `src/components/saas-dashboard/dashboard/area-graph.tsx`
- [P1/fabricated] PieGraph shows hardcoded browser-share data instead of plan distribution — `src/components/saas-dashboard/dashboard/pie-graph.tsx`
- [P1/fabricated] SaasUpcoming displays hardcoded default counts — real platform data never fetched — `src/components/saas-dashboard/dashboard/saas-upcoming.tsx`
- [P1/fabricated] InvoiceHistorySection role=DEVELOPER returns empty then shows hardcoded 'License Revenue' defaults — `src/components/school-dashboard/dashboard/invoice-history-section.tsx`
- [P1/fabricated] ChartSection role=DEVELOPER renders hardcoded July-December growth series as 'Platform Analytics' — `src/components/school-dashboard/dashboard/chart-section.tsx`
- [P1/correctness] /operator/overview/metrics route does not exist — delta badges always show +0.0% — `src/components/saas-dashboard/dashboard/metrics-cards.tsx`
- [P1/fabricated] Fabricated data: overview.tsx shows hardcoded KPIs and Math.random chart data; BarGraph falls back to Math.random() when no data prop — `src/components/saas-dashboard/dashboard/overview.tsx`
- [P2/deadcode] overview.tsx is dead code — never imported — but contains hardcoded fabricated KPIs — `src/components/saas-dashboard/dashboard/overview.tsx`
- [P2/fabricated] ResourceUsageSection role=DEVELOPER mixes two real rows with two permanently mocked rows — `src/components/school-dashboard/dashboard/resource-usage-section.tsx`
- [P2/i18n] SectionHeading titles 'Quick Look', 'Quick Actions', 'Recent Sales' are hardcoded English — `src/components/saas-dashboard/dashboard/saas-client.tsx`
- [P2/i18n] saas-quick-look.tsx item labels are hardcoded English strings — `src/components/saas-dashboard/dashboard/saas-quick-look.tsx`
- [P2/i18n] saas-upcoming.tsx labels, badge text, and CTA link text are hardcoded English — `src/components/saas-dashboard/dashboard/saas-upcoming.tsx`
- [P2/i18n] saas-quick-actions-config.ts label and description strings are hardcoded English — `src/components/saas-dashboard/dashboard/saas-quick-actions-config.ts`
- [P2/i18n] PeriodSwitcher select item labels and placeholder are hardcoded English — `src/components/saas-dashboard/dashboard/period-switcher.tsx`
- [P2/i18n] MetricsCards uses deprecated KPI_SUPPORTING constant instead of dictionary-driven labels — `src/components/saas-dashboard/dashboard/metrics-cards.tsx`
- [P2/correctness] Weather widget always returns null for DEVELOPER — getTenantContext() has no schoolId — `src/components/saas-dashboard/dashboard/content.tsx`
- [P2/rendering] bar-graph-skeleton.tsx uses Math.random() in JSX causing hydration mismatch — `src/components/saas-dashboard/dashboard/bar-graph-skeleton.tsx`
- [P2/i18n] saas-client.tsx section headings 'Quick Look', 'Quick Actions', 'Recent Sales' hardcoded despite dictionary prop being available — `src/components/saas-dashboard/dashboard/saas-client.tsx`
- [P3/deadcode] Skeleton files (bar-graph-skeleton, pie-graph-skeleton, area-graph-skeleton, recent-sales-skeleton) are never imported — dead code — `src/components/saas-dashboard/dashboard/bar-graph-skeleton.tsx`
- [P3/perf] content.tsx runs 5 parallel DB queries on every request with no caching — `src/components/saas-dashboard/dashboard/content.tsx`
- [P3/deadcode] Dead code: 4 skeleton components are never imported and bar-graph-skeleton uses Math.random causing hydration mismatch — `src/components/saas-dashboard/dashboard/bar-graph-skeleton.tsx`

### demo

- [P1/fabricated] Kanban and Products are live in production nav despite being demo-only scaffolds — `src/components/template/saas-sidebar/config.ts`
- [P1/correctness] ProductForm onSubmit is a no-op — submitting the form silently does nothing — `src/components/saas-dashboard/products/components/product-form.tsx`
- [P1/fabricated] Kanban localStorage store seeds two hardcoded demo tasks visible to the operator on first load — `src/components/saas-dashboard/kanban/utils/store.ts`
- [P1/correctness] product/content.tsx 'Add New' href navigates to /dashboard/product/new — a 404; cell-action.tsx has same bug — `src/components/saas-dashboard/product/content.tsx`
- [P2/deadcode] kanban-view-page.tsx, product-listing.tsx, and product-view-page.tsx are completely orphaned — `src/components/saas-dashboard/kanban/components/kanban-view-page.tsx`
- [P2/i18n] KanbanContent does not pass dictionary to NewTaskDialog or KanbanBoard — all i18n keys fall to hardcoded English — `src/components/saas-dashboard/kanban/content.tsx`
- [P2/i18n] ColumnActions contains multiple hardcoded English UI strings and toasts with no i18n — `src/components/saas-dashboard/kanban/components/column-action.tsx`
- [P2/i18n] product/content.tsx and product/detail.tsx contain hardcoded English headings and placeholder text — `src/components/saas-dashboard/product/content.tsx`
- [P2/i18n] product-form.tsx has hardcoded Zod validation messages and field labels — `src/components/saas-dashboard/products/components/product-form.tsx`
- [P2/correctness] isMounted useEffect has stale dependency — re-fires unnecessarily after mount — `src/components/saas-dashboard/kanban/components/kanban-board.tsx`
- [P3/i18n] task-card.tsx renders hardcoded 'Task' badge with no i18n — `src/components/saas-dashboard/kanban/components/task-card.tsx`
- [P3/deadcode] products/components/product-tables/options.tsx CATEGORY_OPTIONS has zero consumers and uses e-commerce categories irrelevant to school SaaS — `src/components/saas-dashboard/products/components/product-tables/options.tsx`
- [P3/dx] kanban/page.tsx PageNav groups Kanban with /dashboard and /analytics — confusing cross-feature IA — `src/app/[lang]/(saas-dashboard)/kanban/page.tsx`

### domains

- [P1/perf] getDomainStats fires 5 separate COUNT queries — replace with 1 groupBy — `src/components/saas-dashboard/domains/content.tsx`
- [P1/correctness] revalidatePath('/domains') never matches any route — staleness after every mutation — `src/components/saas-dashboard/domains/actions.ts`
- [P1/correctness] domainVerify has a TOCTOU race: read→DNS check→write without status guard on the update — `src/components/saas-dashboard/domains/actions.ts`
- [P1/correctness] domainCreate silently throws on duplicate-pending domain — P2002 unhandled — `src/components/saas-dashboard/domains/actions.ts`
- [P1/correctness] Load-more in DomainsTable drops active filters and search on subsequent pages — `src/components/saas-dashboard/domains/table.tsx`
- [P2/deadcode] card.tsx, featured.tsx, all.tsx, util.ts, hooks/use-domains.ts, types.ts, create-request.tsx, and validation.ts are entirely dead code — `src/components/saas-dashboard/domains/`
- [P2/correctness] DomainRow.notes mapped in content.tsx but absent from both DomainRow type definitions — data is silently discarded — `src/components/saas-dashboard/domains/table.tsx`
- [P2/i18n] columns.tsx: all column headers, status labels, and filter placeholders are hardcoded English — `src/components/saas-dashboard/domains/columns.tsx`
- [P2/security] generateVerificationToken in util.ts is insecure (predictable base64) and completely unused dead code — `src/components/saas-dashboard/domains/util.ts`
- [P2/fabricated] config.ts REQUIRED_DNS_RECORDS has placeholder 'schoolapp.com' values; tenants/card.tsx renders them live — `src/components/saas-dashboard/domains/config.ts`
- [P2/correctness] domainApprove and domainReject bypass the FSM — verified domains can be re-rejected or re-approved — `src/components/saas-dashboard/domains/actions.ts`
- [P2/deadcode] getDomainRequestsData in content.tsx duplicates getDomains action logic verbatim — two query paths to maintain — `src/components/saas-dashboard/domains/content.tsx`
- [P3/correctness] dnsConfigDescription renders the count twice when dictionary key is present — `src/components/saas-dashboard/domains/content.tsx`
- [P3/correctness] Approval Rate stat conflates 'approved' (pending DNS) with 'verified' (fully live) — misleading operator metric — `src/components/saas-dashboard/domains/content.tsx`

### observability

- [P1/deadcode] provider.ts, all.tsx, featured.tsx, card.tsx, use-observability.ts — entire component layer is dead code never imported by any production route — `src/components/saas-dashboard/observability/provider.ts`
- [P1/correctness] Server-computed total row count is never passed to AuditLogTable — server-side pagination is non-functional — `src/components/saas-dashboard/observability/content.tsx`
- [P1/correctness] Level and RequestId columns rendered in UI are always undefined — DB schema has neither field — `src/components/saas-dashboard/observability/content.tsx`
- [P2/i18n] Deprecated auditColumns (no dictionary) used in production — column headers always render hardcoded English — `src/components/saas-dashboard/observability/content.tsx`
- [P2/security] provider.ts missing import 'server-only' — Prisma db import and LOG_API_TOKEN reachable from client bundle if imported by a client component — `src/components/saas-dashboard/observability/provider.ts`
- [P2/security] NEXT_PUBLIC_LOG_PROVIDER env var inlines log backend choice into the client JS bundle — `src/components/saas-dashboard/observability/provider.ts`
- [P2/correctness] Silent error swallowing in content.tsx hides real DB failures — operator sees empty table indistinguishable from no data — `src/components/saas-dashboard/observability/content.tsx`
- [P2/perf] Email search via performer relation JOIN forces full-scan — no action-only index for cross-tenant search — `src/components/saas-dashboard/observability/content.tsx`
- [P2/security] exportLogsToCSV — cell values not escaped for CSV formula injection or embedded double-quotes — `src/components/saas-dashboard/observability/util.ts`
- [P2/rendering] conference/content.tsx: toLocaleString() called server-side reflects server timezone, not user's timezone — `src/components/saas-dashboard/observability/conference/content.tsx`
- [P2/correctness] Duplicate UnifiedLog type definitions with conflicting userId nullability — types.ts non-nullable vs provider.ts nullable — `src/components/saas-dashboard/observability/types.ts`
- [P3/deadcode] COMMON_ACTIONS imported but never used in util.ts — unused import — `src/components/saas-dashboard/observability/util.ts`
- [P3/i18n] exportLogsToCSV: CSV column headers are hardcoded English — `src/components/saas-dashboard/observability/util.ts`

### sales-users

- [P1/security] TOCTOU race: update/delete ops check schoolId on find but not on write — `src/components/saas-dashboard/sales/actions.ts`
- [P1/correctness] Correctness: pilots/proposals monthly metric counts edits, not status transitions — `src/components/saas-dashboard/sales/analytics-content.tsx`
- [P1/perf] Perf: CSV bulk import fires N serial server-action round-trips — `src/components/saas-dashboard/sales/import-content.tsx`
- [P2/correctness] Correctness: orphanedUsers query has redundant NOT clause (silently under-counts) — `src/components/saas-dashboard/users/analysis.tsx`
- [P2/i18n] i18n: entire users block has hardcoded English strings — `src/components/saas-dashboard/users/columns.tsx`
- [P2/i18n] i18n: hardcoded English strings in sales analytics-content (cadence card labels, section headings) — `src/components/saas-dashboard/sales/analytics-content.tsx`
- [P2/security] Security: UsersAnalysis and UsersContent server components have no direct auth check — `src/components/saas-dashboard/users/analysis.tsx`
- [P2/rendering] Rendering: browser prompt() used for suspend/detach reason — blocks thread and silently ignores cancellation — `src/components/saas-dashboard/users/columns.tsx`
- [P2/correctness] Correctness: startOfWeek anchors on Sunday while UI label says Monday resets counters — `src/components/saas-dashboard/sales/analytics-content.tsx`
- [P2/i18n] i18n: import-content.tsx has hardcoded English strings not backed by dictionary — `src/components/saas-dashboard/sales/import-content.tsx`
- [P3/perf] Perf/DX: dueBeforeFor() called twice per render in table filter construction — `src/components/saas-dashboard/sales/table.tsx`
- [P3/perf] Perf: getOperatorLeadById fetches all Lead columns with no select clause — `src/components/saas-dashboard/sales/actions.ts`
- [P3/perf] Perf: getOperatorLeadActivities fires a redundant lead existence check when called in parallel with getOperatorLeadById — `src/components/saas-dashboard/sales/actions.ts`
- [P3/security] Security: error messages return raw Prisma exception strings to client — `src/components/saas-dashboard/sales/actions.ts`

### shell

- [P1/correctness] Impersonation banner always invisible: impersonate_schoolId is httpOnly, hint cookies never set — `src/components/saas-dashboard/impersonation-banner.tsx`
- [P1/security] OperatorAuthGuard is dead code with PII console.log on every render — `src/components/saas-dashboard/auth/operator-auth-guard.tsx`
- [P2/perf] No composite DB indexes for analytics hot queries — full table scans on every load — `prisma/models/school.prisma`
- [P2/i18n] analytics/error.tsx: all user-visible strings hardcoded in English — `src/app/[lang]/(saas-dashboard)/analytics/error.tsx`
- [P2/perf] Subject detail page fires two sequential findUnique queries (slug then ID fallback) — `src/app/[lang]/(saas-dashboard)/(catalog)/catalog/[subjectId]/page.tsx`
- [P2/deadcode] app-sidebar.tsx (saas-dashboard) is entirely dead code — never imported — `src/components/saas-dashboard/app-sidebar.tsx`
- [P2/i18n] error.tsx: card title, description, and button label are hardcoded English; error.message leaks internal detail — `src/app/[lang]/(saas-dashboard)/domains/error.tsx`
- [P2/i18n] Hardcoded English strings in error.tsx — 'Observability Error', error description, 'Refresh logs', 'Reload page' — `src/app/[lang]/(saas-dashboard)/observability/error.tsx`
- [P2/perf] Perf: missing DB index on Lead.nextFollowUpAt causes full table scan for overdue/cadence filters — `prisma/models/sales.prisma`
- [P2/i18n] nav-user dropdown: all visible labels are hardcoded English with no dictionary prop — `src/components/saas-dashboard/nav-user.tsx`
- [P2/i18n] nav-main 'Platform' group label and nav-projects 'Projects' + action labels are hardcoded English — `src/components/saas-dashboard/nav-main.tsx`
- [P2/i18n] search-input placeholder 'Search...' hardcoded English — `src/components/saas-dashboard/search-input.tsx`
- [P2/i18n] file-uploader.tsx: all toast and drop-zone messages are hardcoded English — `src/components/saas-dashboard/file-uploader.tsx`
- [P2/i18n] compliance/shared-groups-table.tsx: toast.success and button labels hardcoded English — `src/components/saas-dashboard/compliance/shared-groups-table.tsx`
- [P2/rendering] ThemeSelector uses dynamic require() for useTheme — violates React hooks rules — `src/components/saas-dashboard/theme-selector.tsx`
- [P2/deadcode] Dead code: lib/font.ts loads 6 Google Fonts but is never imported — `src/components/saas-dashboard/lib/font.ts`
- [P2/perf] School model missing @@index on isActive and planType — full table scans on analysis page — `prisma/models/school.prisma`
- [P3/i18n] conference/page.tsx reuses observability.title key — both Observability and Conference Observability pages show identical heading — `src/app/[lang]/(saas-dashboard)/observability/conference/page.tsx`
- [P3/deadcode] Dead code: duplicate use-callback-ref.tsx + unused hooks (use-mobile, use-media-query, use-multistep-form, use-controllable-state) — `src/components/saas-dashboard/hooks/use-callback-ref.ts`
- [P3/deadcode] Dead code: app-sidebar.tsx and org-switcher.tsx are unused scaffold stubs with invalid routes — `src/components/saas-dashboard/app-sidebar.tsx`
- [P3/deadcode] Dead code: lib/utils.ts duplicates @/lib/utils — never imported — `src/components/saas-dashboard/lib/utils.ts`

### tenants

- [P0/correctness] TenantDetail panel fetches silently 404 — wrong base path /operator/ — `src/components/saas-dashboard/tenants/detail.tsx`
- [P0/correctness] Outstanding balance always $0 — billing route selects non-existent Invoice.amount field — `src/app/[lang]/(saas-dashboard)/tenants/[tenantId]/billing/route.ts`
- [P0/correctness] analysis.tsx plan counts always return 0 — queries use uppercase planType but DB stores lowercase — `src/components/saas-dashboard/tenants/analysis.tsx`
- [P1/perf] content.tsx has uncached local getTenants, bypassing queries.ts unstable_cache — `src/components/saas-dashboard/tenants/content.tsx`
- [P1/perf] N+1 translation: getText() called per tenant in a Promise.all loop — `src/components/saas-dashboard/tenants/content.tsx`
- [P1/perf] analysis.tsx fires 10 sequential/parallel DB round-trips, reducible to ~4 with groupBy — `src/components/saas-dashboard/tenants/analysis.tsx`
- [P2/deadcode] Dead code: all.tsx, featured.tsx, card.tsx never imported outside the tenants block — `src/components/saas-dashboard/tenants/all.tsx`
- [P2/correctness] Duplicate tenantsSearchParams export — two independent cache instances for same URL params — `src/components/saas-dashboard/tenants/queries.ts`
- [P2/correctness] growthRate metric shows new-tenant share, not period-over-period growth — `src/components/saas-dashboard/tenants/analysis.tsx`
- [P2/correctness] columns.tsx has two dead impersonation menu items pointing to non-existent /operator/ routes — `src/components/saas-dashboard/tenants/columns.tsx`
- [P2/correctness] invoices/route.ts shows amountPaid as invoice amount — open invoices appear as $0 — `src/app/[lang]/(saas-dashboard)/tenants/[tenantId]/invoices/route.ts`
- [P2/i18n] Hardcoded English column headers, cell strings and filter labels in columns.tsx — `src/components/saas-dashboard/tenants/columns.tsx`
- [P2/i18n] Hardcoded English strings in delete-dialog.tsx and table.tsx grid view — `src/components/saas-dashboard/tenants/delete-dialog.tsx`
- [P2/correctness] content.tsx status filter checks 'active' but DataTable column emits 'true' — filter never applies — `src/components/saas-dashboard/tenants/content.tsx`
- [P3/i18n] Hardcoded pricing badge strings in analysis.tsx plan distribution cards — `src/components/saas-dashboard/tenants/analysis.tsx`
- [P3/dx] detail.tsx dictionary prop typed as any — no compile-time safety for key access — `src/components/saas-dashboard/tenants/detail.tsx`
