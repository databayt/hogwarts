"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { BookOpen, Plus } from "lucide-react"

import { asset } from "@/lib/asset-url"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SeeMore } from "@/components/atom/see-more"
import type { CatalogCourseType } from "@/components/stream/data/catalog/get-all-courses"
import { getAllCatalogCourses } from "@/components/stream/data/catalog/get-all-courses"
import { SearchBar } from "@/components/stream/search-bar"

import { CourseCard, CourseCardSkeleton } from "./course-card"

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

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
  userRole?: string | null
  userId?: string | null
}

export function StreamCoursesContent({
  dictionary,
  lang,
  courses,
  totalCount,
  page,
  perPage,
  activeGrade,
  search,
  userRole,
  userId,
}: Props) {
  const isRTL = lang === "ar"
  const df = dictionary?.coursesFilter
  const isAdmin =
    userRole === "ADMIN" || userRole === "TEACHER" || userRole === "DEVELOPER"
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

  const loadMore = () => {
    startTransition(async () => {
      const nextPage = currentPage + 1
      const { rows } = await getAllCatalogCourses({
        page: nextPage,
        perPage,
        grade: activeGrade ? parseInt(activeGrade) : undefined,
        search: search || undefined,
        lang,
      })
      setAllCourses((prev) => [...prev, ...rows])
      setCurrentPage(nextPage)
    })
  }

  return (
    <div className="space-y-10 py-6">
      {/* Hero Section */}
      <section className="py-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 md:flex-row">
          <div className="relative flex size-28 shrink-0 items-center justify-center rounded-xl bg-[#D97757] p-4 md:size-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(
                "https://cdn.databayt.org/anthropic/6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg"
              )}
              alt=""
              className="size-20 md:size-24"
            />
          </div>
          <div className="text-center md:text-start">
            <h1 className="text-4xl leading-none font-bold md:text-5xl">
              {dictionary?.courses?.title || "Explore Courses"}
            </h1>
            {isAdmin && (
              <div className="mt-4">
                <Link
                  href={`/${lang}/stream/settings`}
                  className={buttonVariants({ size: "sm" })}
                >
                  <Plus className="me-2 size-4" />
                  {dictionary?.settings?.title || "Manage Courses"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section>
        <SearchBar lang={lang} dictionary={dictionary} />
      </section>

      {/* Grade Toggle Badges — hidden for students (they're locked to their own grade via the /stream redirect) */}
      {userRole !== "STUDENT" && (
        <section className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => handleGradeClick(String(g))}
              className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                activeGrade === String(g)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {g}
            </button>
          ))}
        </section>
      )}

      {allCourses.length === 0 ? (
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

export function StreamCoursesLoadingSkeleton() {
  return (
    <div className="space-y-10 py-6">
      {/* Hero section */}
      <section className="py-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 md:flex-row">
          <div className="bg-muted size-28 shrink-0 animate-pulse rounded-xl md:size-32" />
          <div className="space-y-2 text-center md:text-start">
            <div className="bg-muted mx-auto h-10 w-48 animate-pulse rounded md:mx-0 md:h-12" />
            <div className="bg-muted mx-auto h-10 w-36 animate-pulse rounded md:mx-0 md:h-12" />
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
