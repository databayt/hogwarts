// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTenantContext } from "@/components/saas-dashboard/lib/tenant"
import EnrollStudentContent from "@/components/school-dashboard/listings/students/enroll/content"

export const metadata = { title: "Dashboard: Enroll Student" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <EnrollStudentContent
        dictionary={dictionary.school}
        lang={lang}
        academicGrades={[]}
        classes={[]}
        batches={[]}
        students={[]}
      />
    )
  }

  const [gradeData, classData, batchData, studentData] = await Promise.all([
    db.academicGrade.findMany({
      where: { schoolId },
      orderBy: { gradeNumber: "asc" },
      select: {
        id: true,
        name: true,
        gradeNumber: true,
        level: { select: { id: true, name: true } },
      },
    }),
    db.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        gradeId: true,
      },
      orderBy: { name: "asc" },
    }),
    db.batch.findMany({
      where: { schoolId, isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        yearLevelId: true,
      },
      orderBy: { name: "asc" },
    }),
    db.student.findMany({
      where: { schoolId, academicGradeId: null },
      select: {
        id: true,
        givenName: true,
        surname: true,
        academicGradeId: true,
      },
      orderBy: [{ surname: "asc" }, { givenName: "asc" }],
      take: 200,
    }),
  ])

  const classes = classData.map((c) => ({
    id: c.id,
    name: c.name,
    academicGradeId: c.gradeId ?? null,
  }))

  return (
    <EnrollStudentContent
      dictionary={dictionary.school}
      lang={lang}
      academicGrades={gradeData}
      classes={classes}
      batches={batchData}
      students={studentData}
    />
  )
}
