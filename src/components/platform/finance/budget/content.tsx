import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { PieChart, TrendingUp, AlertTriangle, CheckCircle, DollarSign, BarChart } from 'lucide-react'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { StatsCard, FeatureCard, DashboardGrid, formatCurrency, formatPercentage } from '../lib/dashboard-components'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function BudgetContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

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
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Budget Planning'}
          description={d?.description || 'Create budgets, allocate funds, and track spending variance'}
          className="text-start max-w-none"
        />

        {/* Stats Grid - Uses semantic HTML (h6, h2, small) */}
        <DashboardGrid type="stats">
          <StatsCard
            title={d?.stats?.totalBudget || 'Total Budget'}
            value={formatCurrency(totalBudget)}
            description={d?.stats?.allocated || 'Allocated budget'}
            icon={DollarSign}
          />
          <StatsCard
            title={d?.stats?.spent || 'Spent'}
            value={formatCurrency(totalSpent)}
            description={`${formatPercentage(utilizationRate)} ${d?.stats?.utilization || 'utilization'}`}
            icon={TrendingUp}
          />
          <StatsCard
            title={d?.stats?.remaining || 'Remaining'}
            value={formatCurrency(variance)}
            description={d?.stats?.available || 'Available budget'}
            icon={CheckCircle}
          />
          <StatsCard
            title={d?.stats?.allocations || 'Allocations'}
            value={allocationsCount}
            description={`${budgetsCount} ${d?.stats?.active || 'active budgets'}`}
            icon={PieChart}
          />
        </DashboardGrid>

        {/* Feature Cards Grid */}
        <DashboardGrid type="features">
          <FeatureCard
            title={d?.sections?.budgets || 'Budgets'}
            description={d?.sections?.budgetsDesc || 'Create and manage school budgets'}
            icon={PieChart}
            isPrimary
            primaryAction={{
              label: d?.actions?.viewBudgets || 'View Budgets',
              href: `/${lang}/finance/budget/all`,
              count: budgetsCount
            }}
            secondaryAction={{
              label: d?.actions?.createBudget || 'Create Budget',
              href: `/${lang}/finance/budget/new`
            }}
          />
          <FeatureCard
            title={d?.sections?.allocations || 'Budget Allocations'}
            description={d?.sections?.allocationsDesc || 'Allocate budget by department or category'}
            icon={DollarSign}
            primaryAction={{
              label: d?.actions?.viewAllocations || 'View Allocations',
              href: `/${lang}/finance/budget/allocations`
            }}
            secondaryAction={{
              label: d?.actions?.allocate || 'Allocate Funds',
              href: `/${lang}/finance/budget/allocations/new`
            }}
          />
          <FeatureCard
            title={d?.sections?.tracking || 'Spending Tracking'}
            description={d?.sections?.trackingDesc || 'Monitor budget utilization and spending'}
            icon={TrendingUp}
            primaryAction={{
              label: d?.actions?.trackSpending || 'Track Spending',
              href: `/${lang}/finance/budget/tracking`
            }}
            secondaryAction={{
              label: d?.actions?.realtime || 'Real-time View',
              href: `/${lang}/finance/budget/tracking/realtime`
            }}
          />
          <FeatureCard
            title={d?.sections?.variance || 'Variance Analysis'}
            description={d?.sections?.varianceDesc || 'Analyze budget vs actual spending'}
            icon={AlertTriangle}
            primaryAction={{
              label: d?.actions?.variance || 'Variance Report',
              href: `/${lang}/finance/budget/variance`
            }}
            secondaryAction={{
              label: d?.actions?.alerts || 'Budget Alerts',
              href: `/${lang}/finance/budget/variance/alerts`
            }}
          />
          <FeatureCard
            title={d?.sections?.reports || 'Budget Reports'}
            description={d?.sections?.reportsDesc || 'Generate budget analysis reports'}
            icon={BarChart}
            primaryAction={{
              label: d?.actions?.viewReports || 'View Reports',
              href: `/${lang}/finance/budget/reports`
            }}
            secondaryAction={{
              label: d?.actions?.summary || 'Budget Summary',
              href: `/${lang}/finance/budget/reports/summary`
            }}
          />
          <FeatureCard
            title={d?.sections?.approval || 'Budget Approval'}
            description={d?.sections?.approvalDesc || 'Review and approve budget requests'}
            icon={CheckCircle}
            primaryAction={{
              label: d?.actions?.pending || 'Pending Approval',
              href: `/${lang}/finance/budget/approval`
            }}
            secondaryAction={{
              label: d?.actions?.history || 'Approval History',
              href: `/${lang}/finance/budget/approval/history`
            }}
          />
        </DashboardGrid>
      </div>
    </PageContainer>
  )
}
