// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getInvoicesWithFilters } from "@/components/school-dashboard/finance/invoice/actions"
import type { InvoiceRow } from "@/components/school-dashboard/finance/invoice/columns"
import { invoiceSearchParams } from "@/components/school-dashboard/finance/invoice/list-params"
import { InvoiceTable } from "@/components/school-dashboard/finance/invoice/table"

import { FinanceAccessDenied } from "../access-denied"
import { resolveFinanceAccess } from "../guard"

interface Props {
  searchParams: Promise<SearchParams>
  lang: Locale
}

export async function InvoiceContent({ searchParams, lang }: Props) {
  const dictionary = await getDictionary(lang)

  // Inline denial, never redirect() — Next 16 streams the page in parallel
  // with its layout (see finance/guard.ts).
  const { schoolId, can } = await resolveFinanceAccess("invoice", ["view"])
  if (!schoolId || !can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="invoice" />
  }

  const sp = await invoiceSearchParams.parse(await searchParams)
  let data: InvoiceRow[] = []
  let total = 0

  try {
    // Pass `lang` so the action can translate `client_name` (stored in school's
    // preferredLanguage) to the viewer's locale via Google Translate + cache.
    const result = await getInvoicesWithFilters({ ...sp, lang })
    if (result.success) {
      data = result.data
      total = result.total ?? 0
    }
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <InvoiceTable
        initialData={data}
        total={total}
        perPage={sp.perPage}
        lang={lang}
      />
    </div>
  )
}

export default InvoiceContent
