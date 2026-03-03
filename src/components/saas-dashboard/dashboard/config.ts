// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/* eslint-disable @typescript-eslint/no-explicit-any */

export function getKpiSupporting(dictionary?: any) {
  const k = dictionary?.operator?.dashboard?.kpis
  return {
    totalSchools: {
      label: k?.schools || "Schools",
      supporting: k?.allProvisionedSchools || "All provisioned schools",
      trend: "up" as const,
      hint: "Operator-only aggregate metric",
    },
    activeSchools: {
      label: k?.active || "Active",
      supporting: k?.activeSubscriptions || "Active subscriptions",
      trend: "down" as const,
      hint: "Toggle by plan in future",
    },
    totalUsers: {
      label: k?.users || "Users",
      supporting: k?.acrossAllSchools || "Across all schools",
      trend: "up" as const,
      hint: "Includes all roles",
    },
    totalStudents: {
      label: k?.students || "Students",
      supporting: k?.studentAccounts || "Student accounts",
      trend: "up" as const,
      hint: "More KPIs coming soon",
    },
  }
}

/** @deprecated Use getKpiSupporting(dictionary) instead */
export const KPI_SUPPORTING = getKpiSupporting()

export type KpiKey = keyof ReturnType<typeof getKpiSupporting>
