# Finance Dashboard Module

## Overview
The Finance Dashboard provides a comprehensive financial overview for school administrators, accountants, and other stakeholders with role-based access control.

## Features

### 📊 Key Performance Indicators (KPIs)
- **Revenue Metrics**: Total revenue, collected revenue, outstanding amounts, collection rate
- **Expense Tracking**: Total expenses, budget utilization, category breakdown
- **Profit Analysis**: Net profit, profit margin, trend analysis
- **Cash Flow**: Current balance, cash runway, inflow/outflow tracking
- **Student Metrics**: Payment status, fee collection progress
- **Payroll Status**: Processed vs pending payroll

### 📈 Interactive Charts
1. **Revenue & Expenses Chart**
   - Monthly trends over 12 months
   - Area, bar, and line chart views
   - Revenue vs expenses comparison
   - Profit visualization

2. **Expense Breakdown Chart**
   - Pie chart and bar chart views
   - Category-wise distribution
   - Top expense categories
   - Percentage allocation

3. **Cash Flow Chart**
   - Inflow vs outflow visualization
   - Net cash flow calculation
   - Current balance display

4. **Bank Accounts Summary**
   - Account balances by type
   - Percentage distribution
   - Quick transfer/reconciliation actions

### 🚨 Smart Alerts System
- **Overdue Invoices**: Automatic detection and notification
- **Low Cash Balance**: Alert when below 2 months of expenses
- **Pending Payroll**: Reminder for payroll processing
- **Budget Overruns**: Warning when categories exceed allocation
- **Collection Success**: Positive reinforcement for good collection rates

### ⚡ Quick Actions
- Create Invoice
- Record Payment
- Submit Expense
- Run Payroll
- View Reports
- Bank Reconciliation

### 📝 Recent Transactions
- Real-time transaction feed
- Income, expense, and transfer tracking
- Status indicators (completed, pending, failed)
- Quick summary statistics

## Role-Based Access Control (RBAC)

### Admin & Accountant
- Full dashboard access
- All KPIs visible
- Complete chart access
- All quick actions available
- Budget management
- Detailed transaction history

### Teacher & Staff
- Limited KPIs (salary, basic metrics)
- Expense submission access
- View own transactions
- Limited report access

### Student & Guardian
- Fee payment status only
- Outstanding balance visibility
- Payment quick actions
- Limited dashboard view

## API Endpoints

### Server Actions
```typescript
getDashboardStats(dateRange: 'month' | 'quarter' | 'year')
getRecentTransactions(limit: number)
getFinancialAlerts()
getQuickActionsForRole(role: string)
```

## Database Tables Used
- `UserInvoice` - Invoice tracking
- `Payment` - Payment records
- `Expense` - Expense management
- `BankAccount` - Banking data
- `Budget` & `BudgetAllocation` - Budget tracking
- `FeeStructure` & `FeeAssignment` - Fee management
- `PayrollRun` - Payroll data
- `Wallet` - Digital wallet balances
- `Transaction` - Bank transactions

## Component Structure

```
dashboard/
├── types.ts              # TypeScript definitions
├── actions.ts            # Server actions (data fetching)
├── content.tsx           # Main dashboard composition
├── kpi-card.tsx          # KPI display cards
├── revenue-chart.tsx     # Revenue/expense charts
├── expense-chart.tsx     # Expense breakdown charts
├── cash-flow-chart.tsx   # Cash flow visualization
├── bank-accounts-summary.tsx  # Banking overview
├── quick-actions.tsx     # Action buttons
├── alert-card.tsx        # Alert notifications
├── transaction-list.tsx  # Recent transactions
└── README.md            # This file
```

## Usage Example

```tsx
// In your page.tsx
import { FinanceDashboardContent } from "@/components/platform/finance/dashboard/content"

export default function FinanceDashboardPage() {
  return <FinanceDashboardContent />
}
```

## Performance Optimization
- Parallel data fetching for all metrics
- Lazy loading for charts
- Efficient decimal to number conversions
- Optimized database queries with indexes
- Client-side caching with SWR (if needed)

## Security Features
- School ID scoping for multi-tenancy
- Role-based data filtering
- Session validation
- Permission checks before operations
- Secure decimal handling for financial data

## Customization Options
- Date range selection (month, quarter, year)
- Chart type toggles
- KPI color themes
- Alert dismissal
- Quick action configuration

## Testing
```bash
# Run tests
pnpm test src/components/platform/finance/dashboard

# Test specific component
pnpm test src/components/platform/finance/dashboard/kpi-card.test.tsx
```

## Known Limitations
- Trends currently use mock data (should be calculated from historical data)
- Real-time updates require WebSocket implementation
- PDF export for dashboard snapshot not yet implemented
- Mobile responsive design needs optimization

## Future Enhancements
1. Real-time data updates with WebSockets
2. Customizable dashboard layouts
3. Export dashboard as PDF report
4. Advanced filtering options
5. Predictive analytics
6. Comparative analysis (YoY, MoM)
7. Drill-down capabilities on charts
8. Custom KPI configuration
9. Email scheduled reports
10. Mobile app dashboard view

## Dependencies
- `recharts` - Chart library
- `date-fns` - Date formatting
- `lucide-react` - Icons
- `@prisma/client` - Database ORM
- Custom UI components from shadcn/ui

## Support
For issues or questions, please contact the development team or create an issue in the repository.