## Operator Block — Production-Ready Roadmap

This roadmap outlines the path to a world-class SaaS operator dashboard for school management systems. All tasks leverage existing, battle-tested components from the platform system.

**Status Legend:** [x] done, [~] in progress, [ ] todo
**Priority:** P0 (critical), P1 (high value), P2 (nice-to-have)

---

## ✅ Production-Ready Core Features

### Tenants Management
- [x] Server-rendered table with pagination, sorting, filtering
- [x] Comprehensive stats dashboard (9 cards): total, active, students, teachers, growth
- [x] Plan distribution breakdown (trial, basic, premium, enterprise)
- [x] Trial management alerts and filtering
- [x] Tenant detail drawer with full metrics
- [x] Impersonation with audit trail
- [x] Plan changes, suspend/activate actions
- [x] Server actions with Zod validation
- [x] 4 API endpoints (summary, billing, invoices, info)

### Billing & Invoices
- [x] Invoice table with server pagination
- [x] Billing stats (4 cards): revenue, payment rate, open invoices, pending receipts
- [x] Invoice filtering by status and search
- [x] Server-side data fetching with proper error handling
- [x] Stripe invoice integration (stripeInvoiceId)

### Domains Management
- [x] Domain requests table with pagination
- [x] Stats cards (5 cards): total, pending, approved, verified, approval rate
- [x] Approval/reject workflow
- [x] DNS configuration guidance
- [x] Status badges and alerts

### Observability
- [x] Audit logs table with filtering
- [x] Provider abstraction (DB + HTTP)
- [x] Filters: action, level, IP, date range, request ID
- [x] Empty states and loading skeletons

### Dashboard
- [x] Metrics cards with real-time deltas
- [x] Period switcher (7d/30d/90d)
- [x] Server-side metrics calculation
- [x] Loading states and error boundaries

### Security & RBAC
- [x] requireOperator() middleware
- [x] Audit logging for all actions
- [x] Impersonation with full trail
- [x] Session-based access control

---

## Phase 1: Revenue & Financial Analytics 💰 [P0]

**Goal:** Provide deep insights into revenue, MRR, churn, and financial health

**Reusable Blocks:**
- Invoice dashboard components (`src/components/invoice/dashboard/`)
- Recharts library (already in dashboard)
- Stats card pattern from tenants/billing

### 1.1 MRR (Monthly Recurring Revenue) Dashboard ✅
- [x] Create `src/components/operator/analytics/mrr-chart.tsx`
  - Reuse ChartInvoice pattern from invoice dashboard
  - Line chart showing MRR trend (last 6 months)
  - MRR breakdown by plan tier (stacked area chart)
- [x] Create server action `calculateMRR` in `analytics/actions.ts`
  - Calculate MRR from active subscriptions
  - Group by plan type (Trial excluded)
  - Return growth percentage vs previous period
- [x] Add MRR card to dashboard
  - Current MRR value
  - Growth % (green/red indicator)
  - "View Details" link to analytics page
- [x] Create `/operator/analytics` route
  - Full MRR dashboard with charts
  - MRR per school table
  - Export to CSV option

**Acceptance Criteria:**
- MRR updates in real-time when plans change
- Accurate calculation: (sum of monthly subscription fees for active schools)
- Chart shows clear trend with tooltips
- Works with all plan types

### 1.2 Revenue Trends & Forecasting
- [ ] Create `src/components/operator/analytics/revenue-trends.tsx`
  - 6-month revenue chart (bar + line combo)
  - Actual revenue vs projected revenue
  - Revenue by payment method breakdown
- [ ] Add revenue stats to main dashboard
  - Total revenue (all time)
  - This month revenue
  - Last month comparison
- [ ] Create revenue export function
  - Export revenue by month CSV
  - Export revenue by school CSV
  - Include payment method breakdown

**Acceptance Criteria:**
- Charts load within 2 seconds
- Data matches invoice records exactly
- Projections based on current MRR + growth rate

### 1.3 Churn Analysis & At-Risk Schools ✅
- [x] Create churn rate calculation
  - Cancelled schools / total schools (monthly)
  - Reasons for churn (if available)
- [x] Add churn rate card to dashboard
  - Current month churn %
  - Trend indicator (up/down)
- [x] Create at-risk schools detection
  - Payment failures in last 30 days
  - Usage dropped >50% from average
  - No logins in 14 days
  - Trial ending in <3 days with no payment method
- [ ] Add "At Risk" filter to tenants table
  - Show risk score/reason
  - Quick actions: email, call, offer discount
