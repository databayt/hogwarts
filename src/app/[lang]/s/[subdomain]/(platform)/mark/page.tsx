// Auto-Marking Dashboard Page

import { Suspense } from "react"
import { MarkingContent } from "@/components/platform/exams/mark/content"
import { Skeleton } from "@/components/ui/skeleton"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"

export const metadata = {
  title: "Auto-Marking Dashboard",
  description: "Grade student submissions with AI assistance",
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <Skeleton className="h-96" />
    </div>
  )
}

export default async function MarkingPage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <MarkingContent dictionary={dictionary} locale={lang} />
    </Suspense>
  )
}
