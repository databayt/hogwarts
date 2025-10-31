import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { TrendingUp, Receipt, CheckCircle, AlertCircle, DollarSign, FolderOpen } from 'lucide-react'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { StatsCard, FeatureCard, DashboardGrid, formatCurrency } from '../lib/dashboard-components'
import { checkCurrentUserPermission } from '../lib/permissions'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ExpensesContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <div>
        <p className="text-muted-foreground">School context not found</p>
      </div>
    )
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, 'expenses', 'view')
  const canCreate = await checkCurrentUserPermission(schoolId, 'expenses', 'create')
  const canEdit = await checkCurrentUserPermission(schoolId, 'expenses', 'edit')
  const canApprove = await checkCurrentUserPermission(schoolId, 'expenses', 'approve')
  const canExport = await checkCurrentUserPermission(schoolId, 'expenses', 'export')

  // If user can't view expenses, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">You don't have permission to view expenses</p>
      </div>
    )
  }

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
    <div className="space-y-6">
      <DashboardGrid type="stats">
          <StatsCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            description="Approved expenses"
            icon={DollarSign}
          />
          <StatsCard
            title="Pending"
            value={pendingExpensesCount}
            description="Awaiting approval"
            icon={AlertCircle}
          />
          <StatsCard
            title="All Expenses"
            value={expensesCount}
            description="Total submitted"
            icon={Receipt}
          />
          <StatsCard
            title="Categories"
            value={categoriesCount}
            description="Expense types"
            icon={FolderOpen}
          />
        </DashboardGrid>

        <DashboardGrid type="features">
          <FeatureCard
            title="All Expenses"
            description="View and manage expense submissions"
            icon={Receipt}
            isPrimary
            primaryAction={{
              label: 'View Expenses',
              href: `/${lang}/finance/expenses/all`,
              count: expensesCount
            }}
            secondaryAction={canCreate ? {
              label: 'Submit Expense',
              href: `/${lang}/finance/expenses/new`
            } : undefined}
          />
          {canApprove && (
            <FeatureCard
              title="Approval Workflow"
              description="Review and approve expense requests"
              icon={CheckCircle}
              primaryAction={{
                label: 'Pending Approval',
                href: `/${lang}/finance/expenses/approval`,
                count: pendingExpensesCount
              }}
              secondaryAction={{
                label: 'Approved',
                href: `/${lang}/finance/expenses/approved`
              }}
            />
          )}
          {canEdit && (
            <FeatureCard
              title="Expense Categories"
              description="Manage expense categories and types"
              icon={FolderOpen}
              primaryAction={{
                label: 'View Categories',
                href: `/${lang}/finance/expenses/categories`
              }}
              secondaryAction={canCreate ? {
                label: 'Create Category',
                href: `/${lang}/finance/expenses/categories/new`
              } : undefined}
            />
          )}
          {canApprove && (
            <FeatureCard
              title="Reimbursements"
              description="Process expense reimbursements"
              icon={DollarSign}
              primaryAction={{
                label: 'Process',
                href: `/${lang}/finance/expenses/reimbursement`
              }}
              secondaryAction={{
                label: 'History',
                href: `/${lang}/finance/expenses/reimbursement/history`
              }}
            />
          )}
          {canExport && (
            <FeatureCard
              title="Expense Reports"
              description="Generate expense analysis reports"
              icon={TrendingUp}
              primaryAction={{
                label: 'View Reports',
                href: `/${lang}/finance/expenses/reports`
              }}
              secondaryAction={{
                label: 'Export',
                href: `/${lang}/finance/expenses/reports/export`
              }}
            />
          )}
        </DashboardGrid>
    </div>
  )
}
