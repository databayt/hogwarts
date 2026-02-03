import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ReceiptLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.receipt

  // Define receipt page navigation
  const receiptPages: PageNavItem[] = [
    { name: "Overview", href: `/${lang}/finance/receipt` },
    { name: "Generate Receipt", href: `/${lang}/finance/receipt/generate` },
    { name: "Receipt History", href: `/${lang}/finance/receipt/history` },
    { name: "Templates", href: `/${lang}/finance/receipt/templates` },
    { name: "Manage Plans", href: `/${lang}/finance/receipt/manage-plan` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Receipt"} />
      <PageNav pages={receiptPages} />
      {children}
    </div>
  )
}
