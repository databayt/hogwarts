// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import { Metadata } from "next"
import { auth } from "@/auth"

import { getPolicyContext } from "@/lib/rbac/context"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  LumosCoursesContent,
  LumosCoursesLoadingSkeleton,
} from "@/components/lumos/courses/content"
import { getAllCatalogCourses } from "@/components/lumos/data/catalog/get-all-courses"
import { getContinueWatching } from "@/components/lumos/data/catalog/get-continue-watching"
import { getCourseShelves } from "@/components/lumos/data/catalog/get-course-shelves"
import { getStartHereLesson } from "@/components/lumos/data/catalog/get-start-here"
import { lumosCoursesSearchParams } from "@/components/lumos/list-params"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.lumos?.courses?.title || "All Courses",
    description:
      dictionary.lumos?.courses?.description ||
      "Browse our comprehensive course catalog",
  }
}

export default async function LumosCoursesPage({
  params,
  searchParams,
}: Props) {
  const { lang } = await params
  const [dictionary, { schoolId }, session] = await Promise.all([
    getDictionary(lang),
    getTenantContext(),
    auth(),
  ])
  const search = lumosCoursesSearchParams.parse(await searchParams)

  const userRole = session?.user?.role || null
  const userId = session?.user?.id || null

  return (
    <Suspense fallback={<LumosCoursesLoadingSkeleton />}>
      <CoursesRenderer
        lang={lang}
        schoolId={schoolId}
        dictionary={dictionary.lumos}
        search={search}
        userRole={userRole}
        userId={userId}
      />
    </Suspense>
  )
}

async function CoursesRenderer({
  lang,
  schoolId,
  dictionary,
  search,
  userRole,
  userId,
}: {
  lang: string
  schoolId: string | null
  dictionary: any
  search: {
    page: number
    perPage: number
    search: string
    title: string
    category: string
    level: string
    sort: { id: string; desc: boolean }[]
  }
  userRole: string | null
  userId: string | null
}) {
  if (!schoolId) {
    return (
      <LumosCoursesContent
        dictionary={dictionary}
        lang={lang}
        courses={[]}
        totalCount={0}
        page={1}
        perPage={12}
        activeGrade=""
        search=""
        userRole={userRole}
        userId={userId}
      />
    )
  }

  // Only a SEARCH leaves the browse view. A grade is not a different view of
  // this page — it is which grade the browse view is showing, and the shelves
  // read already holds every grade, so switching between them costs no query.
  const isBrowsing = !search.search

  const [{ rows, count }, shelfData, continueWatching, recommendedGrade] =
    await Promise.all([
      // Search only. The shelves already hold every course the school offers,
      // so running the paginated query alongside them would read and translate
      // the same rows twice for a grid nobody is looking at.
      isBrowsing
        ? Promise.resolve({ rows: [], count: 0 })
        : getAllCatalogCourses({
            page: search.page,
            perPage: search.perPage,
            search: search.search || undefined,
            title: search.title || undefined,
            category: search.category || undefined,
            grade: search.level ? parseInt(search.level) : undefined,
            lang,
          }),
      isBrowsing
        ? getCourseShelves(lang)
        : Promise.resolve({ shelves: [], total: 0 }),
      isBrowsing && userId ? getContinueWatching() : Promise.resolve([]),
      // The student's own grade. It is which grade the page OPENS on, and the
      // one honest basis this catalog offers for ordering anything by a person
      // — ratings are unset and usage counts are uniform across every row.
      // Every other role opens on the lowest grade the school offers.
      userRole === "STUDENT"
        ? getPolicyContext().then((ctx) => ctx.academicGradeNumber ?? null)
        : Promise.resolve(null),
    ])

  // Which grade the browse view is showing, resolved HERE rather than in the
  // client so the start-here fallback below can pick a course from it.
  const effectiveGrade =
    (search.level ? Number(search.level) : null) ??
    recommendedGrade ??
    shelfData.shelves[0]?.grade ??
    null

  // The lead card must never be absent. With nothing in progress, it opens the
  // first course of that grade instead — the same course the Recommended shelf
  // leads with, so the card is a way IN to the page's own first suggestion.
  const gradeCourses =
    shelfData.shelves.find((sf) => sf.grade === effectiveGrade)?.courses ?? []
  const startHere = continueWatching[0]
    ? null
    : await getStartHereLesson(
        gradeCourses.map((c) => ({ id: c.id, slug: c.slug })),
        lang
      )
  // Which course it landed on — not necessarily the first, since a course with
  // no published or non-hidden lesson is skipped over.
  const leadCourse = startHere
    ? gradeCourses.find((c) => c.id === startHere.courseId)
    : null

  return (
    <LumosCoursesContent
      dictionary={dictionary}
      lang={lang}
      courses={rows}
      totalCount={count}
      page={search.page}
      perPage={search.perPage}
      activeGrade={search.level || ""}
      search={search.search}
      userRole={userRole}
      userId={userId}
      shelves={shelfData.shelves}
      continueWatching={continueWatching}
      recommendedGrade={recommendedGrade}
      effectiveGrade={effectiveGrade}
      startHere={
        startHere && leadCourse
          ? {
              ...startHere,
              courseId: leadCourse.id,
              courseTitle: leadCourse.title,
              grade: leadCourse._catalog.grades?.[0] ?? null,
              totalLessons: leadCourse._catalog.totalLessons,
            }
          : null
      }
    />
  )
}