- [ ] Create `/operator/analytics/churn` route
  - Churn trends over time
  - Churn reasons breakdown
  - At-risk schools table with actions

**Acceptance Criteria:**
- At-risk detection runs daily
- Risk scores accurate and actionable
- Clear path to retention actions

---

## Phase 2: Complete Billing Features 📄 [P0]

**Goal:** Full billing lifecycle management including receipts, exports, and automation

**Reusable Blocks:**
- FileUploader (`src/components/operator/file-uploader.tsx`)
- ExportButton pattern (`src/components/platform/*/export-button.tsx`)
- DataTable with all features

### 2.1 Receipts Management ✅
- [x] Create receipts table using DataTable
  - Columns: school, invoice, amount, file, status, uploaded date
  - Filters: status (pending/approved/rejected), school, date range
  - Actions: view file, approve, reject
- [~] Integrate FileUploader for receipt uploads
  - Accept: PDF, PNG, JPG
  - Max size: 5MB
  - Auto-link to invoice if invoice number in filename
  - **Note:** Upload button UI present, full file storage integration pending
- [x] Create receipt review workflow
  - Server action: `reviewReceipt(receiptId, status, notes)`
  - Approval updates invoice status to "paid"
  - Rejection tracked with reason
  - Audit log all reviews
- [x] Update billing content tabs
  - Receipts tab implemented with full table
  - Stats cards (total, pending, approved, approval rate)
  - Upload Receipt button present
- [x] Create `/operator/billing/receipts` route
  - Full receipts table with pagination
  - Stats dashboard (4 cards)
  - Server-side filtering and sorting

**Acceptance Criteria:**
- File upload with progress indicator
- Files stored securely (S3 or similar)
- Receipts linked to correct invoices
- Review actions create audit entries
- Email notifications on status change

### 2.2 Billing Exports ✅
- [x] Add ExportButton to invoices table
  - Reuse pattern from students export
  - Export with current filters applied
- [x] Create `getInvoicesCSV` server action
  - Include all invoice fields
  - Include school name and domain
  - Respect filters (status, search)
  - Limit 10,000 rows to prevent memory issues
- [ ] Add export to receipts table
  - Include receipt status and file URL
- [ ] Create financial reports export
  - Monthly revenue report (by school)
  - Outstanding balances report
  - Payment method breakdown

**Acceptance Criteria:**
- CSV includes all visible columns
- Filename auto-generated with date
- Large exports (1000+ rows) don't timeout
- UTF-8 encoding for international characters

### 2.3 Payment Automation via Stripe
- [ ] Create Stripe webhook endpoint
  - Route: `/api/webhooks/stripe`
  - Handle events: invoice.paid, invoice.payment_failed, customer.subscription.deleted
- [ ] Auto-update invoice status
  - Mark invoice as paid when payment succeeds
  - Mark as failed with retry count
  - Create audit log entry
- [ ] Implement dunning management
  - Auto-retry failed payments (3 attempts)
  - Email notifications on each attempt
  - Auto-suspend after 3 failures
- [ ] Add payment retry button
  - Manual retry from invoice detail
  - Operator can trigger retry
  - Log retry attempts

**Acceptance Criteria:**
- Webhook signature verification
- Idempotent event handling
- All status changes logged
- Email notifications sent reliably

---

## Phase 3: School Health & Engagement 📊 [P1]

**Goal:** Proactive monitoring of school health, usage, and engagement

**Reusable Blocks:**
- Stats cards pattern
- DataTable with custom columns
- Chart components from dashboard

### 3.1 School Health Score Dashboard
- [ ] Create health score algorithm
  - Factors: payment status (40%), usage frequency (30%), support tickets (20%), feature adoption (10%)
  - Scale: 0-100
  - Categories: Critical (<40), At Risk (40-60), Healthy (60-80), Excellent (80+)
- [ ] Add health score column to tenants table
  - Color-coded badge (red/yellow/green)
  - Sortable by health score
  - Filter by health category
- [ ] Create health score detail view
  - Breakdown by factor
  - Historical health trend (last 6 months)
  - Recommended actions
- [ ] Add health distribution card to dashboard
  - Count by category
  - Trend vs last month

**Acceptance Criteria:**
- Score updates daily
- Algorithm weights configurable
- Clear action items for low scores

### 3.2 Usage Analytics per School
- [ ] Track key usage metrics
  - Daily active users (teachers + students)
  - Feature usage: attendance, grades, assignments, announcements
  - Peak usage times
  - Mobile vs desktop
