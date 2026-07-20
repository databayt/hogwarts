import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { VersionLibrary } from "@/components/school-dashboard/exams/generate/version-library"

interface PageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
  searchParams: Promise<{ examId?: string }>
}

export default async function ExamVersionsPage({
  params,
  searchParams,
}: PageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  const session = await auth()
  if (["STUDENT", "GUARDIAN"].includes(session?.user?.role || "")) {
    redirect(`/${lang}/exams`)
  }
  const { examId } = await searchParams

  if (!examId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {dictionary?.generate?.versions?.title || "Exam versions"}
          </h2>
          <p className="text-muted-foreground">
            {dictionary?.generate?.versions?.emptyDescription}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {dictionary?.generate?.versions?.title || "Exam versions"}
        </h2>
        <p className="text-muted-foreground">
          {dictionary?.generate?.versions?.description}
        </p>
      </div>
      <VersionLibrary examId={examId} />
    </div>
  )
}
