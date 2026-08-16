// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"
import ItemsContent from "@/components/school-dashboard/finance/invoice/wizard/items/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

// The wizard's reads and writes are gated in their actions; this page-level
// gate only decides what a denied caller SEES — the block's standard deny UI
// rather than a form that silently fails to load.
export default async function ItemsPage({ params }: Props) {
  const { lang } = await params
  const { schoolId, can } = await resolveFinanceAccess("invoice", ["edit"])
  if (!schoolId || !can.edit) {
    const dictionary = await getDictionary(lang)
    return <FinanceAccessDenied dictionary={dictionary} module="invoice" />
  }
  return <ItemsContent />
}
