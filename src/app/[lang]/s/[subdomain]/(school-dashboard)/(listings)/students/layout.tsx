import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function StudentsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.students

  // Define students page navigation (5 links)
  const studentsPages: PageNavItem[] = [
    { name: d?.navigation?.all || "All", href: `/${lang}/students` },
    {
      name: d?.navigation?.enroll || "Enroll",
      href: `/${lang}/students/enroll`,
    },
    {
      name: d?.navigation?.performance || "Performance",
      href: `/${lang}/students/performance`,
    },
    {
      name: d?.navigation?.reports || "Reports",
      href: `/${lang}/students/reports`,
    },
    {
      name: d?.navigation?.settings || "Settings",
      href: `/${lang}/students/settings`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Students"} />
      <PageNav pages={studentsPages} />
      {children}
    </div>
  )
}
