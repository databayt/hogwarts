// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CatalogContent } from "@/components/saas-dashboard/catalog/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

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

  return (
    <>
      <PageHeadingSetter
        title={dictionary?.saas?.catalog?.navigation?.catalog || "Catalog"}
      />
      <CatalogContent dictionary={dictionary} lang={lang} />
    </>
  )
}
