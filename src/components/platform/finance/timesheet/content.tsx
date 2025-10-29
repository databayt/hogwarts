import { Shell as PageContainer } from '@/components/table/shell'
import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Clock, Calendar, Users, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { StatsCard, FeatureCard, DashboardGrid } from '../lib/dashboard-components'

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

  const d = dictionary?.finance?.timesheet

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={d?.title || 'Timesheet Management'}
          description={d?.description || 'Track staff hours, approve timesheets, and integrate with payroll'}
          className="text-start max-w-none"
        />

        {/* Stats Grid - Uses semantic HTML (h6, h2, small) */}
        <DashboardGrid type="stats">
          <StatsCard
            title={d?.totalHours || 'Total Hours'}
            value={totalHours.toLocaleString()}
            description={d?.approvedHours || 'Approved hours'}
            icon={Clock}
          />
          <StatsCard
            title={d?.entries || 'Timesheet Entries'}
            value={entriesCount}
            description={`${approvedEntriesCount} ${d?.approved || 'approved'}`}
            icon={FileText}
          />
          <StatsCard
            title={d?.pendingApproval || 'Pending Approval'}
            value={pendingEntriesCount}
            description={d?.requiresReview || 'Requires review'}
            icon={AlertCircle}
          />
          <StatsCard
            title={d?.period || 'Active Periods'}
            value={periodsCount}
            description="Configured periods"
            icon={Calendar}
          />
        </DashboardGrid>

        {/* Feature Cards Grid */}
        <DashboardGrid type="features">
          <FeatureCard
            title={d?.timesheets || 'Timesheet Periods'}
            description="Define and manage timesheet periods"
            icon={Calendar}
            isPrimary
            primaryAction={{
              label: d?.viewTimesheet || 'View Periods',
              href: `/${lang}/finance/timesheet/periods`,
              count: periodsCount
            }}
            secondaryAction={{
              label: d?.createTimesheet || 'Create Period',
              href: `/${lang}/finance/timesheet/periods/new`
            }}
          />
          <FeatureCard
            title={d?.entries || 'Time Entries'}
            description="Record and track staff working hours"
            icon={Clock}
            primaryAction={{
              label: 'View Entries',
              href: `/${lang}/finance/timesheet/entries`,
              count: entriesCount
            }}
            secondaryAction={{
              label: 'Record Time',
              href: `/${lang}/finance/timesheet/entries/new`
            }}
          />
          <FeatureCard
            title={d?.approveTimesheet || 'Approval Queue'}
            description="Review and approve timesheet entries"
            icon={CheckCircle}
            primaryAction={{
              label: 'Approve Entries',
              href: `/${lang}/finance/timesheet/approve`,
              count: pendingEntriesCount
            }}
            secondaryAction={{
              label: 'Bulk Approve',
              href: `/${lang}/finance/timesheet/approve/bulk`
            }}
          />
          <FeatureCard
            title="Staff Timesheets"
            description="View timesheets by staff member"
            icon={Users}
            primaryAction={{
              label: 'View By Staff',
              href: `/${lang}/finance/timesheet/staff`
            }}
            secondaryAction={{
              label: 'Staff Summary',
              href: `/${lang}/finance/timesheet/staff/summary`
            }}
          />
          <FeatureCard
            title="Timesheet Reports"
            description="Generate timesheet reports and analytics"
            icon={FileText}
            primaryAction={{
              label: 'View Reports',
              href: `/${lang}/finance/timesheet/reports`
            }}
            secondaryAction={{
              label: 'Hours Report',
              href: `/${lang}/finance/timesheet/reports/hours`
            }}
          />
          <FeatureCard
            title="Calendar View"
            description="Visual calendar of timesheet entries"
            icon={Calendar}
            primaryAction={{
              label: 'View Calendar',
              href: `/${lang}/finance/timesheet/calendar`
            }}
            secondaryAction={{
              label: 'Month View',
              href: `/${lang}/finance/timesheet/calendar/month`
            }}
          />
        </DashboardGrid>
      </div>
    </PageContainer>
  )
}
