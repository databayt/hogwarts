// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { LandingSectionProps, LandingStats } from "./types"

interface Props extends LandingSectionProps {
  stats: LandingStats
}

/**
 * This school's real fleet numbers, not sample data.
 *
 * Rendered only for roles that can read them — `getOverviewStats()` is
 * permission-gated, so calling it for a teacher or an accountant would fail
 * and blank the landing page. The gate lives in content.tsx.
 */
export function StatsSection({ dictionary, stats }: Props) {
  const overview = dictionary?.overview

  const tiles = [
    {
      label: overview?.totalVehicles || "Total vehicles",
      value: stats.totalVehicles,
    },
    {
      label: overview?.totalRoutes || "Total routes",
      value: stats.totalRoutes,
    },
    {
      label: overview?.totalDrivers || "Total drivers",
      value: stats.totalDrivers,
    },
    {
      label: overview?.activeAssignments || "Active assignments",
      value: stats.activeAssignments,
    },
  ]

  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-start text-sm font-medium">
              {tile.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-start text-3xl font-semibold">{tile.value}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
