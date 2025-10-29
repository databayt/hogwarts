import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Users,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function PayrollContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

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

  // @ts-expect-error - finance dictionary not yet added to type definitions
  const d = dictionary?.school?.finance?.payroll

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Payroll Processing'}
          description={
            d?.description ||
            'Process payroll runs, generate salary slips, and manage disbursements'
          }
          className="text-start max-w-none"
        />

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.monthlyPayroll || 'Current Month Payroll'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(monthlyPayroll / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.totalNet || 'Total net salaries'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.payrollRuns || 'Payroll Runs'}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRunsCount}</div>
              <p className="text-xs text-muted-foreground">
                {completedRunsCount} {d?.stats?.completed || 'completed'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.pendingApproval || 'Pending Approval'}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRunsCount}</div>
              <p className="text-xs text-muted-foreground">
                {pendingSlipsCount} {d?.stats?.slips || 'slips'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {d?.stats?.paidOut || 'Paid Out'}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidSlipsCount}</div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.salarySlips || 'Salary slips'} / {totalSlipsCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Sections */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Payroll Runs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {d?.sections?.runs || 'Payroll Runs'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.runsDesc ||
                  'Create and manage payroll processing runs'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/payroll/runs`}>
                  {d?.actions?.viewRuns || 'View Runs'} ({totalRunsCount})
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/payroll/runs/new`}>
                  {d?.actions?.createRun || 'Create New Run'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Salary Slips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {d?.sections?.slips || 'Salary Slips'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.slipsDesc ||
                  'View and manage individual salary slips'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/payroll/slips`}>
                  {d?.actions?.viewSlips || 'View Slips'} ({totalSlipsCount})
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/payroll/slips/pending`}>
                  {d?.actions?.reviewPending || 'Review Pending'} ({pendingSlipsCount})
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Process Payroll */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {d?.sections?.process || 'Process Payroll'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.processDesc ||
                  'Start new payroll processing for current period'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/payroll/process`}>
                  {d?.actions?.processPayroll || 'Process Payroll'}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/payroll/process/batch`}>
                  {d?.actions?.batchProcess || 'Batch Process'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Approval Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {d?.sections?.approval || 'Approval Queue'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.approvalDesc ||
                  'Review and approve pending payroll runs'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/payroll/approval`}>
                  {d?.actions?.approvalQueue || 'Approval Queue'} ({pendingRunsCount})
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/payroll/approval/history`}>
                  {d?.actions?.approvalHistory || 'Approval History'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Disbursement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {d?.sections?.disbursement || 'Disbursement'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.disbursementDesc ||
                  'Process salary payments and disbursements'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/payroll/disbursement`}>
                  {d?.actions?.disburse || 'Disburse Salaries'}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/payroll/disbursement/history`}>
                  {d?.actions?.disbursementHistory || 'Payment History'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {d?.sections?.settings || 'Payroll Settings'}
              </CardTitle>
              <CardDescription>
                {d?.sections?.settingsDesc ||
                  'Configure tax rates, deductions, and rules'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/payroll/settings`}>
                  {d?.actions?.settings || 'Payroll Settings'}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/payroll/settings/tax`}>
                  {d?.actions?.taxSettings || 'Tax Configuration'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{d?.quickActions?.title || 'Quick Actions'}</CardTitle>
            <CardDescription>
              {d?.quickActions?.description || 'Common payroll operations'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/finance/payroll/process/current-month`}>
                <Clock className="mr-2 h-4 w-4" />
                {d?.quickActions?.processMonth || 'Process Current Month'}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/finance/payroll/slips/generate`}>
                <FileText className="mr-2 h-4 w-4" />
                {d?.quickActions?.generateSlips || 'Generate Slips'}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/finance/payroll/reports/summary`}>
                {d?.quickActions?.payrollSummary || 'Payroll Summary'}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/finance/payroll/reports/tax`}>
                {d?.quickActions?.taxReport || 'Tax Report'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
