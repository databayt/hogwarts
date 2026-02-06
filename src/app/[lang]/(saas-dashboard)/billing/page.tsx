import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { BillingContent } from "@/components/saas-dashboard/billing/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Billing",
  description: "Operator billing and invoice management",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Billing({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  const n = d?.nav
  const billingPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/billing` },
    { name: n?.receipts || "Receipts", href: `/${lang}/billing/receipts` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.billing?.title || "Billing"} />
      <PageNav pages={billingPages} />
      <BillingContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
