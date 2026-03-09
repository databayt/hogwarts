// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CatalogContent } from "@/components/saas-dashboard/catalog/content"

export const metadata = {
  title: "Catalog Management",
  description:
    "Manage global curriculum catalog subjects, chapters, and lessons",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function CatalogPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CatalogContent dictionary={dictionary} lang={lang} />
}
