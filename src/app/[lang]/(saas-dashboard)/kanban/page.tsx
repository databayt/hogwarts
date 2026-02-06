import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { KanbanContent } from "@/components/saas-dashboard/kanban/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Kanban",
  description: "Project management kanban board",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Kanban({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  const n = d?.nav
  const kanbanPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/dashboard` },
    { name: n?.analytics || "Analytics", href: `/${lang}/analytics` },
    { name: n?.kanban || "Kanban", href: `/${lang}/kanban` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={n?.kanban || "Kanban"} />
      <PageNav pages={kanbanPages} />
      <KanbanContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
