// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { SearchParams } from "nuqs/server"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getOverviewTerms } from "@/components/school-dashboard/grades/lib/overview"
import { GradesOverviewContent } from "@/components/school-dashboard/grades/overview/content"
import { GradesSelfView } from "@/components/school-dashboard/grades/overview/self-view"
import GradesContent from "@/components/school-dashboard/listings/grades/content"
import { getChildrenIdsForGuardian } from "@/components/school-dashboard/listings/grades/queries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

/**
 * The grades hub. Staff get the term's workflow at a glance; a student or
 * guardian gets their own subjects, report cards and certificates, with
 * every grade listed below.
 */
export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const sp = await searchParams
  const dictionary = await getDictionary(lang)
  const { schoolId, role } = await getTenantContext()
  if (!schoolId) return null

  const termId = typeof sp.termId === "string" ? sp.termId : undefined
  const { terms, current } = await getOverviewTerms(schoolId, termId)

  if (role === "STUDENT" || role === "GUARDIAN") {
    const userId = (await auth())?.user?.id
    let studentIds: string[] = []
    if (userId && role === "GUARDIAN") {
      studentIds = await getChildrenIdsForGuardian(userId, schoolId)
    } else if (userId) {
      const student = await db.student.findFirst({
        where: { userId, schoolId },
        select: { id: true },
      })
      studentIds = student ? [student.id] : []
    }

    return (
      <div className="space-y-12">
        <GradesSelfView
          schoolId={schoolId}
          studentIds={studentIds}
          term={current}
          dictionary={dictionary}
          lang={lang}
          showNames={role === "GUARDIAN"}
        />
        <section className="space-y-4">
          <h2 className="text-muted-foreground px-1 text-sm font-medium">
            {dictionary.school.grades.overview.self.allGrades}
          </h2>
          <GradesContent
            searchParams={searchParams}
            dictionary={dictionary.school}
            lang={lang}
          />
        </section>
      </div>
    )
  }

  return (
    <GradesOverviewContent
      schoolId={schoolId}
      terms={terms}
      term={current}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
