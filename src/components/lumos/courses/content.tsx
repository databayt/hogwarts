"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { BookOpen } from "lucide-react"

import { asset } from "@/lib/asset-url"
import { Card, CardContent } from "@/components/ui/card"
import { SeeMore } from "@/components/atom/see-more"
import type { CatalogCourseType } from "@/components/lumos/data/catalog/get-all-courses"
import type { ContinueWatchingItem } from "@/components/lumos/data/catalog/get-continue-watching"
import type { CourseShelf as CourseShelfData } from "@/components/lumos/data/catalog/get-course-shelves"
import type { StartHereItem } from "@/components/lumos/data/catalog/get-start-here"
import { fetchCatalogCourses } from "@/components/lumos/lib/course-search-client"
import { SearchBar } from "@/components/lumos/search-bar"

import {
  ContinueLearningCard,
  type LeadCardItem,
} from "./continue-learning-card"
import { CourseCard, CourseCardSkeleton } from "./course-card"
import { CourseShelf } from "./course-shelf"

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/** How many of the grade's courses lead as the shelf, before the grid. */
const RECOMMENDED_COUNT = 6

/** How many of the remaining courses the grid shows before "See more". */
const OTHERS_PAGE_SIZE = 12

interface Props {
  dictionary: Record<string, any>
  lang: string
  courses: CatalogCourseType[]
  totalCount: number
  page: number
  perPage: number
  activeGrade: string
  /** Active free-text search query (empty when browsing). */
  search?: string
  /**
   * Both kept for the page's call shape. Neither branches anything here any
   * more: the grade badges show for every role, and the shelves' per-viewer
   * reads all happen on the server.
   */
  userRole?: string | null
  userId?: string | null
  /** One shelf per grade the school offers. Only read while browsing. */
  shelves?: CourseShelfData[]
  /** In-progress lessons for this viewer; drives the first shelf. */
  continueWatching?: ContinueWatchingItem[]
  /**
   * The viewer's own grade, when they have one (students do). Drives the
   * "Recommended for you" shelf; every other role gets no such shelf, because
   * this catalog carries no honest signal to build one from — ratings are
   * unset and usage counts are uniform across every row.
   */
  recommendedGrade?: number | null
  /** Which grade the browse view is showing, resolved on the server. */
  effectiveGrade?: number | null
  /**
   * The opening lesson of the grade's first course, resolved only when nothing
   * is in progress. Keeps the lead card from vanishing for a new learner.
   */
  startHere?:
    | (StartHereItem & {
        courseId: string
        courseTitle: string
        grade: number | null
        totalLessons: number
      })
    | null
}

