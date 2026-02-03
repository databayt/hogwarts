import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function InvoiceLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.invoice

  // Define invoice page navigation
  const invoicePages: PageNavItem[] = [
    { name: "Dashboard", href: `/${lang}/finance/invoice` },
    { name: "List", href: `/${lang}/finance/invoice/list` },
    { name: "Create Invoice", href: `/${lang}/finance/invoice/invoice/create` },
    { name: "Settings", href: `/${lang}/finance/invoice/settings` },
    { name: "Onboarding", href: `/${lang}/finance/invoice/onboarding` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Invoice"} />
      <PageNav pages={invoicePages} />
      {children}
    </div>
  )
}
