import type { Metadata } from "next"

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { OperatorSalesContent } from "@/components/saas-dashboard/sales/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata: Metadata = {
  title: "Sales | Leads",
  description: "Manage B2B sales leads and CRM",
}

interface Props {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function OperatorSales({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  const salesPages: PageNavItem[] = [
    { name: "Leads", href: `/${lang}/sales` },
    { name: "Analytics", href: `/${lang}/sales/analytics` },
    { name: "Import", href: `/${lang}/sales/import` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Sales" />
      <PageNav pages={salesPages} />
      <OperatorSalesContent
        searchParams={searchParams}
        dictionary={dictionary.sales}
        lang={lang}
      />
    </div>
  )
}
