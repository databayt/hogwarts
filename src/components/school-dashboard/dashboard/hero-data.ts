// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { getWeatherData, type WeatherData } from "./weather-actions"

export interface DashboardHero {
  weatherData: WeatherData | null
  school: { domain: string | null; name: string | null } | null
}

/**
 * The reads every role dashboard makes besides its own data: the hero's
 * weather and the school's domain (for links) and name.
 *
 * Each dashboard used to await them one after another AFTER its main data —
 * main data, then weather (a database lookup plus, on a cache miss, a call to
 * the weather API), then the tenant, then the school row. None depends on
 * another, so the dashboards now start this first and await it beside their
 * own data. Best-effort like before: it never rejects — a failed read logs and
 * comes back null, and the hero renders its own empty state.
 */
export async function loadDashboardHero(
  locale: string,
  { weather = true }: { weather?: boolean } = {}
): Promise<DashboardHero> {
  const [weatherResult, schoolResult] = await Promise.allSettled([
    weather ? getWeatherData("metric", locale) : Promise.resolve(null),
    getTenantContext().then(({ schoolId }) =>
      schoolId
        ? db.school.findUnique({
            where: { id: schoolId },
            select: { domain: true, name: true },
          })
        : null
    ),
  ])

  if (weatherResult.status === "rejected") {
    console.error("[Dashboard] Error fetching weather:", weatherResult.reason)
  }
  if (schoolResult.status === "rejected") {
    console.error("[Dashboard] Error fetching school:", schoolResult.reason)
  }

  return {
    weatherData:
      weatherResult.status === "fulfilled" ? weatherResult.value : null,
    school: schoolResult.status === "fulfilled" ? schoolResult.value : null,
  }
}
