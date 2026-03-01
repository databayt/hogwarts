// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import type { Locale } from "@/components/internationalization/config"
import { InvoiceContent } from "@/components/school-dashboard/finance/invoice/content"

interface Props {
  searchParams: Promise<SearchParams>
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function List({ searchParams, params }: Props) {
  const { lang } = await params
  return <InvoiceContent searchParams={searchParams} lang={lang as Locale} />
}
