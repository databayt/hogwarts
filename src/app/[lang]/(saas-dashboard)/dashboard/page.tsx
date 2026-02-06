import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DashboardContent } from "@/components/saas-dashboard/dashboard/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

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

  const n = d?.nav
  const dashboardPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/dashboard` },
    { name: n?.analytics || "Analytics", href: `/${lang}/analytics` },
    { name: n?.kanban || "Kanban", href: `/${lang}/kanban` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.dashboard?.title || "Dashboard"} />
      <PageNav pages={dashboardPages} />
      <DashboardContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
