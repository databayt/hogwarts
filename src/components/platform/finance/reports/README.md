# Financial Reports

Comprehensive financial reporting system with customizable reports, analytics, and export capabilities.

## Overview

The Reports module provides powerful financial reporting and analytics tools for monitoring school finances, generating compliance reports, and making data-driven decisions.

## Key Features

### 1. Standard Financial Reports
- Income Statement (Profit & Loss)
- Balance Sheet
- Cash Flow Statement
- Budget vs Actual Report
- General Ledger Report

### 2. Custom Report Builder
- Drag-and-drop report designer
- Custom date ranges
- Filter by department, category, account
- Save report templates
- Schedule automated report generation

### 3. Data Visualization
- Interactive charts and graphs
- Trend analysis
- Comparative analysis (year-over-year)
- Real-time dashboards
- Export to PDF, Excel, CSV

### 4. Analytics & Insights
- Revenue analysis
- Expense analysis
- Cash flow forecasting
- Budget variance analysis
- Key performance indicators (KPIs)

### 5. Compliance Reports
- Tax reports
- Audit reports
- Grant reporting
- Board presentations
- Government filings

## Standard Reports

### 1. Income Statement
Shows revenue, expenses, and net income for a period.

**Structure:**
```
REVENUE
├── Tuition Fees
├── Registration Fees
├── Cafeteria Sales
├── Events Revenue
└── Other Revenue
TOTAL REVENUE

EXPENSES
├── Salaries & Benefits
├── Operating Expenses
├── Utilities
├── Marketing
├── Maintenance
└── Other Expenses
TOTAL EXPENSES

NET INCOME = TOTAL REVENUE - TOTAL EXPENSES
```

**Example:**
```typescript
const result = await generateIncomeStatementWithRBAC({
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  compareWithPriorYear: true,
  groupBy: "quarter"
})
```

### 2. Balance Sheet
Shows assets, liabilities, and equity at a specific date.

**Structure:**
```
ASSETS
├── Current Assets
│   ├── Cash & Bank
│   ├── Accounts Receivable
│   └── Prepaid Expenses
└── Fixed Assets
    ├── Buildings
    ├── Equipment
    └── Furniture

LIABILITIES
├── Current Liabilities
│   ├── Accounts Payable
│   ├── Accrued Expenses
│   └── Short-term Loans
└── Long-term Liabilities
    └── Mortgages

EQUITY
├── Retained Earnings
└── Current Year Earnings

TOTAL ASSETS = LIABILITIES + EQUITY
```

### 3. Cash Flow Statement
Shows cash inflows and outflows.

**Categories:**
- **Operating Activities:** Day-to-day operations
- **Investing Activities:** Asset purchases/sales
- **Financing Activities:** Loans, equity

**Example:**
```typescript
const result = await generateCashFlowStatementWithRBAC({
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  method: "INDIRECT" // or "DIRECT"
})
```

### 4. Budget vs Actual Report
Compares budgeted amounts with actual spending.

**Columns:**
- Budget
- Actual
- Variance ($ and %)
- Forecast

**Example Output:**
```
Category         | Budget    | Actual   | Variance  | %
Salaries         | $500,000  | $485,000 | $15,000   | +3%  ✅
Operating Exp    | $150,000  | $162,000 | -$12,000  | -8%  ⚠️
Technology       | $50,000   | $48,500  | $1,500    | +3%  ✅
```

### 5. General Ledger Report
Detailed list of all transactions by account.

**Columns:**
- Date
- Account
- Description
- Debit
- Credit
- Balance

**Filters:**
- Date range
- Account type
- Transaction type
- Department

## Custom Report Builder

### Report Parameters

```typescript
interface ReportParameters {
  startDate: Date
  endDate: Date
  accounts?: string[]
  departments?: string[]
  categories?: string[]
  groupBy?: "day" | "week" | "month" | "quarter" | "year"
  compareWith?: "prior_period" | "prior_year" | "budget"
  format?: "pdf" | "excel" | "csv" | "json"
}
```

### Example: Custom Revenue Report

