// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getDashboardStats } from "@/components/school-dashboard/finance/invoice/actions"
import { DashboardContent } from "@/components/school-dashboard/finance/invoice/dashboard/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function InvoiceAnalysis({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const statsResult = await getDashboardStats()
  const initialData = statsResult.success ? statsResult.data : null

  return (
    <DashboardContent
      dictionary={dictionary}
      lang={lang}
      initialData={initialData}
    />
  )
}
