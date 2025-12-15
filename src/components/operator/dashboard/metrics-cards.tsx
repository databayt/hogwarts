"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { KpiCard } from "@/components/operator/dashboard/card"
import { KPI_SUPPORTING } from "@/components/operator/dashboard/config"

type Totals = {
  totalSchools: number
  activeSchools: number
  totalUsers: number
  totalStudents: number
}

export function MetricsCards({ totals }: { totals: Totals }) {
  const sp = useSearchParams()
  const period = sp.get("period") ?? "7d"
  const [deltas, setDeltas] = React.useState<{
    schools: number
    users: number
    students: number
  } | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      try {
        const res = await fetch(`/operator/overview/metrics?period=${period}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!res.ok) return
        const json = await res.json()
        setDeltas(json.deltas ?? null)
      } catch {
        // ignore
      }
    }
    void run()
    return () => controller.abort()
  }, [period])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={KPI_SUPPORTING.totalSchools.label}
        value={totals.totalSchools}
        delta={deltas?.schools}
        trend={KPI_SUPPORTING.totalSchools.trend}
        supportingText={KPI_SUPPORTING.totalSchools.supporting}
        footerHint={KPI_SUPPORTING.totalSchools.hint}
        container
      />

      <KpiCard
        title={KPI_SUPPORTING.activeSchools.label}
        value={totals.activeSchools}
        delta={deltas?.schools}
        trend={KPI_SUPPORTING.activeSchools.trend}
        supportingText={KPI_SUPPORTING.activeSchools.supporting}
        footerHint={KPI_SUPPORTING.activeSchools.hint}
        container
      />

      <KpiCard
        title={KPI_SUPPORTING.totalUsers.label}
        value={totals.totalUsers}
        delta={deltas?.users}
        trend={KPI_SUPPORTING.totalUsers.trend}
        supportingText={KPI_SUPPORTING.totalUsers.supporting}
        footerHint={KPI_SUPPORTING.totalUsers.hint}
      />

      <KpiCard
        title={KPI_SUPPORTING.totalStudents.label}
        value={totals.totalStudents}
        delta={deltas?.students}
        trend={KPI_SUPPORTING.totalStudents.trend}
        supportingText={KPI_SUPPORTING.totalStudents.supporting}
        footerHint={KPI_SUPPORTING.totalStudents.hint}
        container
      />
    </div>
  )
}
