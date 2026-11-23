// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CatalogSelectionContent } from "@/components/school-dashboard/listings/subjects/catalog/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: [b?.subjects, b?.catalog].every(Boolean)
      ? [b?.subjects, b?.catalog].join(" - ")
      : "Dashboard: Subjects - Catalog",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CatalogSelectionContent dictionary={dictionary} lang={lang} />
}
