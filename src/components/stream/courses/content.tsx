"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { BookOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { PublicCourseType } from "@/components/stream/data/course/get-all-courses"
import { SearchBar } from "@/components/stream/search-bar"

import { CourseCard, CourseCardSkeleton } from "./course-card"

interface Props {
  dictionary: any
  lang: string
  schoolId: string | null
  courses: PublicCourseType[]
  searchParams?: { category?: string; search?: string }
}

export function StreamCoursesContent({
  dictionary,
  lang,
  schoolId,
  courses,
  searchParams,
}: Props) {
  const isRTL = lang === "ar"
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Filter courses based on search params
  const filteredCourses = courses.filter((course) => {
    if (
      searchParams?.category &&
      course.category?.name !== searchParams.category
    ) {
      return false
    }
    if (searchParams?.search) {
      const searchLower = searchParams.search.toLowerCase()
      return (
        course.title.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="space-y-10 py-6">
      {/* Hero Section - Like "Come teach with us" */}
      <section className="py-8">
        <div
          className={cn(
            "mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 md:flex-row",
            isRTL && "md:flex-row-reverse"
          )}
        >
          {/* Hero Image */}
          <div className="relative flex size-28 shrink-0 items-center justify-center rounded-xl bg-[#D97757] p-4 md:size-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/anthropic/6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg"
              alt="Courses"
              className="size-20 md:size-24"
            />
          </div>

          {/* Text Content */}
          <div
            className={cn("text-center md:text-left", isRTL && "md:text-right")}
          >
            <h1 className="text-4xl leading-none font-bold md:text-5xl">
              {dictionary?.courses?.heroTitle || "Explore"}
              <br />
              {dictionary?.courses?.heroSubtitle || "courses"}
            </h1>
          </div>
        </div>
      </section>

      {/* Search Bar with Explore */}
      <section>
        <SearchBar lang={lang} dictionary={dictionary} />
      </section>

      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-4 size-16" />
              <h3>No Courses Available</h3>
              <p className="muted mb-6">
                There are currently no courses available. Check back soon!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filteredCourses.map((course, idx) => (
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
      )}
    </div>
  )
}

export function StreamCoursesLoadingSkeleton() {
  return (
    <div className="space-y-10 py-6">
      {/* Hero Section Skeleton */}
      <section className="py-8">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="relative flex size-40 shrink-0 items-center justify-center rounded-xl bg-[#D97757] p-6 md:size-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/anthropic/6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg"
              alt="Courses"
              className="size-32 md:size-36"
            />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl leading-tight font-bold md:text-5xl">
              Explore courses
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg">
              Explore our collection of courses and begin your learning journey
            </p>
          </div>
        </div>
      </section>

      {/* Search Bar Skeleton */}
      <section>
        <div className="bg-muted h-11 w-full animate-pulse rounded-full" />
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
