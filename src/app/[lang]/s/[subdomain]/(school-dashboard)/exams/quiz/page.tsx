// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { QuizContent } from "@/components/school-dashboard/exams/quiz/content"

interface QuizPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function QuizPage({ params }: QuizPageProps) {
  await params

  return <QuizContent />
}
