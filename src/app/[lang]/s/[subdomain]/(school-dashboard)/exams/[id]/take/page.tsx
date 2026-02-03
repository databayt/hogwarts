import { Suspense } from "react"
import { notFound } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getExamForTaking } from "@/components/school-dashboard/exams/manage/actions"
import { ExamTakingContent } from "@/components/school-dashboard/exams/take/content"

interface TakeExamPageProps {
  params: Promise<{
    lang: Locale
    id: string
  }>
}

export default async function TakeExamPage({ params }: TakeExamPageProps) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  const result = await getExamForTaking(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const { exam, questions, existingAnswers } = result.data

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ExamTakingContent
        exam={exam}
        questions={questions}
        existingAnswers={existingAnswers}
        dictionary={dictionary}
      />
    </Suspense>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-6 w-1/2" />
      <div className="mt-8 grid gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  )
}
