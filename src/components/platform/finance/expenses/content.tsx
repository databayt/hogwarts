import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { TrendingUp, Receipt, CheckCircle, AlertCircle, DollarSign, FolderOpen } from 'lucide-react'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { StatsCard, FeatureCard, DashboardGrid, formatCurrency } from '../lib/dashboard-components'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ExpensesContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  let categoriesCount = 0
  let expensesCount = 0
  let pendingExpensesCount = 0
  let approvedExpensesCount = 0
  let totalExpenses = 0

  if (schoolId) {
    try {
      ;[categoriesCount, expensesCount, pendingExpensesCount, approvedExpensesCount] = await Promise.all([
        db.expenseCategory.count({ where: { schoolId } }),
        db.expense.count({ where: { schoolId } }),
        db.expense.count({ where: { schoolId, status: 'PENDING' } }),
        db.expense.count({ where: { schoolId, status: 'APPROVED' } }),
      ])

      const expensesAgg = await db.expense.aggregate({
        where: { schoolId, status: 'APPROVED' },
        _sum: { amount: true },
      })

      totalExpenses = expensesAgg._sum?.amount ? Number(expensesAgg._sum.amount) : 0
    } catch (error) {
      console.error('Error fetching expense stats:', error)
    }
  }

  const d = dictionary?.finance?.expenses

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Expense Management'}
          description={d?.description || 'Submit expenses, manage approval workflow, and track reimbursements'}
          className="text-start max-w-none"
        />

        <DashboardGrid type="stats">
          <StatsCard
            title={d?.stats?.totalExpenses || 'Total Expenses'}
            value={formatCurrency(totalExpenses)}
            description={d?.stats?.approved || 'Approved expenses'}
            icon={DollarSign}
          />
          <StatsCard
            title={d?.stats?.pending || 'Pending'}
            value={pendingExpensesCount}
            description={d?.stats?.awaitingApproval || 'Awaiting approval'}
            icon={AlertCircle}
          />
          <StatsCard
            title={d?.stats?.allExpenses || 'All Expenses'}
            value={expensesCount}
            description={d?.stats?.totalSubmitted || 'Total submitted'}
            icon={Receipt}
          />
          <StatsCard
            title={d?.stats?.categories || 'Categories'}
            value={categoriesCount}
            description={d?.stats?.expenseTypes || 'Expense types'}
            icon={FolderOpen}
          />
        </DashboardGrid>

        <DashboardGrid type="features">
          <FeatureCard
            title={d?.sections?.expenses || 'All Expenses'}
            description={d?.sections?.expensesDesc || 'View and manage expense submissions'}
            icon={Receipt}
            isPrimary
            primaryAction={{
              label: d?.actions?.viewExpenses || 'View Expenses',
              href: `/${lang}/finance/expenses/all`,
              count: expensesCount
            }}
            secondaryAction={{
              label: d?.actions?.submit || 'Submit Expense',
              href: `/${lang}/finance/expenses/new`
            }}
          />
          <FeatureCard
            title={d?.sections?.approval || 'Approval Workflow'}
            description={d?.sections?.approvalDesc || 'Review and approve expense requests'}
            icon={CheckCircle}
            primaryAction={{
              label: d?.actions?.pending || 'Pending Approval',
              href: `/${lang}/finance/expenses/approval`,
              count: pendingExpensesCount
            }}
            secondaryAction={{
              label: d?.actions?.approved || 'Approved',
              href: `/${lang}/finance/expenses/approved`
            }}
          />
          <FeatureCard
            title={d?.sections?.categories || 'Expense Categories'}
            description={d?.sections?.categoriesDesc || 'Manage expense categories and types'}
            icon={FolderOpen}
            primaryAction={{
              label: d?.actions?.viewCategories || 'View Categories',
              href: `/${lang}/finance/expenses/categories`
            }}
            secondaryAction={{
              label: d?.actions?.createCategory || 'Create Category',
              href: `/${lang}/finance/expenses/categories/new`
            }}
          />
          <FeatureCard
            title={d?.sections?.reimbursement || 'Reimbursements'}
            description={d?.sections?.reimbursementDesc || 'Process expense reimbursements'}
            icon={DollarSign}
            primaryAction={{
              label: d?.actions?.processReimbursement || 'Process',
              href: `/${lang}/finance/expenses/reimbursement`
            }}
            secondaryAction={{
              label: d?.actions?.history || 'History',
              href: `/${lang}/finance/expenses/reimbursement/history`
            }}
          />
          <FeatureCard
            title={d?.sections?.reports || 'Expense Reports'}
            description={d?.sections?.reportsDesc || 'Generate expense analysis reports'}
            icon={TrendingUp}
            primaryAction={{
              label: d?.actions?.reports || 'View Reports',
              href: `/${lang}/finance/expenses/reports`
            }}
            secondaryAction={{
              label: d?.actions?.export || 'Export',
              href: `/${lang}/finance/expenses/reports/export`
            }}
          />
        </DashboardGrid>
      </div>
    </PageContainer>
  )
}
