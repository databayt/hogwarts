import { notFound } from "next/navigation"

import { getTenantContext } from "@/lib/tenant-context"
import { ModalProvider } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { GradeDetailContent } from "@/components/platform/grades/detail-content"
import {
  getClassGradeStats,
  getResultDetail,
  getStudentGradeHistory,
  getStudentRank,
} from "@/components/platform/grades/queries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function GradeDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return notFound()
  }

  // Fetch grade detail
  const grade = await getResultDetail(schoolId, id)

  if (!grade) {
    return notFound()
  }

  // Fetch analytics data in parallel
  const [history, classStats] = await Promise.all([
    getStudentGradeHistory(schoolId, grade.studentId),
    getClassGradeStats(
      schoolId,
      grade.classId,
      grade.assignmentId,
      grade.examId
    ),
  ])

  // Calculate student rank
  const studentRank = getStudentRank(grade.studentId, classStats)

  return (
    <ModalProvider>
      <GradeDetailContent
        grade={grade}
        history={history}
        classStats={classStats}
        studentRank={studentRank}
        dictionary={dictionary}
        lang={lang}
      />
    </ModalProvider>
  )
}
