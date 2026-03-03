import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import ExamContributionsContent from "@/components/school-dashboard/exams/generate/contributions"

interface PageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function ContributionsPage({ params }: PageProps) {
  const { lang } = await params

  const session = await auth()
  if (["STUDENT", "GUARDIAN"].includes(session?.user?.role || "")) {
    redirect(`/${lang}/exams`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Contributions</h2>
        <p className="text-muted-foreground">
          Track your exam and template contributions to the catalog
        </p>
      </div>
      <ExamContributionsContent />
    </div>
  )
}
