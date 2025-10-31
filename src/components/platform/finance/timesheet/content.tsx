import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Clock, Calendar, Users, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { StatsCard, FeatureCard, DashboardGrid } from '../lib/dashboard-components'
import { checkCurrentUserPermission } from '../lib/permissions'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function TimesheetContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <div>
        <p className="text-muted-foreground">School context not found</p>
      </div>
    )
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, 'timesheet', 'view')
  const canCreate = await checkCurrentUserPermission(schoolId, 'timesheet', 'create')
  const canEdit = await checkCurrentUserPermission(schoolId, 'timesheet', 'edit')
  const canApprove = await checkCurrentUserPermission(schoolId, 'timesheet', 'approve')
  const canExport = await checkCurrentUserPermission(schoolId, 'timesheet', 'export')

  // If user can't view timesheet, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">You don't have permission to view timesheets</p>
      </div>
    )
  }

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
    <div className="space-y-6">
      {/* Stats Grid - Uses semantic HTML (h6, h2, small) */}
      <DashboardGrid type="stats">
          <StatsCard
            title="Total Hours"
            value={totalHours.toLocaleString()}
            description="Approved hours"
            icon={Clock}
          />
          <StatsCard
            title="Timesheet Entries"
            value={entriesCount}
            description={`${approvedEntriesCount} approved`}
            icon={FileText}
          />
          <StatsCard
            title="Pending Approval"
            value={pendingEntriesCount}
            description="Requires review"
            icon={AlertCircle}
          />
          <StatsCard
            title="Active Periods"
            value={periodsCount}
            description="Configured periods"
            icon={Calendar}
          />
        </DashboardGrid>

        {/* Feature Cards Grid */}
        <DashboardGrid type="features">
          {canEdit && (
            <FeatureCard
              title="Timesheet Periods"
              description="Define and manage timesheet periods"
              icon={Calendar}
              isPrimary
              primaryAction={{
                label: 'View Periods',
                href: `/${lang}/finance/timesheet/periods`,
                count: periodsCount
              }}
              secondaryAction={canCreate ? {
                label: 'Create Period',
                href: `/${lang}/finance/timesheet/periods/new`
              } : undefined}
            />
          )}
          <FeatureCard
            title="Time Entries"
            description="Record and track staff working hours"
            icon={Clock}
            primaryAction={{
              label: 'View Entries',
              href: `/${lang}/finance/timesheet/entries`,
              count: entriesCount
            }}
            secondaryAction={canCreate ? {
              label: 'Record Time',
              href: `/${lang}/finance/timesheet/entries/new`
            } : undefined}
          />
          {canApprove && (
            <FeatureCard
              title="Approval Queue"
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
          )}
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
          {canExport && (
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
          )}
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
    </div>
  )
}