```typescript
const result = await generateCustomReportWithRBAC({
  name: "Monthly Revenue by Source",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  accounts: ["revenue_tuition", "revenue_fees", "revenue_events"],
  groupBy: "month",
  compareWith: "prior_year",
  format: "excel"
})
```

## Data Models

### Report
```typescript
{
  id: string
  name: string
  type: ReportType
  parameters: Json
  createdBy: string
  createdAt: Date
  lastGenerated?: Date
  isTemplate: boolean
  isScheduled: boolean
  schedule?: ReportSchedule
}
```

### Report Types
```typescript
enum ReportType {
  INCOME_STATEMENT
  BALANCE_SHEET
  CASH_FLOW
  BUDGET_VS_ACTUAL
  GENERAL_LEDGER
  ACCOUNTS_RECEIVABLE
  ACCOUNTS_PAYABLE
  TRIAL_BALANCE
  CUSTOM
}
```

### Report Schedule
```typescript
{
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually"
  dayOfWeek?: number      // 0-6 for weekly
  dayOfMonth?: number     // 1-31 for monthly
  recipients: string[]    // Email addresses
  format: "pdf" | "excel"
}
```

## Server Actions

### Standard Report Generation

#### `generateIncomeStatementWithRBAC(params)`
Generates income statement (P&L report).

**Permissions Required:** `reports:view`

**Returns:**
```typescript
{
  period: { start: Date; end: Date }
  revenue: {
    tuition: number
    fees: number
    other: number
    total: number
  }
  expenses: {
    salaries: number
    operating: number
    other: number
    total: number
  }
  netIncome: number
  comparison?: {
    revenue: number
    expenses: number
    netIncome: number
    changes: {
      revenue: { amount: number; percentage: number }
      expenses: { amount: number; percentage: number }
      netIncome: { amount: number; percentage: number }
    }
  }
}
```

#### `generateBalanceSheetWithRBAC(params)`
Generates balance sheet report.

**Permissions Required:** `reports:view`

#### `generateCashFlowStatementWithRBAC(params)`
Generates cash flow statement.

**Permissions Required:** `reports:view`

#### `generateBudgetVsActualReportWithRBAC(params)`
Generates budget variance report.

**Permissions Required:** `reports:view`

### Custom Report Generation

#### `generateCustomReportWithRBAC(params)`
Generates custom report based on parameters.

**Permissions Required:** `reports:create`

**Example:**
```typescript
const result = await generateCustomReportWithRBAC({
  name: "Q4 Department Spending",
  startDate: new Date("2024-10-01"),
  endDate: new Date("2024-12-31"),
  groupBy: "department",
  accounts: ["expense_*"], // Wildcard for all expense accounts
  format: "pdf"
})
```

### Report Scheduling

#### `scheduleReportWithRBAC(reportId, schedule)`
Schedules automatic report generation.

**Permissions Required:** `reports:create`

**Example:**
```typescript
const result = await scheduleReportWithRBAC(reportId, {
  frequency: "monthly",
  dayOfMonth: 1,
  recipients: ["cfo@school.edu", "principal@school.edu"],
  format: "pdf"
})
```

### Report Export

#### `exportReportWithRBAC(reportId, format)`
Exports report to specified format.

**Permissions Required:** `reports:export`

**Supported Formats:**
- **PDF**: Professional formatted report with charts
- **Excel**: Editable spreadsheet with formulas
- **CSV**: Raw data for external analysis
- **JSON**: API integration format

## Financial Metrics & KPIs

### Revenue Metrics
```typescript
{
  totalRevenue: number
  revenueGrowth: number        // % change from prior period
  revenuePerStudent: number
  tuitionRealization: number   // % of billed tuition collected
  averageRevenue: number       // per month/quarter
}
```

### Expense Metrics
```typescript
{
  totalExpenses: number
  expenseGrowth: number
  expensePerStudent: number
  salaryToRevenue: number      // % of revenue spent on salaries
  operatingMargin: number      // (Revenue - Expenses) / Revenue
}
```

