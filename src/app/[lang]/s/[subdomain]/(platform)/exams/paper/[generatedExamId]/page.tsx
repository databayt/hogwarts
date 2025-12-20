/**
 * Exam Paper Configuration Page
 */

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { Content } from "@/components/platform/exams/paper/content"

interface PageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
    generatedExamId: string
  }>
}

export default async function ExamPaperPage({ params }: PageProps) {
  const { lang, generatedExamId } = await params
  const dictionary = await getDictionary(lang)

  return (
    <Content
      generatedExamId={generatedExamId}
      locale={lang}
      dictionary={dictionary}
    />
  )
}