- [ ] Add usage stats to tenant detail
  - Usage graph (last 30 days)
  - Feature adoption percentages
  - Comparison to average school
- [ ] Create `/operator/analytics/usage` route
  - Usage heatmap by school
  - Feature adoption table
  - Schools with zero usage of key features

**Acceptance Criteria:**
- Metrics tracked in real-time or near real-time
- Privacy-compliant (aggregated data only)
- Identifies underutilized features

### 3.3 Engagement Trends
- [ ] Create engagement metrics
  - Weekly active schools (logged in within 7 days)
  - Monthly active schools
  - Session duration averages
  - Return rate (schools that log in >1x/week)
- [ ] Add engagement chart to dashboard
  - Line chart: WAU and MAU over time
  - Engagement rate trend
- [ ] Create engagement alerts
  - School hasn't logged in for 14 days
  - Drop in usage >30% vs previous month
  - No key feature usage (e.g., no grades entered)

**Acceptance Criteria:**
- Charts update weekly
- Alerts trigger email to operator
- Engagement data exportable

---

## Phase 4: Advanced Tenant Management 🔍 [P1]

**Goal:** Deeper tenant insights and bulk operations

**Reusable Blocks:**
- CSV import workflow (`src/components/platform/import/csv-import.tsx`)
- DataTable with bulk actions
- Server actions pattern

### 4.1 Growth Tracking per School
- [ ] Add growth metrics to tenant detail
  - Student count trend (last 6 months)
  - Teacher count trend
  - Classes count trend
  - Growth rate % vs average
- [ ] Create growth chart component
  - Line chart showing all metrics
  - Comparison to industry average
- [ ] Add growth indicators to tenants table
  - Icon showing growth direction (↑↓→)
  - Color-coded by growth rate

**Acceptance Criteria:**
- Historical data accurate
- Growth % calculated correctly
- Charts interactive with tooltips

### 4.2 Onboarding Progress Tracker
- [ ] Track onboarding step completion
  - School created → Email verified → First user added → First class created → First student added → First grade entered
  - Time spent at each step
  - Drop-off points
- [ ] Add onboarding progress column to tenants table
  - Progress bar (0-100%)
  - Current step name
  - Days since last progress
- [ ] Create onboarding analytics route
  - Funnel chart showing drop-offs
  - Average time to complete
  - Schools stalled >7 days at a step
- [ ] Add onboarding alerts
  - Stalled at step for >7 days
  - High-value school (trial, >100 students planned) stalled

**Acceptance Criteria:**
- Progress tracked automatically
- Alerts actionable
- Clear path to help stalled schools

### 4.3 Bulk Operations
- [ ] Adapt CSV import for operator use
  - Bulk plan changes via CSV
  - Format: school_id, new_plan, reason
  - Validation: school exists, plan valid
- [ ] Create bulk suspend/activate
  - CSV format: school_id, action (suspend/activate), reason
  - Audit log all changes
  - Email notifications to affected schools
- [ ] Create bulk discount application
  - CSV format: school_id, discount_code, expiry_date
  - Validate discount codes exist
  - Apply to subscriptions
- [ ] Add bulk actions to tenants table
  - Select multiple schools
  - Actions: change plan, suspend, apply discount
  - Confirmation modal with preview

**Acceptance Criteria:**
- CSV validation comprehensive
- All actions audited
- Rollback available for errors
- Email notifications sent

---

## Phase 5: Notifications & Alerts 🔔 [P1]

**Goal:** Real-time awareness of critical events

**Reusable Blocks:**
- Toast notification system (Sonner)
- Badge components
- Server actions with revalidation

### 5.1 Real-Time Alert System
- [ ] Define alert types
  - Trial expiring (7 days, 3 days, 1 day, expired)
  - Payment failure
  - High-value school signup (>100 students, enterprise plan)
  - Churn risk (high risk score)
  - Stalled onboarding (>7 days no progress)
- [ ] Create alerts data model
  - Table: Alert (type, schoolId, priority, message, read, createdAt)
  - Index on read and createdAt
- [ ] Create alert generation system
  - Cron job runs daily
  - Checks conditions for all schools
  - Creates alerts if triggered
- [ ] Add alert badges to dashboard
  - Badge count by priority (critical/warning)
  - Click to view alert center

**Acceptance Criteria:**
- Alerts generated accurately
- No duplicate alerts for same event
- Alerts cleared when condition resolved

