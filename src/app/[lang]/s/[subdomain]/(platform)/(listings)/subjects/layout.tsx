import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function SubjectsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.subjects

  // Subjects page navigation (4 links)
  const subjectsPages: PageNavItem[] = [
    { name: d?.allSubjects || "All", href: `/${lang}/subjects` },
    { name: "Curriculum", href: `/${lang}/subjects/curriculum` },
    { name: "Analytics", href: `/${lang}/subjects/analytics` },
    { name: "Settings", href: `/${lang}/subjects/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Subjects"} />
      <PageNav pages={subjectsPages} />
      {children}
    </div>
  )
}
