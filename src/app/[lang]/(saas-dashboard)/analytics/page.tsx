import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AnalyticsContent } from "@/components/saas-dashboard/analytics/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Analytics",
  description: "Platform analytics and insights",
}

interface Props {
  params: Promise<{
    lang: Locale
  }>
}

export default async function AnalyticsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  // Define analytics page navigation (linked with dashboard)
  const analyticsPages: PageNavItem[] = [
    { name: "Overview", href: `/${lang}/dashboard` },
    { name: "Analytics", href: `/${lang}/analytics` },
    { name: "Kanban", href: `/${lang}/kanban` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.analytics?.title || "Analytics"} />
      <PageNav pages={analyticsPages} />
      <AnalyticsContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
