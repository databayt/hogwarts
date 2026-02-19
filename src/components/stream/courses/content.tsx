"use client"

import { useState, useTransition } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { BookOpen, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { CatalogCourseType } from "@/components/stream/data/catalog/get-all-courses"
import { getAllCatalogCourses } from "@/components/stream/data/catalog/get-all-courses"
import { SearchBar } from "@/components/stream/search-bar"

import { CourseCard, CourseCardSkeleton } from "./course-card"

interface Props {
  dictionary: any
  lang: string
  schoolId: string | null
  courses: CatalogCourseType[]
  totalCount: number
  page: number
  perPage: number
}

export function StreamCoursesContent({
  dictionary,
  lang,
  schoolId,
  courses,
  totalCount,
  page,
  perPage,
}: Props) {
  const isRTL = lang === "ar"
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [allCourses, setAllCourses] = useState(courses)
  const [currentPage, setCurrentPage] = useState(page)
  const [isPending, startTransition] = useTransition()

  const hasMore = allCourses.length < totalCount

  const loadMore = () => {
    startTransition(async () => {
      const nextPage = currentPage + 1
      const { rows } = await getAllCatalogCourses(schoolId, {
        page: nextPage,
        perPage,
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

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-4 size-16" />
              <h3>{isRTL ? "لا توجد دورات متاحة" : "No Courses Available"}</h3>
              <p className="muted mb-6">
                {isRTL
                  ? "لا توجد دورات متاحة حالياً. تفقد لاحقاً!"
                  : "There are currently no courses available. Check back soon!"}
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
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                className="hover:bg-transparent hover:underline"
                onClick={loadMore}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                {isRTL ? "عرض المزيد" : "See More"}
              </Button>
            </div>
          )}
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
