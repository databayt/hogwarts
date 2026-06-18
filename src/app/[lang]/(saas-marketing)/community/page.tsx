// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { PageHeader } from "@/components/atom/page-header"
import { TwoButtons } from "@/components/atom/two-buttons"
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

  const activeCurriculum = curriculum || "US"
  const activeGrade = grade ?? 1

  const filters = {
    curriculum: activeCurriculum,
    grade: activeGrade,
    lang,
  }

  const [options, gradeScoped] = await Promise.all([
    getCommunityFilterOptions(),
    getCommunitySubjects(filters),
  ])

  // Some curricula only carry higher grades (e.g. CAIE-IGCSE 10-11, CBSE grade
  // 10 only), so the default grade=1 would render an empty grid even though the
  // curriculum has subjects. When the grade-scoped query is empty, fall back to
  // every grade for that curriculum so the hub always shows its subjects.
  const subjects =
    gradeScoped.length > 0
      ? gradeScoped
      : await getCommunitySubjects({ curriculum: activeCurriculum, lang })

  const heading = dictionary?.community?.title ?? "The Room of Requirement"
  const description =
    dictionary?.community?.lead ??
    "Every textbook, mock exam, and lesson you need — open to all, no account required."

  // Announcement pill + Browse/Request buttons — mirrors the /features hero.
  const hero = dictionary?.community?.hero
  const pill = hero?.pill ?? "New mock exam is here"
  const browseLabel = hero?.browse ?? "Browse Subjects"
  const requestLabel = hero?.request ?? "Request a Resource"
  // Treat any change away from the defaults (US / grade 1) as "filtered"
  // for the empty-state reset link.
  const hasFilters = activeCurriculum !== "US" || activeGrade !== 1

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-16 lg:px-0">
      <PageHeader
        className="border-border/50 dark:border-border border-b"
        announcement={
          <Link
            href="#subjects"
            className="group mb-2 inline-flex items-center gap-2 px-0.5 text-sm font-medium"
          >
            <Image
              src="/feature/exam.png"
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 object-contain"
            />
            <span className="underline-offset-4 group-hover:underline">
              {pill}
            </span>
            <ArrowRight className="ms-1 h-4 w-4 rtl:hidden" />
            <ArrowLeft className="ms-1 hidden h-4 w-4 rtl:block" />
          </Link>
        }
        heading={heading}
        description={description}
        headingClassName="max-w-2xl text-balance text-4xl font-semibold tracking-tight lg:leading-[1.1] xl:text-5xl xl:tracking-tight"
        descriptionClassName="max-w-2xl text-balance text-base font-light leading-7 sm:text-lg"
        actions={
          <TwoButtons
            primaryLabel={browseLabel}
            primaryHref="#subjects"
            secondaryLabel={requestLabel}
            secondaryHref={`/${lang}/contact`}
          />
        }
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
      <div id="subjects" className="mt-6 scroll-mt-24">
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
