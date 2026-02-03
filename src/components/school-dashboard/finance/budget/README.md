# Budget Management

Comprehensive budget planning and variance analysis system with real-time monitoring and forecasting.

## Overview

The Budget module provides schools with powerful tools to plan, allocate, monitor, and analyze financial resources across different categories and departments.

## Key Features

### 1. Budget Creation & Allocation

- Create annual/quarterly/monthly budgets
- Allocate funds to multiple categories
- Set spending limits per allocation
- Support for departments and projects
- Multi-currency support

### 2. Variance Analysis

- Real-time variance tracking (allocated vs spent vs committed)
- Percentage variance calculations
- Status indicators (UNDER, ON_TRACK, NEAR_LIMIT, OVER)
- Automated alerts for overspending
- Monthly trend analysis

### 3. Budget Forecasting

- AI-powered spending projections
- Historical data analysis
- Projected overrun calculations
- Recommended adjustments
- Confidence scores

### 4. Budget Transfers

- Transfer funds between allocations
- Approval workflow for transfers
- Reason tracking and audit trail
- Prevents negative balances

### 5. Budget Revisions

- Version control for budget changes
- Track all modifications
- Compare revisions side-by-side
- Approval workflow for major changes

## Data Models

### Budget

```typescript
{
  id: string
  name: string
  description?: string
  fiscalYear: number
  startDate: Date
  endDate: Date
  totalAllocated: Decimal
  totalSpent: Decimal
  totalCommitted: Decimal
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  approvedBy?: string
  approvedAt?: Date
  allocations: BudgetAllocation[]
  revisions: BudgetRevision[]
}
```

### BudgetAllocation

```typescript
{
  id: string
  budgetId: string
  category: string        // Operating, Capital, Salaries, etc.
  department?: string
  allocated: Decimal
  spent: Decimal
  committed: Decimal
  notes?: string
}
```

### BudgetRevision

```typescript
{
  id: string
  budgetId: string
  revisionNumber: number
  changes: Json // { category, oldAmount, newAmount, reason }
  reason: string
  revisedBy: string
  revisedAt: Date
}
```

## Server Actions

### Budget CRUD

#### `createBudgetWithRBAC(data)`

Creates a new budget with allocations.

**Permissions Required:** `budget:create`

**Example:**

```typescript
const result = await createBudgetWithRBAC({
  name: "FY 2024-25 Budget",
  fiscalYear: 2024,
  startDate: new Date("2024-07-01"),
  endDate: new Date("2025-06-30"),
  allocations: [
    { category: "Salaries", allocated: 500000 },
    { category: "Operating Expenses", allocated: 150000 },
    { category: "Capital Expenditure", allocated: 100000 },
  ],
})
```

#### `updateBudgetWithRBAC(id, data)`

Updates budget details and allocations.

**Permissions Required:** `budget:edit`

#### `deleteBudgetWithRBAC(id)`

Deletes a budget (only if in DRAFT status).

**Permissions Required:** `budget:delete`

#### `approveBudgetWithRBAC(id)`

Approves a budget, changing status from DRAFT to ACTIVE.

**Permissions Required:** `budget:approve`

### Variance Analysis

#### `getBudgetWithVarianceAnalysis(budgetId)`

Retrieves comprehensive variance analysis for a budget.

**Returns:**

```typescript
{
  budgetId: string
  budgetName: string
  period: string
  totalAllocated: number
  totalSpent: number
  totalCommitted: number
  totalAvailable: number
  totalVariance: number
  variancePercentage: number
  utilizationRate: number
  allocations: BudgetAllocation[] // with status
  trends: MonthlyTrend[]
  alerts: Alert[]
}
```

**Status Values:**

- `UNDER` - Spent < 70% of allocated
- `ON_TRACK` - Spent 70-90% of allocated
- `NEAR_LIMIT` - Spent 90-100% of allocated
- `OVER` - Spent > 100% of allocated

**Alert Severity:**

- `INFO` - Informational message
- `WARNING` - Approaching limit (>85% spent)
- `CRITICAL` - Over budget or very close (>95% spent)

