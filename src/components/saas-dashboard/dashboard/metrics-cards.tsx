// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { KpiCard } from "@/components/saas-dashboard/dashboard/card"
import { KPI_SUPPORTING } from "@/components/saas-dashboard/dashboard/config"

type Totals = {
  totalSchools: number
  activeSchools: number
  totalUsers: number
  totalStudents: number
}

// Delta badges previously fetched /operator/overview/metrics — a route that
// does not exist, so every badge silently rendered +0.0%. Until a real delta
// source exists the cards show the live totals without a fabricated trend.
export function MetricsCards({ totals }: { totals: Totals }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={KPI_SUPPORTING.totalSchools.label}
        value={totals.totalSchools}
        trend={KPI_SUPPORTING.totalSchools.trend}
        supportingText={KPI_SUPPORTING.totalSchools.supporting}
        footerHint={KPI_SUPPORTING.totalSchools.hint}
        container
      />

      <KpiCard
        title={KPI_SUPPORTING.activeSchools.label}
        value={totals.activeSchools}
        trend={KPI_SUPPORTING.activeSchools.trend}
        supportingText={KPI_SUPPORTING.activeSchools.supporting}
        footerHint={KPI_SUPPORTING.activeSchools.hint}
        container
      />

      <KpiCard
        title={KPI_SUPPORTING.totalUsers.label}
        value={totals.totalUsers}
        trend={KPI_SUPPORTING.totalUsers.trend}
        supportingText={KPI_SUPPORTING.totalUsers.supporting}
      />

      <KpiCard
        title={KPI_SUPPORTING.totalStudents.label}
        value={totals.totalStudents}
        trend={KPI_SUPPORTING.totalStudents.trend}
        supportingText={KPI_SUPPORTING.totalStudents.supporting}
        footerHint={KPI_SUPPORTING.totalStudents.hint}
        container
      />
    </div>
  )
}
