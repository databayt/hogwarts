import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DashboardContent } from "@/components/operator/dashboard/content"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

export const metadata = {
  title: "Dashboard",
  description: "Operator lab overview",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Dashboard({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  // Define operator dashboard navigation
  const dashboardPages: PageNavItem[] = [
    { name: "Overview", href: `/${lang}/dashboard` },
    { name: "Analytics", href: `/${lang}/analytics` },
    { name: "Kanban", href: `/${lang}/kanban` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.dashboard?.title || "Dashboard"} />
      <PageNav pages={dashboardPages} />
      <DashboardContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
