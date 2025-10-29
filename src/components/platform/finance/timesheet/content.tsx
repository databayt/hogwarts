import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Calendar, Users, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function TimesheetContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  let periodsCount = 0
  let entriesCount = 0
  let pendingEntriesCount = 0
  let approvedEntriesCount = 0
  let totalHours = 0

  if (schoolId) {
    try {
      ;[periodsCount, entriesCount, pendingEntriesCount, approvedEntriesCount] = await Promise.all([
        db.timesheetPeriod.count({ where: { schoolId, status: 'OPEN' } }),
        db.timesheetEntry.count({ where: { schoolId } }),
        db.timesheetEntry.count({ where: { schoolId, status: 'SUBMITTED' } }),
        db.timesheetEntry.count({ where: { schoolId, status: 'APPROVED' } }),
      ])

      const hoursAgg = await db.timesheetEntry.aggregate({
        where: { schoolId, status: 'APPROVED' },
        _sum: { hoursWorked: true },
      })
      totalHours = hoursAgg._sum?.hoursWorked
        ? Number(hoursAgg._sum.hoursWorked)
        : 0
    } catch (error) {
      console.error('Error fetching timesheet stats:', error)
    }
  }

  // @ts-expect-error - finance dictionary not yet added to type definitions
  const d = dictionary?.school?.finance?.timesheet

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Timesheet Management'}
          description={d?.description || 'Track staff hours, approve timesheets, and integrate with payroll'}
          className="text-start max-w-none"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.totalHours || 'Total Hours'}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.approved || 'Approved hours'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.entries || 'Timesheet Entries'}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entriesCount}</div>
              <p className="text-xs text-muted-foreground">{approvedEntriesCount} {d?.stats?.approved || 'approved'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.pending || 'Pending Approval'}</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingEntriesCount}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.requiresReview || 'Requires review'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.periods || 'Active Periods'}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{periodsCount}</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.configured || 'Configured periods'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {d?.sections?.periods || 'Timesheet Periods'}
              </CardTitle>
              <CardDescription>{d?.sections?.periodsDesc || 'Define and manage timesheet periods'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/timesheet/periods`}>{d?.actions?.viewPeriods || 'View Periods'} ({periodsCount})</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/timesheet/periods/new`}>{d?.actions?.createPeriod || 'Create Period'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {d?.sections?.entries || 'Time Entries'}
              </CardTitle>
              <CardDescription>{d?.sections?.entriesDesc || 'Record and track staff working hours'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/timesheet/entries`}>{d?.actions?.viewEntries || 'View Entries'} ({entriesCount})</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/timesheet/entries/new`}>{d?.actions?.recordTime || 'Record Time'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                {d?.sections?.approval || 'Approval Queue'}
              </CardTitle>
              <CardDescription>{d?.sections?.approvalDesc || 'Review and approve timesheet entries'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/timesheet/approve`}>{d?.actions?.approveEntries || 'Approve Entries'} ({pendingEntriesCount})</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/timesheet/approve/bulk`}>{d?.actions?.bulkApprove || 'Bulk Approve'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {d?.sections?.staff || 'Staff Timesheets'}
              </CardTitle>
              <CardDescription>{d?.sections?.staffDesc || 'View timesheets by staff member'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/timesheet/staff`}>{d?.actions?.viewByStaff || 'View By Staff'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/timesheet/staff/summary`}>{d?.actions?.staffSummary || 'Staff Summary'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {d?.sections?.reports || 'Timesheet Reports'}
              </CardTitle>
              <CardDescription>{d?.sections?.reportsDesc || 'Generate timesheet reports and analytics'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/timesheet/reports`}>{d?.actions?.viewReports || 'View Reports'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/timesheet/reports/hours`}>{d?.actions?.hoursReport || 'Hours Report'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {d?.sections?.calendar || 'Calendar View'}
              </CardTitle>
              <CardDescription>{d?.sections?.calendarDesc || 'Visual calendar of timesheet entries'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/${lang}/finance/timesheet/calendar`}>{d?.actions?.calendar || 'View Calendar'}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="sm">
                <Link href={`/${lang}/finance/timesheet/calendar/month`}>{d?.actions?.monthView || 'Month View'}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
