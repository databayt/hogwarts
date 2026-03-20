## Dashboard -- Financial Overview

### Overview

Aggregated financial dashboard with KPI cards, interactive charts (revenue, expenses, cash flow), smart alerts, quick actions, and recent transaction feed. Provides role-scoped views for different user types.

### Capabilities by Role

- **Admin/Accountant**: Full dashboard -- all KPIs, charts, quick actions, transaction history
- **Teacher/Staff**: Limited KPIs (salary, basic metrics), expense submission
- **Student/Guardian**: Fee payment status, outstanding balances, payment actions

### Routes

| Route                   | Page                | Status |
| ----------------------- | ------------------- | ------ |
| `.../finance/dashboard` | Financial dashboard | Ready  |

### File Structure

```
dashboard/
├── actions.ts                # Data fetching server actions
├── types.ts                  # Dashboard metric types
├── content.tsx               # Main dashboard composition
├── kpi-card.tsx              # KPI display cards
├── revenue-chart.tsx         # Revenue/expense trend chart
├── expense-chart.tsx         # Expense breakdown (pie/bar)
├── cash-flow-chart.tsx       # Cash inflow/outflow chart
├── bank-accounts-summary.tsx # Bank account balances
├── quick-actions.tsx         # Action buttons (create invoice, record payment, etc.)
├── alert-card.tsx            # Smart alert notifications
└── transaction-list.tsx      # Recent transactions feed
```

### Status

**Completion:** 80% | **Blockers:** Trend data uses mock calculations; real-time WebSocket updates not implemented; mobile layout needs optimization

### Integration Points

- Pulls aggregated data from invoice, fees, expenses, payroll, banking, budget, wallet models
- Quick actions link to sibling sub-block routes
- See [finance master README](../README.md) for architecture details
