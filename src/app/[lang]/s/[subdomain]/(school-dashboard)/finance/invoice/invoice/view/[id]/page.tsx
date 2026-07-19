// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getInvoiceById } from "@/components/school-dashboard/finance/invoice/actions"
import ViewInvoiceContent from "@/components/school-dashboard/finance/invoice/invoice/view-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ViewInvoice({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const result = await getInvoiceById(id)
  const invoice = result.success ? result.data : null
  return (
    <ViewInvoiceContent invoice={invoice} lang={lang} dictionary={dictionary} />
  )
}
