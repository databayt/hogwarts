// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AcademicContent } from "@/components/school-dashboard/school/academic/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.academic?.title ||
      "Configuration: Academic",
    description:
      dictionary?.school?.schoolAdmin?.configSections?.academic?.description ||
      "Configure academic years, terms, periods, year levels, and grading scale",
  }
}

export default async function AcademicConfigPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return <div>Unauthorized</div>
  }

  const [years, terms, periods, levels, grades] = await Promise.all([
    db.schoolYear.findMany({
      where: { schoolId },
      orderBy: { startDate: "desc" },
      take: 20,
    }),
    db.term.findMany({
      where: { schoolId },
      orderBy: { startDate: "desc" },
      take: 20,
      include: { schoolYear: { select: { yearName: true } } },
    }),
    db.period.findMany({
      where: { schoolId },
      orderBy: { startTime: "asc" },
      take: 20,
      include: { schoolYear: { select: { yearName: true } } },
    }),
    db.yearLevel.findMany({
      where: { schoolId },
      orderBy: { levelOrder: "asc" },
      take: 20,
    }),
    db.scoreRange.findMany({
      where: { schoolId },
      orderBy: { minScore: "desc" },
      take: 20,
    }),
  ])

  const [totalYears, totalTerms, totalPeriods, totalLevels, totalGrades] =
    await Promise.all([
      db.schoolYear.count({ where: { schoolId } }),
      db.term.count({ where: { schoolId } }),
      db.period.count({ where: { schoolId } }),
      db.yearLevel.count({ where: { schoolId } }),
      db.scoreRange.count({ where: { schoolId } }),
    ])

  const transformedYears = years.map((y) => ({
    ...y,
    startDate: y.startDate.toISOString(),
    endDate: y.endDate.toISOString(),
    createdAt: y.createdAt.toISOString(),
    updatedAt: y.updatedAt.toISOString(),
  }))

  const transformedTerms = terms.map((t) => ({
    id: t.id,
    yearId: t.yearId,
    yearName: t.schoolYear?.yearName || "",
    termNumber: t.termNumber,
    termName: `Term ${t.termNumber}`,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
  }))

  const transformedPeriods = periods.map((p) => ({
    ...p,
    yearName: p.schoolYear?.yearName || "",
    startTime: p.startTime.toISOString(),
    endTime: p.endTime.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  const transformedLevels = levels.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }))

  const transformedGrades = grades.map((g) => ({
    id: g.id,
    minScore: Number(g.minScore),
    maxScore: Number(g.maxScore),
    grade: g.grade,
    createdAt: g.createdAt.toISOString(),
  }))

  return (
    <AcademicContent
      lang={lang}
      dictionary={dictionary}
      initialYears={transformedYears}
      totalYears={totalYears}
      initialTerms={transformedTerms}
      totalTerms={totalTerms}
      initialPeriods={transformedPeriods}
      totalPeriods={totalPeriods}
      initialLevels={transformedLevels}
      totalLevels={totalLevels}
      initialGrades={transformedGrades}
      totalGrades={totalGrades}
    />
  )
}
