// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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

// Static metadata — async generateMetadata + getDictionary triggers a
// dynamic-import storm during Next.js "Collecting page data" that pushed
// Vercel past the 45-min build timeout. The visible <h1> is still
// locale-aware via the dictionary at render time.
export const metadata = {
  title: "Community — Free Educational Resources",
  description:
    "Open subjects, textbooks, mock exams, question banks, videos, and learning materials for educators and students.",
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

  const filters = {
    curriculum: curriculum || "us-k12",
    grade: grade ?? undefined,
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
  const hasFilters = Boolean(curriculum && curriculum !== "us-k12") || !!grade

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 lg:px-0">
      <PageHeader
        className="border-border/50 dark:border-border border-b"
        heading={heading}
        description={description}
        headingClassName="max-w-2xl text-balance text-4xl font-semibold tracking-tight lg:leading-[1.1] xl:text-5xl xl:tracking-tight"
        descriptionClassName="max-w-2xl text-balance text-base font-light leading-7 sm:text-lg"
      />
      <CommunityTabsNav
        active={grade ?? null}
        options={options}
        currentCurriculum={curriculum || "us-k12"}
        dictionary={dictionary}
      />
      <CommunityFilterBar options={options} dictionary={dictionary} />
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