export function LumosCoursesContent({
  dictionary,
  lang,
  courses,
  totalCount,
  page,
  perPage,
  activeGrade,
  search,
  shelves = [],
  continueWatching = [],
  recommendedGrade = null,
  effectiveGrade = null,
  startHere = null,
}: Props) {
  const isRTL = lang === "ar"
  // Rendered width of each headline line, per 100px of font size, measured in
  // the browser against thmanyah sans at the weights the h1 uses: the title at
  // 700, the tagline at 300. Their ratio is the `em` size that makes the
  // tagline exactly as wide as the title above it. Re-measure with a canvas if
  // the copy, the face or either weight changes — the match is specific to all
  // three. Same technique as the /lumos home hero.
  const HEADLINE_WIDTHS: Record<string, { title: number; tagline: number }> = {
    ar: { title: 714.0, tagline: 833.2 },
    en: { title: 765.6, tagline: 900.7 },
  }
  const widths = HEADLINE_WIDTHS[lang] ?? HEADLINE_WIDTHS.en
  const headlineRatio = (widths.title / widths.tagline).toFixed(4)
  const df = dictionary?.coursesFilter
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [allCourses, setAllCourses] = useState(courses)
  const [currentPage, setCurrentPage] = useState(page)
  const [isPending, startTransition] = useTransition()

  // Reset the accumulated list only when the server actually queried something
  // different (grade badge / page / search). Keying on the `courses` array
  // itself would reset on every server render — and calling the load-more
  // action re-renders this route, which used to wipe the appended pages the
  // moment they arrived.
  const serverKey = `${activeGrade}|${search ?? ""}|${page}|${totalCount}`
  const [prevServerKey, setPrevServerKey] = useState(serverKey)
  if (serverKey !== prevServerKey) {
    setPrevServerKey(serverKey)
    setAllCourses(courses)
    setCurrentPage(page)
  }

  const hasMore = allCourses.length < totalCount

  // Only a SEARCH leaves the browse view — a result set has no shelves, so it
  // falls through to the flat, paginated grid below.
  const showShelves = !search && shelves.length > 0

  const sh = dictionary?.courses?.shelves as Record<string, string> | undefined
  // "الأول" / "First" … indexed by grade number. Derived from the NUMBER, never
  // from `AcademicGrade.name`: school grade names are prose, translate
  // inconsistently, and do not sort.
  const gradeOrdinals =
    (dictionary?.courses?.gradeOrdinals as string[] | undefined) ?? []

  // ONE grade at a time. The page shows the grade badge that is active, and
  // opens on the viewer's own grade when they have one — a student's grade —
  // falling back to the lowest the school offers. Everything below is that
  // grade and nothing else: a learner asking for grade 10 should not have
  // grade 9 and 11 mixed into the same page.
  //
  // Resolved on the server (the start-here fallback needs it to pick a course);
  // the same expression is kept here so a caller that omits the prop still
  // renders correctly.
  const shownGrade =
    effectiveGrade ??
    (activeGrade ? Number(activeGrade) : null) ??
    recommendedGrade ??
    shelves[0]?.grade ??
    null
  const gradeCourses =
    shelves.find((sf) => sf.grade === shownGrade)?.courses ?? []
  // The viewer's own grade, as a shelf. Courses they are already part-way
  // through sit in the Continue shelf directly above, so repeating them here
  // would make the first two shelves near-identical.
  // The lead card, in its two states. It is NEVER absent: with nothing in
  // progress it opens the grade's first course at its first lesson, so a
  // first-time learner gets a way in rather than a page starting on a shelf.
  const resume = continueWatching[0]
  const lead: LeadCardItem | null = resume
    ? {
        href: `/${lang}/lumos/courses/${resume.courseSlug}/${resume.lessonId}`,
        courseTitle: resume.courseTitle,
        grade: resume.grade,
        chapterTitle: resume.chapterTitle,
        lessonTitle: resume.lessonTitle,
        thumbnailUrl: resume.thumbnailUrl,
        color: resume.color,
        instructor: resume.instructor,
        statusLabel: sh?.resume ?? "Resume",
        // Minutes, matching the live card's clock. Rounded UP for the total and
        // DOWN for the part done, so a lesson never reads as finished while it
        // still has seconds left on it.
        statusDetail: (sh?.progress ?? "{done} of {total} min")
          .replace("{done}", String(Math.floor(resume.watchedSeconds / 60)))
          .replace(
            "{total}",
            String(Math.max(1, Math.ceil(resume.totalSeconds / 60)))
          ),
      }
    : startHere
      ? {
          href: `/${lang}/lumos/courses/${startHere.courseSlug}/${startHere.lessonId}`,
          courseTitle: startHere.courseTitle,
          grade: startHere.grade,
          chapterTitle: startHere.chapterTitle,
          lessonTitle: startHere.lessonTitle,
          thumbnailUrl: startHere.thumbnailUrl,
          color: startHere.color,
          instructor: startHere.instructor,
          statusLabel: sh?.start ?? "Start",
          statusDetail:
            startHere.totalLessons > 0
              ? (sh?.lessons ?? "{n} lessons").replace(
                  "{n}",
                  String(startHere.totalLessons)
                )
              : null,
        }
      : null

  // The grade's own courses, split across the two sections below. Whatever the
  // lead card is showing is dropped from both, rather than appearing three
  // times on one page.
  const leadSlugs = new Set(
    [resume?.courseSlug, startHere?.courseSlug].filter(Boolean) as string[]
  )
  const available = gradeCourses.filter((c) => !leadSlugs.has(c.slug))

  // The shelf leads, the grid holds the rest — the same grade throughout, and
  // together exactly the courses that grade has. The shelf is the whole grade
  // only when the grade is small enough to fit in one; there is no ordering
  // signal here beyond the catalog's own, because `averageRating` is unset on
  // every row and `usageCount` is identical across them.
  const recommended = available.slice(0, RECOMMENDED_COUNT)
  const others = available.slice(RECOMMENDED_COUNT)

  // Paged in the browser, not over the network: the shelves read already
  // carries every course the school offers, so asking the server for the next
  // page would re-fetch rows this component is holding.
  const [visibleOthers, setVisibleOthers] = useState(OTHERS_PAGE_SIZE)
  const visible = others.slice(0, visibleOthers)

  const handleGradeClick = useCallback(
    (grade: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("level", grade)
      params.delete("page")
      params.delete("search")
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams]
  )

  // Reads the JSON route rather than the server-side fetcher directly: a
  // client-invoked server action makes Next ship a full RSC re-render of this
  // page with the response, so appending 12 cards used to cost ~1MB.
  const loadMore = () => {
    startTransition(async () => {
      const nextPage = currentPage + 1
      try {
        const { rows } = await fetchCatalogCourses({
          page: nextPage,
          perPage,
          grade: activeGrade ? parseInt(activeGrade) : undefined,
          q: search || undefined,
          lang,
        })
        setAllCourses((prev) => [...prev, ...rows])
        setCurrentPage(nextPage)
      } catch {
        // Keep what is already on screen; the button stays available to retry.
      }
    })
  }

  return (
    <div className="space-y-10 py-6">
      {/* Hero Section */}
      <section className="py-8">
        <div className="mx-auto flex max-w-2xl flex-row items-center justify-center gap-4 md:gap-6">
          <div className="relative flex size-20 shrink-0 items-center justify-center rounded-xl bg-[#D97757] p-3 md:size-32 md:p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(
                "https://cdn.databayt.org/anthropic/6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg"
              )}
              alt=""
              className="size-14 md:size-24"
            />
          </div>
          <div className="min-w-0 text-start">
            {/* The /live banner's headline, and the /lumos hero's: two lines
                in thmanyah sans set to the SAME WIDTH, the first carrying the
                weight and the second running light beneath it. The tagline's
                size is an `em` of the h1's own, so the pair stays matched at
                every breakpoint from one size ladder. See HEADLINE_WIDTHS for
                what the ratio is measured against — the copy, the face and
                the two weights are all load-bearing. */}
            <h1
              className="text-3xl leading-[1.1] font-bold sm:text-4xl md:text-5xl"
              style={{ fontFamily: '"thmanyah sans", sans-serif' }}
            >
              {dictionary?.courses?.heroTitle || "Explore Courses"}
              <span
                className="mt-1 block font-light"
                style={{ fontSize: `${headlineRatio}em` }}
              >
                {dictionary?.courses?.heroTagline || "One for every grade."}
              </span>
            </h1>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section>
        <SearchBar
          lang={lang}
          dictionary={dictionary}
          grade={activeGrade ? parseInt(activeGrade) : undefined}
        />
      </section>

      {/* Grade badges — every role gets them, students included. They used to
          be hidden for students because the /lumos redirect pinned those
          viewers to `?level=<their grade>` and the strip would only have
          echoed it back. The redirect now lands on the browse view, so the
          badges are how anyone leaves it, and hiding them from students would
          leave the one role that arrives here by default with no way out.

          The highlight follows the filter when one is applied, and otherwise
          marks the viewer's OWN grade — so a student browsing the shelves can
          still see which grade is theirs without that being a filter they have
          to clear. */}
      <section className="flex flex-wrap items-center gap-2">
        {GRADES.map((g) => {
          const isActive = shownGrade === g
          // The one that is open swaps its numeral FOR its name; the rest stay
          // numerals. Twelve spelled-out ordinals is a paragraph, not a filter
          // — but a lone numeral is a poor label for the grade a reader is
          // actually in, and the ordinal is what a school calls it out loud.
          // Printing both was the number twice.
          const ordinal = isActive ? gradeOrdinals[g - 1] : null
          return (
            <button
              key={g}
              onClick={() => handleGradeClick(String(g))}
              aria-current={isActive ? "true" : undefined}
              aria-label={gradeOrdinals[g - 1] ?? String(g)}
              className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {ordinal ?? <span className="tabular-nums">{g}</span>}
            </button>
          )
        })}
      </section>

      {showShelves ? (
        <div className="space-y-10">
          {/* Where the learner left off, first — the one row that is about
              them rather than about the catalog, and the only one that is a
              single card rather than a shelf. Absent entirely when they have
              started nothing, which is every first-time learner. */}
          {lead ? (
            <ContinueLearningCard
              item={lead}
              title={
                resume
                  ? (sh?.continueLearning ?? "Continue learning")
                  : (sh?.startHere ?? "Start here")
              }
              dictionary={dictionary}
            />
          ) : null}

          <CourseShelf
            title={sh?.recommended || "Recommended"}
            courses={recommended}
            lang={lang}
            dictionary={dictionary}
          />

          {/* The rest of the catalog as a grid rather than a shelf per grade.
              Twelve scrollers of near-identical subject tiles made the page a
              wall of horizontal rows; one grid, nearest-grade first, reads as
              "and here is everything else" — which is what it is. */}
          {visible.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">{sh?.more || "More"}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6">
                {visible.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    lang={lang}
                    dictionary={dictionary}
                    compact
                  />
                ))}
              </div>
              <SeeMore
                hasMore={visible.length < others.length}
                onClick={() => setVisibleOthers((n) => n + OTHERS_PAGE_SIZE)}
                label={df?.seeMore || "See More"}
                className="pt-2"
              />
            </section>
          ) : null}
        </div>
      ) : allCourses.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-4 size-16" />
              <h3>{df?.noCoursesAvailable || "No Courses Available"}</h3>
              <p className="muted mb-6">
                {df?.noCoursesAvailableDesc ||
                  "There are currently no courses available. Check back soon!"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {allCourses.map((course, idx) => (
              <div
                key={course.id}
                className="group relative block h-full w-full p-2"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <AnimatePresence>
                  {hoveredIndex === idx && (
                    <motion.span
                      className="bg-muted dark:bg-muted/80 absolute inset-0 block h-full w-full rounded-2xl"
                      layoutId="courseHoverBackground"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: { duration: 0.15 },
                      }}
                      exit={{
                        opacity: 0,
                        transition: { duration: 0.15, delay: 0.2 },
                      }}
                    />
                  )}
                </AnimatePresence>
                <div className="relative z-10">
                  <CourseCard
                    course={course}
                    lang={lang}
                    dictionary={dictionary}
                    showGrade
                  />
                </div>
              </div>
            ))}
          </div>

          {/* See More */}
          <SeeMore
            hasMore={hasMore}
            isLoading={isPending}
            onClick={loadMore}
            label={df?.seeMore || "See More"}
          />
        </>
      )}
    </div>
  )
}

export function LumosCoursesLoadingSkeleton() {
  return (
    <div className="space-y-10 py-6">
      {/* Hero section */}
      <section className="py-8">
        <div className="mx-auto flex max-w-2xl flex-row items-center justify-center gap-4 md:gap-6">
          <div className="bg-muted size-20 shrink-0 animate-pulse rounded-xl md:size-32" />
          <div className="space-y-2 text-start">
            <div className="bg-muted h-9 w-44 animate-pulse rounded md:h-12 md:w-64" />
            <div className="bg-muted h-8 w-44 animate-pulse rounded md:h-10 md:w-64" />
          </div>
        </div>
      </section>

      {/* Search bar */}
      <section>
        <div className="bg-muted mx-auto h-11 w-full max-w-2xl animate-pulse rounded-full" />
      </section>

      {/* Course cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="p-2">
            <CourseCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  )
}
