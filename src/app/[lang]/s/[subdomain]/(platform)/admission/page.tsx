import { Metadata } from "next"
import { Suspense } from "react"
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { AdmissionDashboard } from '@/components/platform/admission/dashboard'
import { getAdmissionStats } from '@/components/platform/admission/actions'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.admission?.title || "Admissions",
    description: dictionary?.school?.admission?.description || "Manage admission campaigns and applications",
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default async function AdmissionPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const stats = await getAdmissionStats()

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdmissionDashboard
        stats={stats}
        dictionary={dictionary?.school?.admission}
        lang={lang}
      />
    </Suspense>
  )
}
