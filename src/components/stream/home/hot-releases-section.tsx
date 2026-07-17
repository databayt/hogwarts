// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Star } from "lucide-react"

import type { CatalogCourseType } from "@/components/stream/data/catalog/get-all-courses"

// Course type key by chapter count — mirrors courses/course-card.tsx so the
// same course is badged identically here and in the catalog grid.
const getCourseTypeKey = (chaptersCount: number): string => {
  if (chaptersCount >= 10) return "professionalCertificate"
  if (chaptersCount >= 5) return "specialization"
  if (chaptersCount >= 3) return "course"
  return "shortCourse"
}

const COURSE_LEVEL_FALLBACKS: Record<string, string> = {
  ELEMENTARY: "Elementary",
  MIDDLE: "Middle",
  HIGH: "High",
}

interface Props {
  dictionary: Record<string, any>
  lang: string
  courses: CatalogCourseType[]
}

/**
 * "New releases" strip — real Subjects from THIS school's catalog selection,
 * passed down by the stream page.
 *
 * This section previously rendered four invented courses ("PyTorch for Deep
 * Learning", …) with fabricated 4.7–4.9 ratings and artwork hotlinked from
 * Coursera's CDN, every card linking to the generic catalog page. Everything
 * here now comes from the database: no course is shown unless the school
 * actually offers it, ratings render only when a real one exists, and each card
 * links to its own course. If the school has no selections yet, the section
 * renders nothing rather than inventing filler.
 */
export function HotReleasesSection({ dictionary, lang, courses }: Props) {
  if (courses.length === 0) return null

  const ct = dictionary?.courseTypes as Record<string, string> | undefined
  const cl = dictionary?.courseLevels as Record<string, string> | undefined

  return (
    <section className="mb-16 rounded-xl bg-[#BCD1CA] py-6">
      <div className="px-6">
        {/* Title Row */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {dictionary?.hotReleases?.title || "New releases"}
          </h2>
          <Link
            href={`/${lang}/stream/courses`}
            className="text-foreground hover:text-primary transition-colors"
          >
            <ArrowRight className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => {
            const typeKey = getCourseTypeKey(course._count.chapters)
            const rawLevel = course._catalog?.levels?.[0]
            const level = rawLevel
              ? (cl?.[rawLevel] ?? COURSE_LEVEL_FALLBACKS[rawLevel] ?? rawLevel)
              : course.category?.name
            const rating = course._catalog?.averageRating

            return (
              <Link
                key={course.id}
                href={`/${lang}/stream/courses/${course.slug}`}
                className="group bg-background block overflow-hidden rounded-xl"
              >
                {/* Card Image — the catalog thumbnail, or the subject's own
                    colour when it has none. */}
                <div className="aspect-video overflow-hidden">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      width={320}
                      height={180}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundColor: course._catalog?.color || "#e5e7eb",
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2 p-4 text-start">
                  {level && (
                    <span className="text-muted-foreground text-xs">
                      {level}
                    </span>
                  )}

                  <h3 className="group-hover:text-primary line-clamp-2 text-sm leading-tight font-semibold transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-muted-foreground text-xs">
                    {ct?.[typeKey] ?? ""}
                  </p>

                  {/* Rating — only when the course actually has one. */}
                  {rating != null && rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="text-foreground h-3 w-3 fill-current" />
                      <span className="text-xs font-medium">
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
