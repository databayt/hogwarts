// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  Calendar,
  CircleAlert,
  CircleCheck,
  Clock,
  FileText,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  DashboardGrid,
  FeatureCard,
  StatsCard,
} from "../lib/dashboard-components"
import { checkCurrentUserPermission } from "../lib/permissions"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function TimesheetContent({ dictionary, lang }: Props) {
  const fc = (dictionary as any)?.finance?.common as
    | Record<string, string>
    | undefined
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <div>
        <p className="text-muted-foreground">
          {fc?.schoolNotFound || "School context not found"}
        </p>
      </div>
    )
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(
    schoolId,
    "timesheet",
    "view"
  )
  const canCreate = await checkCurrentUserPermission(
    schoolId,
    "timesheet",
    "create"
  )
  const canEdit = await checkCurrentUserPermission(
    schoolId,
    "timesheet",
    "edit"
  )
  const canApprove = await checkCurrentUserPermission(
    schoolId,
    "timesheet",
    "approve"
  )
  const canExport = await checkCurrentUserPermission(
    schoolId,
    "timesheet",
    "export"
  )

  // If user can't view timesheet, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">
          {fc?.noPermissionTimesheets ||
            "You don't have permission to view timesheets"}
        </p>
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
      ;[periodsCount, entriesCount, pendingEntriesCount, approvedEntriesCount] =
        await Promise.all([
          db.timesheetPeriod.count({ where: { schoolId, status: "OPEN" } }),
          db.timesheetEntry.count({ where: { schoolId } }),
          db.timesheetEntry.count({ where: { schoolId, status: "SUBMITTED" } }),
          db.timesheetEntry.count({ where: { schoolId, status: "APPROVED" } }),
        ])

      const hoursAgg = await db.timesheetEntry.aggregate({
        where: { schoolId, status: "APPROVED" },
        _sum: { hoursWorked: true },
      })
      totalHours = hoursAgg._sum?.hoursWorked
        ? Number(hoursAgg._sum.hoursWorked)
        : 0
    } catch (error) {
      console.error("Error fetching timesheet stats:", error)
    }
  }

  const d = dictionary?.finance?.timesheet
  const fd = (dictionary as any)?.finance
  const tp = fd?.timesheetPage as Record<string, string> | undefined
  const c = fd?.common as Record<string, string> | undefined

  return (
    <div className="space-y-6">
      {/* Stats Grid - Uses semantic HTML (h6, h2, small) */}
      <DashboardGrid type="stats">
        <StatsCard
          title={tp?.totalHours || "Total Hours"}
          value={totalHours.toLocaleString()}
          description={tp?.approvedHours || "Approved hours"}
          icon={Clock}
        />
        <StatsCard
          title={tp?.timesheetEntries || "Timesheet Entries"}
          value={entriesCount}
          description={`${approvedEntriesCount} ${fd?.approved || "approved"}`}
          icon={FileText}
        />
        <StatsCard
          title={c?.pendingApproval || "Pending Approval"}
          value={pendingEntriesCount}
          description={c?.requiresReview || "Requires review"}
          icon={CircleAlert}
        />
        <StatsCard
          title={tp?.activePeriods || "Active Periods"}
          value={periodsCount}
          description={tp?.configuredPeriods || "Configured periods"}
          icon={Calendar}
        />
      </DashboardGrid>

      {/* Feature Cards Grid */}
      <DashboardGrid type="features">
        {canEdit && (
          <FeatureCard
            title={tp?.timesheetPeriods || "Timesheet Periods"}
            description={
              tp?.defineManagePeriods || "Define and manage timesheet periods"
            }
            icon={Calendar}
            isPrimary
            primaryAction={{
              label: tp?.viewPeriods || "View Periods",
              href: `/${lang}/finance/timesheet/periods`,
              count: periodsCount,
            }}
          />
        )}
        <FeatureCard
          title={tp?.timeEntries || "Time Entries"}
          description={
            tp?.recordTrackHours || "Record and track staff working hours"
          }
          icon={Clock}
          primaryAction={{
            label: tp?.viewEntries || "View Entries",
            href: `/${lang}/finance/timesheet/entries`,
            count: entriesCount,
          }}
          secondaryAction={
            canCreate
              ? {
                  label: tp?.recordTime || "Record Time",
                  href: `/${lang}/finance/timesheet/entries/new`,
                }
              : undefined
          }
        />
      </DashboardGrid>
    </div>
  )
}
