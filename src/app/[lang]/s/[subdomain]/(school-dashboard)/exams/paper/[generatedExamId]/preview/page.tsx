/**
 * Exam Paper Preview Page
 * Full-screen PDF preview
 */

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getPaperData } from "@/components/school-dashboard/exams/paper/actions"

import { PreviewClient } from "./preview-client"

interface PageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
    generatedExamId: string
  }>
  searchParams: Promise<{
    version?: string
  }>
}

export default async function ExamPaperPreviewPage({
  params,
  searchParams,
}: PageProps) {
  const { lang, generatedExamId } = await params
  const { version } = await searchParams
  const dictionary = await getDictionary(lang)

  const isRTL = lang === "ar"

  // Fetch paper data
  const result = await getPaperData(generatedExamId, version)

  return (
    <div className="flex h-full flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${lang}/exams/paper/${generatedExamId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {isRTL ? "معاينة ورقة الاختبار" : "Exam Paper Preview"}
            </h1>
            {version && (
              <p className="text-muted-foreground text-sm">
                {isRTL ? `نسخة ${version}` : `Version ${version}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-hidden">
        <PreviewClient
          data={result.success ? result.data : null}
          error={!result.success ? result.error : undefined}
          locale={lang}
        />
      </div>
    </div>
  )
}
