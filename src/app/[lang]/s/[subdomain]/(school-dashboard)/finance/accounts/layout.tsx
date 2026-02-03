import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function AccountsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.accounts

  // Define accounts page navigation
  const accountsPages: PageNavItem[] = [
    { name: "Overview", href: `/${lang}/finance/accounts` },
    { name: "Chart of Accounts", href: `/${lang}/finance/accounts/chart` },
    { name: "Journal Entries", href: `/${lang}/finance/accounts/journal` },
    { name: "General Ledger", href: `/${lang}/finance/accounts/ledger` },
    {
      name: "Reconciliation",
      href: `/${lang}/finance/accounts/reconciliation`,
    },
    { name: "Settings", href: `/${lang}/finance/accounts/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Accounts"} />
      <PageNav pages={accountsPages} />
      {children}
    </div>
  )
}
