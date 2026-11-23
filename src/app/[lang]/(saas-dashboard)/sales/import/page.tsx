// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ImportLeadsContent } from "@/components/saas-dashboard/sales/import-content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: [b?.sales, b?.import].every(Boolean)
      ? [b?.sales, b?.import].join(" - ")
      : "Sales | Import",
    description: "Import leads from text or CSV",
  }
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function SalesImport({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <ImportLeadsContent dictionary={dictionary.sales} lang={lang} />
}
