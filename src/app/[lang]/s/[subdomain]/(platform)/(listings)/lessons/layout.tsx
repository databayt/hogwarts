import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function LessonsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.lessons

  // Lessons page navigation (5 links - Create merged into All)
  const lessonsPages: PageNavItem[] = [
    { name: d?.navigation?.all || "All", href: `/${lang}/lessons` },
    {
      name: d?.navigation?.curriculum || "Curriculum",
      href: `/${lang}/lessons/curriculum`,
    },
    {
      name: d?.navigation?.resources || "Resources",
      href: `/${lang}/lessons/resources`,
    },
    {
      name: d?.navigation?.analytics || "Analytics",
      href: `/${lang}/lessons/analytics`,
    },
    {
      name: d?.navigation?.settings || "Settings",
      href: `/${lang}/lessons/settings`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Lessons"} />
      <PageNav pages={lessonsPages} />
      {children}
    </div>
  )
}
