// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { ReconciliationContent } from "@/components/school-dashboard/finance/banking/reconciliation/content"

export const metadata = { title: "Reconciliation Report" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<{ days?: string }>
}

export default async function BankingReconciliationPage({
  params,
  searchParams,
}: Props) {
  const { lang } = await params
  const { days } = await searchParams
  const parsedDays = days ? Math.max(1, Math.min(365, Number(days))) : 30
  return <ReconciliationContent lang={lang} days={parsedDays} />
}
