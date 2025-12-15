import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function SalesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.sales

  // Define sales page navigation
  const salesPages: PageNavItem[] = [
    { name: d?.navAll || "All Leads", href: `/${lang}/sales` },
    { name: d?.navImport || "Import", href: `/${lang}/sales/import` },
    { name: d?.navAnalytics || "Analytics", href: `/${lang}/sales/analytics` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Sales"} />
      <PageNav pages={salesPages} />
      {children}
    </div>
  )
}
