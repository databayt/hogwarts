import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { StreamDashboardContent } from "@/components/stream/dashboard/content"
import { getCatalogDashboardData } from "@/components/stream/data/catalog/get-dashboard-data"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.stream?.dashboard?.title || "My Learning Dashboard",
    description:
      dictionary.stream?.dashboard?.description ||
      "Track your learning progress",
  }
}

export default async function StreamDashboardPage({ params }: Props) {
  const { lang, subdomain } = await params
  // Parallelize independent async operations to avoid request waterfalls
  const [dictionary, { schoolId }, session] = await Promise.all([
    getDictionary(lang),
    getTenantContext(),
    auth(),
  ])

  if (!session?.user) {
    redirect(`/${lang}/s/${subdomain}/auth/login`)
  }

  // Fetch dashboard data from catalog
  const dashboardData = schoolId
    ? await getCatalogDashboardData(session.user.id, schoolId)
    : { enrolledCourses: [], availableCourses: [] }

  return (
    <StreamDashboardContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      userId={session.user.id}
      enrolledCourses={dashboardData.enrolledCourses}
      availableCourses={dashboardData.availableCourses}
    />
  )
}
