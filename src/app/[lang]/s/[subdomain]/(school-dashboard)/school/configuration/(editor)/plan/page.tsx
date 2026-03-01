// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { PlanLimitsSection } from "@/components/school-dashboard/school/configuration/plan-limits-section"

export const metadata = { title: "Configuration: Plan & Limits" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function PlanPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  const [school, studentCount, teacherCount] = await Promise.all([
    schoolId
      ? db.school
          .findUnique({
            where: { id: schoolId },
            select: {
              planType: true,
              maxStudents: true,
              maxTeachers: true,
              maxClasses: true,
              isActive: true,
            },
          })
          .catch(() => null)
      : null,
    schoolId ? db.student.count({ where: { schoolId } }).catch(() => 0) : 0,
    schoolId ? db.teacher.count({ where: { schoolId } }).catch(() => 0) : 0,
  ])

  return (
    <PlanLimitsSection
      schoolId={schoolId || ""}
      initialData={{
        planType:
          (school?.planType as "basic" | "premium" | "enterprise") || "basic",
        maxStudents: school?.maxStudents || 100,
        maxTeachers: school?.maxTeachers || 10,
        maxClasses: school?.maxClasses || 20,
        isActive: school?.isActive ?? true,
      }}
      currentUsage={{
        students: studentCount,
        teachers: teacherCount,
      }}
      lang={lang}
    />
  )
}