### Cash Flow Metrics
```typescript
{
  cashBalance: number
  operatingCashFlow: number
  daysOfCash: number           // Days the school can operate with current cash
  burnRate: number             // Monthly cash consumption
}
```

### Efficiency Metrics
```typescript
{
  accountsReceivableDays: number  // Average collection time
  accountsPayableDays: number     // Average payment time
  inventoryTurnover: number
  assetUtilization: number
}
```

## Workflow

### Monthly Reporting Cycle
```
1. Month End Close (Day 1-3)
   - Review all transactions
   - Reconcile bank accounts
   - Record accruals and deferrals
   - Close monthly books

2. Report Generation (Day 4-5)
   - Generate income statement
   - Generate balance sheet
   - Generate cash flow statement
   - Generate budget variance

3. Review & Analysis (Day 6-10)
   - Finance team reviews reports
   - Identify variances
   - Prepare explanations
   - Create presentations

4. Distribution (Day 11-15)
   - Share reports with leadership
   - Board presentation (if applicable)
   - Department feedback
   - Archive for compliance
```

## Integration with Other Modules

### Accounts Module
- Pulls data from journal entries
- Uses chart of accounts structure
- Applies accounting rules

### Budget Module
- Compares actual vs budget
- Shows variance percentages
- Tracks budget utilization

### Fees Module
- Revenue recognition
- Accounts receivable aging
- Collection rate analysis

### Payroll Module
- Salary expense categorization
- Benefit cost allocation
- Labor cost analysis

### Banking Module
- Cash balance reporting
- Bank reconciliation data
- Transaction categorization

## RBAC (Role-Based Access Control)

### Permissions

| Role | View | Create | Edit | Export | Schedule | Delete |
|------|------|--------|------|--------|----------|--------|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ACCOUNTANT** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **TEACHER** | ✅ (dept) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **STAFF** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **STUDENT** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **GUARDIAN** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Note:** Department heads can view reports for their departments only.

## Best Practices

### 1. Timely Reporting
- Close books within 5 days of month end
- Generate reports by day 10
- Review and distribute by day 15
- Maintain consistent schedule

### 2. Data Quality
- Reconcile all accounts monthly
- Investigate unusual variances (>10%)
- Document all adjustments
- Review aging reports weekly

### 3. Report Design
- Use consistent formats
- Include comparison periods
- Highlight key metrics
- Add visual aids (charts, graphs)

### 4. Distribution
- Send to right stakeholders
- Use executive summaries
- Protect sensitive information
- Archive all versions

### 5. Analysis
- Don't just report numbers - analyze trends
- Provide context for variances
- Make actionable recommendations
- Link to strategic goals

## Troubleshooting

### Report Data Mismatch
**Issue:** Report totals don't match accounting system

**Solution:**
- Verify date ranges match
- Check account filters
- Review journal entry postings
- Run data integrity check
- Regenerate report

### Slow Report Generation
**Issue:** Reports take >2 minutes to generate

**Solution:**
- Limit date range
- Reduce number of accounts
- Use pre-aggregated data
- Schedule during off-peak hours
- Optimize database queries

### Export Failed
**Issue:** Cannot export report to Excel/PDF

**Solution:**
- Check file size limits
- Verify export permissions
- Try different format
- Reduce data volume
- Contact support

## Future Enhancements

1. **AI-Powered Insights**: Automatic anomaly detection
2. **Predictive Analytics**: Forecast future performance
3. **Interactive Dashboards**: Real-time drill-down capabilities
4. **Benchmarking**: Compare with similar schools
5. **Natural Language Queries**: "Show me expenses last quarter"

## Related Files

- `actions-enhanced.ts` - Server actions with RBAC
- `content.tsx` - UI components
- `chart-builder.tsx` - Visualization components
- `export-utils.ts` - Export functionality
- `lib/calculations.ts` - Financial calculations

## Support

For questions or issues with the Reports module, contact the finance team or check the main finance documentation.

**Documentation:** `/docs/finance/reports`
**Support Email:** finance@school.edu