**Example:**

```typescript
const result = await getBudgetWithVarianceAnalysis(budgetId)

if (result.success && result.data) {
  console.log(`Total Variance: ${result.data.totalVariance}`)
  console.log(`Utilization: ${result.data.utilizationRate}%`)

  // Check for overspending alerts
  const criticalAlerts = result.data.alerts.filter(
    (a) => a.severity === "CRITICAL"
  )
  if (criticalAlerts.length > 0) {
    console.warn("CRITICAL ALERTS:", criticalAlerts)
  }
}
```

### Forecasting

#### `generateBudgetForecast(budgetId)`

Generates spending forecast based on historical data.

**Returns:**

```typescript
{
  budgetId: string
  forecastDate: Date
  totalAllocated: number
  totalSpent: number
  projectedSpending: number
  projectedOverrun: number
  projectedUnderrun: number
  confidence: number      // 0-100
  allocations: AllocationForecast[]
  recommendations: string[]
}
```

**Example:**

```typescript
const result = await generateBudgetForecast(budgetId)

if (result.success && result.data) {
  if (result.data.projectedOverrun > 0) {
    console.warn(`Projected overrun: $${result.data.projectedOverrun}`)
  }

  // Show recommendations
  result.data.recommendations.forEach((rec) => {
    console.log("💡", rec)
  })
}
```

### Budget Transfers

#### `transferBudgetAllocationWithRBAC(data)`

Transfers funds between budget allocations.

**Permissions Required:** `budget:edit` or `budget:approve`

**Example:**

```typescript
const result = await transferBudgetAllocationWithRBAC({
  fromAllocationId: "alloc_123",
  toAllocationId: "alloc_456",
  amount: 10000,
  reason: "Need additional funds for technology purchases",
})
```

**Validation:**

- Source allocation must have sufficient available funds
- Cannot transfer to same allocation
- Requires approval if amount > threshold (configurable)

### Budget Revisions

#### `createBudgetRevisionWithRBAC(budgetId, changes, reason)`

Creates a new budget revision with tracked changes.

**Permissions Required:** `budget:approve`

**Example:**

```typescript
const result = await createBudgetRevisionWithRBAC(
  budgetId,
  [
    {
      category: "Salaries",
      oldAmount: 500000,
      newAmount: 550000,
      reason: "Additional teaching staff hired",
    },
  ],
  "Mid-year budget adjustment"
)
```

## Budget Categories

Common budget categories:

| Category                     | Description           | Typical % of Total |
| ---------------------------- | --------------------- | ------------------ |
| **Salaries & Benefits**      | Staff compensation    | 60-70%             |
| **Operating Expenses**       | Day-to-day operations | 15-20%             |
| **Capital Expenditure**      | Buildings, equipment  | 5-10%              |
| **Technology**               | IT infrastructure     | 3-5%               |
| **Marketing**                | Student recruitment   | 2-3%               |
| **Professional Development** | Staff training        | 1-2%               |
| **Contingency**              | Emergency fund        | 5%                 |

## Workflow

### 1. Budget Planning Phase

```
1. Finance team creates draft budget
2. Allocate funds to categories
3. Department heads review allocations
4. Adjustments made based on feedback
5. Principal/Admin approves budget
6. Status changes to ACTIVE
```

### 2. Budget Monitoring Phase

```
1. Monthly variance analysis
2. Review spending vs allocated
3. Identify over/under spending categories
4. Generate forecasts
5. Request transfers if needed
6. Track and approve transfers
```

### 3. Budget Closing Phase

```
1. Final variance analysis
2. Generate year-end reports
3. Identify unused funds
4. Plan budget for next fiscal year
5. Close budget (status = CLOSED)
```

## Integration with Other Modules

### Expenses Module

- All approved expenses deduct from budget allocations
- Real-time budget availability checks
- Prevents expenses exceeding allocated amounts

### Payroll Module

- Salary payments deduct from "Salaries" allocation
- Automatic budget commitment for recurring salaries
- Year-to-date tracking

### Accounts Module

