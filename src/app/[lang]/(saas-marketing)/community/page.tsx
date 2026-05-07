// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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

// Static metadata — async generateMetadata + getDictionary triggers a 20-file
// dynamic-import storm during Next.js "Collecting page data" phase, which on
// Vercel pushed the build past the 45-min timeout. The visible <h1> on the
// page is still locale-aware via the dictionary at render time.
export const metadata = {
  title: "Community — Free Educational Resources",
  description:
    "Open textbooks, mock exams, question banks, and videos for educators and students.",
}

// Page reads `searchParams` and runs Prisma queries — never statically renderable.
// Vercel's "Collecting page data" hung when it tried to evaluate the route, so
// declare dynamic upfront to short-circuit the static-rendering attempt.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
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
