import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, Calendar, FileText, CheckCircle, AlertCircle, Clock, Settings } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { StatsCard, FeatureCard, DashboardGrid, formatCurrency } from '../lib/dashboard-components'
import { checkCurrentUserPermission } from '../lib/permissions'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function PayrollContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col gap-6">
          <PageHeader
            title="Payroll Processing"
            description="School context not found"
            className="text-start max-w-none"
          />
        </div>
      </PageContainer>
    )
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, 'payroll', 'view')
  const canCreate = await checkCurrentUserPermission(schoolId, 'payroll', 'create')
  const canProcess = await checkCurrentUserPermission(schoolId, 'payroll', 'process')
  const canApprove = await checkCurrentUserPermission(schoolId, 'payroll', 'approve')

  // If user can't view payroll, show empty state
  if (!canView) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col gap-6">
          <PageHeader
            title="Payroll Processing"
            description="You don't have permission to view payroll"
            className="text-start max-w-none"
          />
        </div>
      </PageContainer>
    )
  }

  // Get comprehensive payroll stats
  let totalRunsCount = 0
  let pendingRunsCount = 0
  let completedRunsCount = 0
  let totalSlipsCount = 0
  let pendingSlipsCount = 0
  let paidSlipsCount = 0
  let monthlyPayroll = 0

  if (schoolId) {
    try {
      ;[
        totalRunsCount,
        pendingRunsCount,
        completedRunsCount,
        totalSlipsCount,
        pendingSlipsCount,
        paidSlipsCount,
      ] = await Promise.all([
        db.payrollRun.count({ where: { schoolId } }),
        db.payrollRun.count({
          where: { schoolId, status: { in: ['DRAFT', 'PENDING_APPROVAL'] } },
        }),
        db.payrollRun.count({
          where: { schoolId, status: 'PAID' },
        }),
        db.salarySlip.count({ where: { schoolId } }),
        db.salarySlip.count({
          where: { schoolId, status: { in: ['GENERATED', 'REVIEWED'] } },
        }),
        db.salarySlip.count({
          where: { schoolId, status: 'PAID' },
        }),
      ])

      // Calculate current month payroll
      const currentMonthStart = new Date()
      currentMonthStart.setDate(1)
      currentMonthStart.setHours(0, 0, 0, 0)

      const payrollAgg = await db.salarySlip.aggregate({
        where: {
          schoolId,
          payPeriodStart: { gte: currentMonthStart },
        },
        _sum: { netSalary: true },
      })

      monthlyPayroll = payrollAgg._sum?.netSalary
        ? Number(payrollAgg._sum.netSalary)
        : 0
    } catch (error) {
      console.error('Error fetching payroll stats:', error)
    }
  }

  const d = dictionary?.finance?.payroll

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Payroll Processing'}
          description="Process payroll runs, generate salary slips, and manage disbursements"
          className="text-start max-w-none"
        />

        {/* Stats Grid - Uses semantic HTML (h6, h2, small) */}
        <DashboardGrid type="stats">
          <StatsCard
            title="Current Month Payroll"
            value={formatCurrency(monthlyPayroll)}
            description="Total net salaries"
            icon={DollarSign}
          />
          <StatsCard
            title="Payroll Runs"
            value={totalRunsCount}
            description={`${completedRunsCount} completed`}
            icon={Calendar}
          />
          <StatsCard
            title="Pending Approval"
            value={pendingRunsCount}
            description={`${pendingSlipsCount} slips`}
            icon={AlertCircle}
          />
          <StatsCard
            title="Paid Out"
            value={paidSlipsCount}
            description={`Salary slips / ${totalSlipsCount}`}
            icon={CheckCircle}
          />
        </DashboardGrid>

        {/* Feature Cards Grid */}
        <DashboardGrid type="features">
          <FeatureCard
            title="Payroll Runs"
            description="Create and manage payroll processing runs"
            icon={Calendar}
            isPrimary
            primaryAction={{
              label: 'View Runs',
              href: `/${lang}/finance/payroll/runs`,
              count: totalRunsCount
            }}
            secondaryAction={canCreate ? {
              label: 'Create New Run',
              href: `/${lang}/finance/payroll/runs/new`
            } : undefined}
          />
          <FeatureCard
            title="Salary Slips"
            description="View and manage individual salary slips"
            icon={FileText}
            primaryAction={{
              label: 'View Slips',
              href: `/${lang}/finance/payroll/slips`,
              count: totalSlipsCount
            }}
            secondaryAction={{
              label: `Review Pending (${pendingSlipsCount})`,
              href: `/${lang}/finance/payroll/slips/pending`
            }}
          />
          {canProcess && (
            <FeatureCard
              title="Process Payroll"
              description="Start new payroll processing for current period"
              icon={Users}
              primaryAction={{
                label: 'Process Payroll',
                href: `/${lang}/finance/payroll/process`
              }}
              secondaryAction={{
                label: 'Batch Process',
                href: `/${lang}/finance/payroll/process/batch`
              }}
            />
          )}
          {canApprove && (
            <FeatureCard
              title="Approval Queue"
              description="Review and approve pending payroll runs"
              icon={CheckCircle}
              primaryAction={{
                label: `Approval Queue (${pendingRunsCount})`,
                href: `/${lang}/finance/payroll/approval`
              }}
              secondaryAction={{
                label: 'Approval History',
                href: `/${lang}/finance/payroll/approval/history`
              }}
            />
          )}
          {canProcess && (
            <FeatureCard
              title="Disbursement"
              description="Process salary payments and disbursements"
              icon={DollarSign}
              primaryAction={{
                label: 'Disburse Salaries',
                href: `/${lang}/finance/payroll/disbursement`
              }}
              secondaryAction={{
                label: 'Payment History',
                href: `/${lang}/finance/payroll/disbursement/history`
              }}
            />
          )}
          <FeatureCard
            title="Payroll Settings"
            description="Configure tax rates, deductions, and rules"
            icon={Settings}
            primaryAction={{
              label: 'Payroll Settings',
              href: `/${lang}/finance/payroll/settings`
            }}
            secondaryAction={{
              label: 'Tax Configuration',
              href: `/${lang}/finance/payroll/settings/tax`
            }}
          />
        </DashboardGrid>

        {/* Quick Actions */}
        {canProcess && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common payroll operations
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${lang}/finance/payroll/process/current-month`}>
                  <Clock className="mr-2 h-4 w-4" />
                  Process Current Month
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${lang}/finance/payroll/slips/generate`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Slips
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${lang}/finance/payroll/reports/summary`}>
                  Payroll Summary
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${lang}/finance/payroll/reports/tax`}>
                  Tax Report
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
