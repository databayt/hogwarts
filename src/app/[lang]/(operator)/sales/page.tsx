import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { OperatorSalesContent } from "@/components/operator/sales/content"

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

  return (
    <OperatorSalesContent
      searchParams={searchParams}
      dictionary={dictionary.sales}
      lang={lang}
    />
  )
}
