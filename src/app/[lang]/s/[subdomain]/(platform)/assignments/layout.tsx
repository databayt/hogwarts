import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function AssignmentsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.assignments

  // Define assignments page navigation
  const assignmentsPages: PageNavItem[] = [
    { name: "All", href: `/${lang}/assignments` },
    { name: "Upcoming", href: `/${lang}/assignments/upcoming` },
    { name: "Submitted", href: `/${lang}/assignments/submitted` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Assignments"} />
      <PageNav pages={assignmentsPages} />
      {children}
    </div>
  )
}
