// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { InvoiceContent } from "@/components/school-dashboard/finance/invoice/content"

interface Props {
  searchParams: Promise<SearchParams>
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function InvoiceListPage({ searchParams, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <InvoiceContent searchParams={searchParams} lang={lang as Locale} />
}
