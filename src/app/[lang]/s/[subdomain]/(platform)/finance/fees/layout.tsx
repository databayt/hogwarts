import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function FeesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.fees

  // Define fees page navigation
  const feesPages: PageNavItem[] = [
    { name: "Overview", href: `/${lang}/finance/fees` },
    { name: "Fee Structure", href: `/${lang}/finance/fees/structure` },
    { name: "Fee Collection", href: `/${lang}/finance/fees/collection` },
    { name: "Pending Fees", href: `/${lang}/finance/fees/pending` },
    { name: "Scholarships", href: `/${lang}/finance/fees/scholarships` },
    { name: "Reports", href: `/${lang}/finance/fees/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Fees"} />
      <PageNav pages={feesPages} />
      {children}
    </div>
  )
}