### 5.2 Notification Center
- [ ] Create notifications table component
  - Columns: type, school, message, priority, time
  - Filters: priority, type, read/unread
  - Actions: mark read, dismiss, view details
- [ ] Create `/operator/notifications` route
  - Full notifications table
  - Mark all as read button
  - Filter by date range
- [ ] Add notification bell icon to navbar
  - Unread count badge
  - Dropdown preview (last 5)
  - "View All" link
- [ ] Create notification actions
  - Click notification → navigate to relevant page (school detail, invoice, etc.)
  - Mark as read automatically on click
  - Dismiss button removes notification

**Acceptance Criteria:**
- Real-time updates (WebSocket or polling)
- Notifications persist until dismissed
- Clear visual hierarchy by priority

---

## Phase 6: Reporting & Exports 📈 [P2]

**Goal:** Comprehensive reporting for all data

**Reusable Blocks:**
- ExportButton pattern throughout
- CSV generation utilities
- Email system (Resend)

### 6.1 Universal CSV Exports
- [ ] Add ExportButton to all tables
  - Tenants table → tenants CSV
  - Domains table → domains CSV
  - Receipts table → receipts CSV
  - Audit logs → logs CSV
- [ ] Create export server actions
  - Pattern: `get{Feature}CSV(filters)`
  - Respect all table filters
  - Include all columns
- [ ] Add export history
  - Track who exported what, when
  - Link to download again (cache for 24h)

**Acceptance Criteria:**
- All tables have export button
- Exports respect applied filters
- Large exports (10k+ rows) handled efficiently

### 6.2 Custom Date Range Reports
- [ ] Create date range picker component
  - Preset ranges: last 7d, 30d, 90d, year, custom
  - Apply to any report
- [ ] Create custom reports route
  - Select report type (revenue, usage, schools)
  - Select date range
  - Apply filters
  - Generate report
- [ ] Add saved report templates
  - Save filter + date range combinations
  - Name templates (e.g., "Monthly Revenue Report")
  - One-click regenerate

**Acceptance Criteria:**
- Date range picker intuitive
- Reports generate within 5 seconds
- Saved templates editable

### 6.3 Email Report Delivery
- [ ] Create email report scheduler
  - Schedule report generation (daily, weekly, monthly)
  - Select recipients (operator emails)
  - Format: PDF or CSV attachment
- [ ] Integrate with Resend
  - Email template for reports
  - Attachment handling
  - Delivery confirmation
- [ ] Add scheduled reports management
  - List scheduled reports
  - Edit/delete schedules
  - Manual trigger

**Acceptance Criteria:**
- Emails sent reliably
- Reports attached correctly
- Recipients can opt-out

---

## Testing & Quality Assurance

### Unit Tests
- [ ] Test MRR calculation accuracy
- [ ] Test churn rate calculation
- [ ] Test health score algorithm
- [ ] Test CSV export functions
- [ ] Test bulk operations validation

### Integration Tests
- [ ] Test Stripe webhook handling
- [ ] Test alert generation system
- [ ] Test notification delivery
- [ ] Test email report sending

### E2E Tests (Playwright)
- [ ] Operator login and navigation
- [ ] Tenant detail workflow
- [ ] Invoice review workflow
- [ ] Receipt upload and approval
- [ ] Bulk operations flow

---

## Documentation

- [ ] API documentation for all server actions
- [ ] Webhook endpoint documentation
- [ ] Alert types and triggers guide
- [ ] Bulk operations CSV format guide
- [ ] Health score algorithm documentation

---

## Deployment & Monitoring

- [ ] Set up error tracking (Sentry already integrated)
- [ ] Create operator dashboard metrics (Vercel Analytics)
- [ ] Set up uptime monitoring
- [ ] Create runbook for common issues
- [ ] Set up staging environment for testing

---

## Notes

**Reusable Block Locations:**
- DataTable: `src/components/table/data-table/`
- ExportButton: `src/components/platform/*/export-button.tsx`
- CSV Import: `src/components/platform/import/csv-import.tsx`
- FileUploader: `src/components/operator/file-uploader.tsx`
- Invoice System: `src/components/invoice/`
- Stats Cards: Pattern in tenants/billing/domains content components
- Charts: Recharts in dashboard (area-graph, bar-graph, pie-graph)

**Dependencies:**
- All features follow mirror pattern: components mirror routes
- All mutations use server actions with "use server" directive
- All actions include Zod validation
- All operator actions create audit log entries
- All queries respect operator RBAC (requireOperator middleware)
