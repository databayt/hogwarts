"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { BookOpen } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { SeeMore } from "@/components/atom/see-more"
import type { CatalogCourseType } from "@/components/stream/data/catalog/get-all-courses"
import { getAllCatalogCourses } from "@/components/stream/data/catalog/get-all-courses"
import { SearchBar } from "@/components/stream/search-bar"

import { CourseCard, CourseCardSkeleton } from "./course-card"

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

interface Props {
  dictionary: any
  lang: string
  schoolId: string | null
  courses: CatalogCourseType[]
  totalCount: number
  page: number
  perPage: number
  activeGrade: string
}

export function StreamCoursesContent({
  dictionary,
  lang,
  schoolId,
  courses,
  totalCount,
  page,
  perPage,
  activeGrade,
}: Props) {
  const isRTL = lang === "ar"
  const df = dictionary?.stream?.coursesFilter
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [allCourses, setAllCourses] = useState(courses)
  const [currentPage, setCurrentPage] = useState(page)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setAllCourses(courses)
    setCurrentPage(page)
  }, [courses, page])

  const hasMore = allCourses.length < totalCount

  const handleGradeClick = useCallback(
    (grade: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("level", grade)
      params.delete("page")
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams]
  )

  const loadMore = () => {
    startTransition(async () => {
      const nextPage = currentPage + 1
      const { rows } = await getAllCatalogCourses(schoolId, {
        page: nextPage,
        perPage,
        grade: activeGrade ? parseInt(activeGrade) : undefined,
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
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 md:flex-row rtl:md:flex-row-reverse">
          <div className="relative flex size-28 shrink-0 items-center justify-center rounded-xl bg-[#D97757] p-4 md:size-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/anthropic/6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg"
              alt="Courses"
              className="size-20 md:size-24"
            />
          </div>
          <div className="text-center md:text-start">
            <h1 className="text-4xl leading-none font-bold md:text-5xl">
              {dictionary?.courses?.heroTitle || "Explore"}
              <br />
              {dictionary?.courses?.heroSubtitle || "courses"}
            </h1>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section>
        <SearchBar lang={lang} dictionary={dictionary} />
      </section>

      {/* Grade Toggle Badges */}
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
                  <CourseCard course={course} lang={lang} />
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
