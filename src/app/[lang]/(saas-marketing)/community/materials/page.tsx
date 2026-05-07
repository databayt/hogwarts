// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CommunityEmptyState } from "@/components/saas-marketing/community/empty-state"
import { CommunityFilterBar } from "@/components/saas-marketing/community/filter-bar"
import { CommunityHero } from "@/components/saas-marketing/community/hero"
import {
  getCommunityFilterOptions,
  getCommunityMaterials,
} from "@/components/saas-marketing/community/queries"
import { CommunityResourceGrid } from "@/components/saas-marketing/community/resource-grid"
import { communitySearchParams } from "@/components/saas-marketing/community/search-params"

export const metadata = { title: "Materials — Community" }
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CommunityMaterialsPage({
  params,
  searchParams,
}: Props) {
  const { lang } = await params
  const sp = await searchParams
  const { curriculum, grade } = communitySearchParams.parse(sp)
  const dictionary = await getDictionary(lang)
  const filters = {
    curriculum: curriculum || undefined,
    grade: grade ?? undefined,
    lang,
  }
  const [options, items] = await Promise.all([
    getCommunityFilterOptions(),
    getCommunityMaterials(filters),
  ])

  const title = dictionary?.community?.types?.materials?.label ?? "Materials"
  const hasFilters = Boolean(curriculum || grade)

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 lg:px-0">
      <CommunityHero dictionary={dictionary} variant="compact" title={title} />
      <CommunityFilterBar options={options} dictionary={dictionary} />
      <div className="mt-8">
        {items.length === 0 ? (
          <CommunityEmptyState
            dictionary={dictionary}
            resetHref={`/${lang}/community/materials`}
            hasFilters={hasFilters}
          />
        ) : (
          <CommunityResourceGrid type="materials" items={items} />
        )}
      </div>
    </div>
  )
}
