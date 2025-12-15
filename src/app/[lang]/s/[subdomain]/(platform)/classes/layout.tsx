import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ClassesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.classes

  // Classes page navigation (5 links - Create merged into All)
  const classesPages: PageNavItem[] = [
    { name: d?.navigation?.all || "All", href: `/${lang}/classes` },
    {
      name: d?.navigation?.subjects || "Subjects",
      href: `/${lang}/classes/subjects`,
    },
    {
      name: d?.navigation?.schedule || "Schedule",
      href: `/${lang}/classes/schedule`,
    },
    {
      name: d?.navigation?.capacity || "Capacity",
      href: `/${lang}/classes/capacity`,
    },
    {
      name: d?.navigation?.settings || "Settings",
      href: `/${lang}/classes/settings`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Classes"} />
      <PageNav pages={classesPages} />
      {children}
    </div>
  )
}
