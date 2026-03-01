// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ProposalReviewContent } from "@/components/saas-dashboard/catalog/proposal-content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export default function CatalogProposalsPage() {
  return (
    <>
      <PageHeadingSetter title="Catalog Proposals" />
      <ProposalReviewContent />
    </>
  )
}
