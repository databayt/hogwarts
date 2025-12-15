import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function TimetableLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.timetable

  // Timetable page navigation (4 links - filters embedded in Overview)
  const timetablePages: PageNavItem[] = [
    { name: d?.navigation?.all || "Overview", href: `/${lang}/timetable` },
    {
      name: d?.navigation?.generate || "Generate",
      href: `/${lang}/timetable/generate`,
    },
    {
      name: d?.navigation?.conflicts || "Conflicts",
      href: `/${lang}/timetable/conflicts`,
    },
    {
      name: d?.navigation?.settings || "Settings",
      href: `/${lang}/timetable/settings`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Timetable"} />
      <PageNav pages={timetablePages} />
      {children}
    </div>
  )
}
