// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ProposalReviewContent } from "@/components/saas-dashboard/catalog/proposal-content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function CatalogProposalsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <>
      <PageHeadingSetter
        title={
          dictionary?.saas?.catalog?.navigation?.proposals ||
          "Catalog Proposals"
        }
      />
      <ProposalReviewContent dictionary={dictionary} lang={lang} />
    </>
  )
}
