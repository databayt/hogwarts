import type { Locale } from "@/components/internationalization/config"
import { CatalogExamBrowseTab } from "@/components/school-dashboard/exams/generate/catalog-tab"

interface PageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function CatalogExamBrowsePage({ params }: PageProps) {
  await params

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Exam Catalog</h2>
        <p className="text-muted-foreground">
          Browse and adopt exams from the global catalog
        </p>
      </div>
      <CatalogExamBrowseTab />
    </div>
  )
}
