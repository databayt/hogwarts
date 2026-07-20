import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ExamContributionsContent from "@/components/school-dashboard/exams/generate/contributions"

interface PageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function ContributionsPage({ params }: PageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  const session = await auth()
  if (["STUDENT", "GUARDIAN"].includes(session?.user?.role || "")) {
    redirect(`/${lang}/exams`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {dictionary?.generate?.contributions?.title || "My contributions"}
        </h2>
        <p className="text-muted-foreground">
          {dictionary?.generate?.contributions?.description}
        </p>
      </div>
      <ExamContributionsContent />
    </div>
  )
}
