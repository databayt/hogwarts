// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { normalizePlanType } from "@/lib/plan-type"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getExchangeRates } from "@/components/saas-marketing/pricing/exchange-rates"
import {
  CURRENCIES,
  type Currency,
} from "@/components/saas-marketing/pricing/rates"
import { PlanLimitsSection } from "@/components/school-dashboard/school/configuration/plan-limits-section"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.plan?.title ||
      "Configuration: Plan & Limits",
  }
}

/** The school's billing currency when the pricing knows it; Sudan reads SDG. */
function displayCurrency(
  currency: string | null | undefined,
  country: string | null | undefined
): Currency {
  const c = (currency ?? "").toUpperCase()
  const sudan = !!country && /^(sd|sudan|السودان)$/i.test(country.trim())
  if (sudan && (!c || c === "USD")) return "SDG"
  return (CURRENCIES as readonly string[]).includes(c) ? (c as Currency) : "SAR"
}

export default async function PlanPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()
  const role = session?.user?.role ?? ""

  const [school, studentCount, teacherCount, sectionCount, live] =
    await Promise.all([
      schoolId
        ? db.school
            .findUnique({
              where: { id: schoolId },
              select: {
                planType: true,
                maxStudents: true,
                maxTeachers: true,
                maxClasses: true,
                currency: true,
                country: true,
              },
            })
            .catch(() => null)
        : null,
      schoolId ? db.student.count({ where: { schoolId } }).catch(() => 0) : 0,
      schoolId ? db.teacher.count({ where: { schoolId } }).catch(() => 0) : 0,
      schoolId ? db.section.count({ where: { schoolId } }).catch(() => 0) : 0,
      getExchangeRates(),
    ])

  return (
    <PlanLimitsSection
      schoolId={schoolId || ""}
      initialData={{
        planType: normalizePlanType(school?.planType),
        maxStudents: school?.maxStudents ?? 100,
        maxTeachers: school?.maxTeachers ?? 10,
        maxClasses: school?.maxClasses ?? 20,
      }}
      currentUsage={{
        students: studentCount,
        teachers: teacherCount,
        classes: sectionCount,
      }}
      currency={displayCurrency(school?.currency, school?.country)}
      rates={live.rates}
      canEdit={role === "ADMIN" || role === "DEVELOPER"}
      lang={lang}
      t={dictionary.schoolBilling}
    />
  )
}
