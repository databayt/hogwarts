// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import { notFound } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { type Locale } from "@/components/internationalization/config"
import { ExamPlayer } from "@/components/school-dashboard/exams/take"
import { getExamForPlayer } from "@/components/school-dashboard/exams/take/actions"

interface TakeExamPageProps {
  params: Promise<{
    lang: Locale
    id: string
  }>
}

export default async function TakeExamPage({ params }: TakeExamPageProps) {
  const { lang, id } = await params

  const result = await getExamForPlayer(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const { exam, questions, existingAnswers, initialSession } = result.data

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ExamPlayer
        exam={exam}
        questions={questions}
        existingAnswers={existingAnswers}
        initialSession={initialSession}
        locale={lang}
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
