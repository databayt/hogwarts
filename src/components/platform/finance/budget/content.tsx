import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { PieChart, TrendingUp, AlertTriangle, CheckCircle, DollarSign, BarChart } from 'lucide-react'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { StatsCard, FeatureCard, DashboardGrid, formatCurrency, formatPercentage } from '../lib/dashboard-components'
import { checkCurrentUserPermission } from '../lib/permissions'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function BudgetContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <div>
        <p className="text-muted-foreground">School context not found</p>
      </div>
    )
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, 'budget', 'view')
  const canCreate = await checkCurrentUserPermission(schoolId, 'budget', 'create')
  const canEdit = await checkCurrentUserPermission(schoolId, 'budget', 'edit')
  const canApprove = await checkCurrentUserPermission(schoolId, 'budget', 'approve')
  const canExport = await checkCurrentUserPermission(schoolId, 'budget', 'export')

  // If user can't view budget, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">You don't have permission to view budget</p>
      </div>
    )
  }

  let budgetsCount = 0
  let allocationsCount = 0
  let totalBudget = 0
  let totalSpent = 0

  if (schoolId) {
    try {
      ;[budgetsCount, allocationsCount] = await Promise.all([
        db.budget.count({ where: { schoolId, status: 'ACTIVE' } }),
        db.budgetAllocation.count({ where: { schoolId } }),
      ])

      const [budgetAgg, spentAgg] = await Promise.all([
        db.budget.aggregate({
          where: { schoolId, status: 'ACTIVE' },
          _sum: { totalAmount: true },
        }),
        db.budgetAllocation.aggregate({
          where: { schoolId },
          _sum: { spent: true },
        }),
      ])

      totalBudget = budgetAgg._sum?.totalAmount
        ? Number(budgetAgg._sum.totalAmount)
        : 0
      totalSpent = spentAgg._sum?.spent ? Number(spentAgg._sum.spent) : 0
    } catch (error) {
      console.error('Error fetching budget stats:', error)
    }
  }

  const variance = totalBudget - totalSpent
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const d = dictionary?.finance?.budget

  return (
    <>
      {/* Stats Grid - Uses semantic HTML (h6, h2, small) */}
        <DashboardGrid type="stats">
          <StatsCard
            title="Total Budget"
            value={formatCurrency(totalBudget)}
            description="Allocated budget"
            icon={DollarSign}
          />
          <StatsCard
            title="Spent"
            value={formatCurrency(totalSpent)}
            description={`${formatPercentage(utilizationRate)} utilization`}
            icon={TrendingUp}
          />
          <StatsCard
            title="Remaining"
            value={formatCurrency(variance)}
            description="Available budget"
            icon={CheckCircle}
          />
          <StatsCard
            title="Allocations"
            value={allocationsCount}
            description={`${budgetsCount} active budgets`}
            icon={PieChart}
          />
        </DashboardGrid>

        {/* Feature Cards Grid */}
        <DashboardGrid type="features">
          <FeatureCard
            title="Budgets"
            description="Create and manage school budgets"
            icon={PieChart}
            isPrimary
            primaryAction={{
              label: 'View Budgets',
              href: `/${lang}/finance/budget/all`,
              count: budgetsCount
            }}
            secondaryAction={canCreate ? {
              label: 'Create Budget',
              href: `/${lang}/finance/budget/new`
            } : undefined}
          />
          {canEdit && (
            <FeatureCard
              title="Budget Allocations"
              description="Allocate budget by department or category"
              icon={DollarSign}
              primaryAction={{
                label: 'View Allocations',
                href: `/${lang}/finance/budget/allocations`
              }}
              secondaryAction={canCreate ? {
                label: 'Allocate Funds',
                href: `/${lang}/finance/budget/allocations/new`
              } : undefined}
            />
          )}
          <FeatureCard
            title="Spending Tracking"
            description="Monitor budget utilization and spending"
            icon={TrendingUp}
            primaryAction={{
              label: 'Track Spending',
              href: `/${lang}/finance/budget/tracking`
            }}
            secondaryAction={{
              label: 'Real-time View',
              href: `/${lang}/finance/budget/tracking/realtime`
            }}
          />
          {canExport && (
            <FeatureCard
              title="Variance Analysis"
              description="Analyze budget vs actual spending"
              icon={AlertTriangle}
              primaryAction={{
                label: 'Variance Report',
                href: `/${lang}/finance/budget/variance`
              }}
              secondaryAction={{
                label: 'Budget Alerts',
                href: `/${lang}/finance/budget/variance/alerts`
              }}
            />
          )}
          {canExport && (
            <FeatureCard
              title="Budget Reports"
              description="Generate budget analysis reports"
              icon={BarChart}
              primaryAction={{
                label: 'View Reports',
                href: `/${lang}/finance/budget/reports`
              }}
              secondaryAction={{
                label: 'Budget Summary',
                href: `/${lang}/finance/budget/reports/summary`
              }}
            />
          )}
          {canApprove && (
            <FeatureCard
              title="Budget Approval"
              description="Review and approve budget requests"
              icon={CheckCircle}
              primaryAction={{
                label: 'Pending Approval',
                href: `/${lang}/finance/budget/approval`
              }}
              secondaryAction={{
                label: 'Approval History',
                href: `/${lang}/finance/budget/approval/history`
              }}
            />
          )}
        </DashboardGrid>
    </>
  )
}
