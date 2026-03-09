// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { getWeatherData } from "@/components/school-dashboard/dashboard/weather-actions"

import { SaasDashboardClient } from "./saas-client"

interface DashboardContentProps {
  dictionary: Dictionary
  lang: Locale
}

export async function DashboardContent({
  dictionary,
  lang,
}: DashboardContentProps) {
  const [totalSchools, activeSchools, totalUsers, totalStudents, weatherData] =
    await Promise.all([
      db.school.count(),
      db.school.count({ where: { isActive: true } }),
      db.user.count(),
      db.student.count(),
      getWeatherData("metric", lang),
    ])

  return (
    <SaasDashboardClient
      locale={lang}
      dictionary={dictionary}
      totals={{ totalSchools, activeSchools, totalUsers, totalStudents }}
      weatherData={weatherData}
    />
  )
}
