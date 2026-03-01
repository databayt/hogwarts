// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TourWizard } from "@/components/school-marketing/admission/tour/tour-wizard"

export const revalidate = 3600

interface TourPageProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: TourPageProps): Promise<Metadata> {
  const { subdomain } = await params
  const schoolResult = await getSchoolBySubdomain(subdomain)

  if (!schoolResult.success || !schoolResult.data) {
    return { title: "Schedule Tour" }
  }

  return {
    title: `Schedule a Tour - ${schoolResult.data.name}`,
    description: `Schedule a campus tour at ${schoolResult.data.name}. See our facilities and meet our staff.`,
  }
}

export default async function TourPage({ params }: TourPageProps) {
  const { lang, subdomain } = await params

  const [dictionary, schoolResult] = await Promise.all([
    getDictionary(lang),
    getSchoolBySubdomain(subdomain),
  ])

  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  const schoolId = schoolResult.data.id

  // Fetch admission settings and school periods in parallel
  const [settings, periods] = await Promise.all([
    db.admissionSettings.findUnique({
      where: { schoolId },
      select: { tourDaysOfWeek: true },
    }),
    db.period.findMany({
      where: {
        schoolId,
        name: { not: { startsWith: "Break" } },
      },
      orderBy: { startTime: "asc" },
      select: { name: true, startTime: true, endTime: true },
    }),
  ])

  const tourDaysOfWeek = (settings?.tourDaysOfWeek as number[] | null) ?? [
    0, 1, 2, 3, 4,
  ]

  // Serialize period times to HH:mm strings
  const schoolPeriods = periods.map((p) => ({
    name: p.name,
    startTime: p.startTime.toISOString().split("T")[1].substring(0, 5),
    endTime: p.endTime.toISOString().split("T")[1].substring(0, 5),
  }))

  return (
    <TourWizard
      school={schoolResult.data}
      dictionary={dictionary}
      lang={lang}
      subdomain={subdomain}
      tourDaysOfWeek={tourDaysOfWeek}
      schoolPeriods={schoolPeriods}
    />
  )
}
