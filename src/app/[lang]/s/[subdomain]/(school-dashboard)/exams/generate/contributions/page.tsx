import type { Locale } from "@/components/internationalization/config"
import ExamContributionsContent from "@/components/school-dashboard/exams/generate/contributions"

interface PageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function ContributionsPage({ params }: PageProps) {
  await params

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
