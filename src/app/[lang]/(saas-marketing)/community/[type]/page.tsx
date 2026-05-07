// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CommunityEmptyState } from "@/components/saas-marketing/community/empty-state"
import { CommunityFilterBar } from "@/components/saas-marketing/community/filter-bar"
import { CommunityHero } from "@/components/saas-marketing/community/hero"
import {
  getCommunityBooks,
  getCommunityExams,
  getCommunityFilterOptions,
  getCommunityMaterials,
  getCommunityQuestions,
  getCommunityTextbooks,
  getCommunityVideos,
} from "@/components/saas-marketing/community/queries"
import { CommunityResourceGrid } from "@/components/saas-marketing/community/resource-grid"
import { communitySearchParams } from "@/components/saas-marketing/community/search-params"
import type { CommunityResourceType } from "@/components/saas-marketing/community/types"

// Single dynamic route covering all six community resource types. Collapsing
// the per-type page files keeps Vercel's "Collecting page data" phase from
// thrashing on too many module imports — earlier deploys timed out at 45m
// because each page module brought Prisma + cards + nuqs into the worker.
export const dynamic = "force-dynamic"

const VALID_TYPES = [
  "textbooks",
  "exams",
  "qbank",
  "videos",
  "materials",
  "books",
] as const satisfies readonly CommunityResourceType[]

const TYPE_TITLES: Record<CommunityResourceType, string> = {
  textbooks: "Textbooks — Community",
  exams: "Mock Exams — Community",
  qbank: "Question Bank — Community",
  videos: "Videos — Community",
  materials: "Materials — Community",
  books: "Library Books — Community",
}

interface Props {
  params: Promise<{ lang: Locale; type: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props) {
  const { type } = await params
  const validType = VALID_TYPES.find((t) => t === type)
  return {
    title: validType ? TYPE_TITLES[validType] : "Community",
  }
}

export default async function CommunityDrillPage({
  params,
  searchParams,
}: Props) {
  const { lang, type } = await params
  const validType = VALID_TYPES.find((t) => t === type)
  if (!validType) notFound()

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
    fetchByType(validType, filters),
  ])

  const dictTitle = dictionary?.community?.types?.[validType]?.label
  const title = dictTitle ?? validType
  const hasFilters = Boolean(curriculum || grade)

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 lg:px-0">
      <CommunityHero dictionary={dictionary} variant="compact" title={title} />
      <CommunityFilterBar options={options} dictionary={dictionary} />
      <div className="mt-8">
        {items.length === 0 ? (
          <CommunityEmptyState
            dictionary={dictionary}
            resetHref={`/${lang}/community/${validType}`}
            hasFilters={hasFilters}
          />
        ) : (
          // Cast through `any` here because the discriminated union on
          // CommunityResourceGrid keeps each `items` shape paired with its
          // type tag — and we've validated the pair at runtime via VALID_TYPES.
          <CommunityResourceGrid
            type={validType as never}
            items={items as never}
          />
        )}
      </div>
    </div>
  )
}

async function fetchByType(
  type: CommunityResourceType,
  filters: { curriculum?: string; grade?: number; lang: string }
) {
  switch (type) {
    case "textbooks":
      return getCommunityTextbooks(filters)
    case "exams":
      return getCommunityExams(filters)
    case "qbank":
      return getCommunityQuestions(filters)
    case "videos":
      return getCommunityVideos(filters)
    case "materials":
      return getCommunityMaterials(filters)
    case "books":
      return getCommunityBooks(filters)
  }
}
