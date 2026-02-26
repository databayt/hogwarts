// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { LibraryCatalogContent } from "@/components/library/catalog/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Browse Book Catalog",
  description: "Browse and select books from the global catalog",
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function LibraryCatalogPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <>
      <PageHeadingSetter title="Book Catalog" />
      <LibraryCatalogContent dictionary={dictionary} lang={lang} />
    </>
  )
}
