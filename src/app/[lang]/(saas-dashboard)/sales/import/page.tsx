// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ImportLeadsContent } from "@/components/saas-dashboard/sales/import-content"

export const metadata: Metadata = {
  title: "Sales | Import",
  description: "Import leads from text or CSV",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function SalesImport({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <ImportLeadsContent dictionary={dictionary.sales} lang={lang} />
}
