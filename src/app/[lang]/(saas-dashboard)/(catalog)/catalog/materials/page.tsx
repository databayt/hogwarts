// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { MaterialContent } from "@/components/saas-dashboard/catalog/material-content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function CatalogMaterialsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <>
      <PageHeadingSetter
        title={
          dictionary?.saas?.catalog?.navigation?.materials ||
          "Catalog Materials"
        }
      />
      <MaterialContent dictionary={dictionary} lang={lang} />
    </>
  )
}
