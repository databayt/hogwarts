// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { PageHeader } from "@/components/atom/page-header"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CommunityEmptyState } from "@/components/saas-marketing/community/empty-state"
import { CommunityFilterBar } from "@/components/saas-marketing/community/filter-bar"
import {
  getCommunityFilterOptions,
  getCommunitySubjects,
} from "@/components/saas-marketing/community/queries"
import { communitySearchParams } from "@/components/saas-marketing/community/search-params"
import { CommunitySubjectsGrid } from "@/components/saas-marketing/community/subjects-grid"
import { CommunityTabsNav } from "@/components/saas-marketing/community/tabs-nav"

// Locale-aware metadata. The page is force-dynamic (reads searchParams +
// Prisma), so generateMetadata runs per-request — no build-time page-data
// cost. (It was previously hardcoded English to dodge the Vercel Hobby
// 45-min build ceiling; restored now that we're on Pro.)
export async function generateMetadata(props: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await props.params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.community?.title
      ? `${dictionary.community.title} — ${dictionary.community.lead ?? ""}`.trim()
      : "Community — Free Educational Resources",
    description:
      dictionary?.community?.lead ??
      "Open subjects, textbooks, mock exams, question banks, videos, and learning materials for educators and students.",
  }
}

// Page reads searchParams + Prisma — never statically renderable.
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

  const activeCurriculum = curriculum || "us-k12"
  const activeGrade = grade ?? 1

  const filters = {
    curriculum: activeCurriculum,
    grade: activeGrade,
    lang,
  }

  const [options, subjects] = await Promise.all([
    getCommunityFilterOptions(),
    getCommunitySubjects(filters),
  ])

  const heading = dictionary?.community?.title ?? "Community"
  const description =
    dictionary?.community?.lead ??
    "Browse open subjects, textbooks, exams, and learning materials. No account required."
  // Treat any change away from the defaults (us-k12 / grade 1) as "filtered"
  // for the empty-state reset link.
  const hasFilters = activeCurriculum !== "us-k12" || activeGrade !== 1

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 lg:px-0">
      <PageHeader
        className="border-border/50 dark:border-border border-b"
        heading={heading}
        description={description}
        headingClassName="max-w-2xl text-balance text-4xl font-semibold tracking-tight lg:leading-[1.1] xl:text-5xl xl:tracking-tight"
        descriptionClassName="max-w-2xl text-balance text-base font-light leading-7 sm:text-lg"
      />
      <div className="border-border/50 dark:border-border flex items-center justify-between gap-4 border-b-[0.5px] py-3">
        <div className="min-w-0 flex-1">
          <CommunityTabsNav
            active={activeGrade}
            options={options}
            currentCurriculum={activeCurriculum}
            dictionary={dictionary}
          />
        </div>
        <CommunityFilterBar options={options} dictionary={dictionary} />
      </div>
      <div className="mt-6">
        {subjects.length === 0 ? (
          <CommunityEmptyState
            dictionary={dictionary}
            resetHref={`/${lang}/community`}
            hasFilters={hasFilters}
          />
        ) : (
          <CommunitySubjectsGrid subjects={subjects} lang={lang} />
        )}
      </div>
    </div>
  )
}
