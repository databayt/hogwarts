import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ReceiptsContent } from "@/components/saas-dashboard/billing/receipts/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Receipts",
  description: "Operator billing receipts",
}

interface Props {
  params: Promise<{
    lang: Locale
  }>
  searchParams: Promise<{
    page?: string
    limit?: string
    status?: string
    search?: string
  }>
}

export default async function ReceiptsPage({ params, searchParams }: Props) {
  const { lang } = await params
  const search = await searchParams
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  // Define billing page navigation
  const billingPages: PageNavItem[] = [
    { name: "Overview", href: `/${lang}/billing` },
    { name: "Receipts", href: `/${lang}/billing/receipts` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Receipts" />
      <PageNav pages={billingPages} />
      <ReceiptsContent
        dictionary={dictionary}
        lang={lang}
        searchParams={search}
      />
    </div>
  )
}
