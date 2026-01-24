import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ParentsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.parents

  // Parents page navigation (4 links)
  const parentsPages: PageNavItem[] = [
    { name: d?.allParents || "All", href: `/${lang}/parents` },
    { name: "Link", href: `/${lang}/parents/link` },
    { name: "Communication", href: `/${lang}/parents/communication` },
    { name: "Settings", href: `/${lang}/parents/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Parents"} />
      <PageNav pages={parentsPages} />
      {children}
    </div>
  )
}
