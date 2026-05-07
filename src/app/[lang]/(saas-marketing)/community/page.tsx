// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CommunityEmptyState } from "@/components/saas-marketing/community/empty-state"
import { CommunityFilterBar } from "@/components/saas-marketing/community/filter-bar"
import { CommunityHero } from "@/components/saas-marketing/community/hero"
import { CommunityHubGrid } from "@/components/saas-marketing/community/hub-grid"
import {
  getCommunityCounts,
  getCommunityFilterOptions,
} from "@/components/saas-marketing/community/queries"
import { communitySearchParams } from "@/components/saas-marketing/community/search-params"

interface Props {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const meta = dictionary?.community?.metadata
  return {
    title: meta?.title ?? "Community",
    description: meta?.description,
  }
}

export default async function CommunityHubPage({
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
  const [options, counts] = await Promise.all([
    getCommunityFilterOptions(),
    getCommunityCounts(filters),
  ])

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0)
  const hasFilters = Boolean(curriculum || grade)

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 lg:px-0">
      <CommunityHero dictionary={dictionary} variant="full" />
      <CommunityFilterBar options={options} dictionary={dictionary} />
      <div className="mt-8">
        {totalCount === 0 && hasFilters ? (
          <CommunityEmptyState
            dictionary={dictionary}
            resetHref={`/${lang}/community`}
            hasFilters
          />
        ) : (
          <CommunityHubGrid
            dictionary={dictionary}
            lang={lang}
            counts={counts}
            filters={{ curriculum, grade }}
          />
        )}
      </div>
    </div>
  )
}