- Journal entries link to budget allocations
- Double-entry bookkeeping for all budget transactions
- Financial statement integration

### Reports Module

- Budget vs actual reports
- Variance analysis reports
- Department-wise spending reports
- Year-over-year comparisons

## RBAC (Role-Based Access Control)

### Permissions

| Role           | View      | Create | Edit | Delete | Approve | Forecast |
| -------------- | --------- | ------ | ---- | ------ | ------- | -------- |
| **ADMIN**      | ✅        | ✅     | ✅   | ✅     | ✅      | ✅       |
| **ACCOUNTANT** | ✅        | ✅     | ✅   | ✅     | ✅      | ✅       |
| **TEACHER**    | ✅ (dept) | ❌     | ❌   | ❌     | ❌      | ❌       |
| **STAFF**      | ✅ (dept) | ❌     | ❌   | ❌     | ❌      | ❌       |
| **STUDENT**    | ❌        | ❌     | ❌   | ❌     | ❌      | ❌       |
| **GUARDIAN**   | ❌        | ❌     | ❌   | ❌     | ❌      | ❌       |

**Note:** Teachers and staff can view budgets for their departments only (requires custom permission).

## Best Practices

### 1. Budget Planning

- Plan 12-18 months in advance
- Include 5-10% contingency fund
- Review historical spending patterns
- Involve department heads in planning

### 2. Allocation Strategy

- Align allocations with strategic goals
- Use zero-based budgeting approach
- Prioritize essential spending first
- Leave room for unexpected costs

### 3. Monitoring

- Review variance monthly
- Set up automated alerts
- Investigate significant variances (>10%)
- Adjust forecasts quarterly

### 4. Transfer Management

- Document all transfer reasons
- Require approval for transfers >$5,000
- Limit transfers to 10% of allocation
- Track transfer patterns for next year's planning

### 5. Year-End Procedures

- Freeze budget 2 weeks before fiscal year end
- Reconcile all transactions
- Generate final reports
- Archive for audit purposes

## Reports & Analytics

### Standard Reports

1. **Budget Summary Report**
   - Total allocated, spent, committed
   - Overall variance
   - Utilization rate

2. **Variance Analysis Report**
   - Category-wise variance
   - Status indicators
   - Monthly trends
   - Alert summary

3. **Forecast Report**
   - Projected spending to year-end
   - Expected overruns/underruns
   - Confidence levels
   - Recommendations

4. **Transfer History Report**
   - All budget transfers
   - Transfer reasons
   - Approval status
   - Impact on allocations

5. **Revision History Report**
   - All budget revisions
   - Version comparison
   - Change tracking
   - Approval workflow

### Custom Reports

- Department-wise spending
- Year-over-year comparison
- Budget efficiency metrics
- Capital vs operating expense ratio

## Troubleshooting

### Budget Over/Under Allocated

**Issue:** Total allocations don't match budget total

**Solution:**

- Review all allocations
- Check for missing categories
- Verify calculation accuracy
- Adjust allocations to match total

### Variance Calculation Incorrect

**Issue:** Variance numbers don't match manual calculations

**Solution:**

- Verify all transactions are approved
- Check for pending/committed amounts
- Ensure expense categorization is correct
- Run data integrity check

### Forecast Not Accurate

**Issue:** Forecast projections are significantly off

**Solution:**

- Ensure sufficient historical data (3+ months)
- Check for one-time expenses skewing averages
- Adjust forecast algorithm parameters
- Use manual override if needed

## Future Enhancements

1. **Multi-Year Budgeting**: Plan budgets for 3-5 years
2. **AI-Powered Recommendations**: Smart suggestions for allocation
3. **What-If Scenarios**: Test different budget scenarios
4. **Department Collaboration**: Allow departments to propose budgets
5. **External Benchmarking**: Compare with similar schools

## Related Files

- `actions-enhanced.ts` - Server actions with RBAC
- `content.tsx` - UI components
- `validation.ts` - Zod schemas
- `types.ts` - TypeScript types
- `lib/permissions.ts` - Permission checks

## Support

For questions or issues with the Budget module, contact the finance team or check the main finance documentation.
