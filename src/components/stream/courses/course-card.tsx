"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import type { CatalogCourseType } from "@/components/stream/data/catalog/get-all-courses"

// Course type key based on chapter count
const getCourseTypeKey = (chaptersCount: number): string => {
  if (chaptersCount >= 10) return "professionalCertificate"
  if (chaptersCount >= 5) return "specialization"
  if (chaptersCount >= 3) return "course"
  return "shortCourse"
}

const COURSE_TYPE_FALLBACKS: Record<string, string> = {
  professionalCertificate: "Professional Certificate",
  specialization: "Specialization",
  course: "Course",
  shortCourse: "Short Course",
}

// Keyed by the SchoolLevel enum as stored on Subject.levels.
const COURSE_LEVEL_FALLBACKS: Record<string, string> = {
  ELEMENTARY: "Elementary",
  MIDDLE: "Middle",
  HIGH: "High",
}

interface CourseCardProps {
  course: CatalogCourseType
  lang: string
  dictionary?: Record<string, any>
}

function CourseCardImpl({ course, lang, dictionary }: CourseCardProps) {
  const [imageError, setImageError] = useState(false)
  const chaptersCount = course._count.chapters
  const courseTypeKey = getCourseTypeKey(chaptersCount)
  const ct = dictionary?.courseTypes as Record<string, string> | undefined
  const cl = dictionary?.courseLevels as Record<string, string> | undefined
  const courseType = ct?.[courseTypeKey] ?? COURSE_TYPE_FALLBACKS[courseTypeKey]
  // `levels` holds raw SchoolLevel enum values; the department name arrives
  // pre-translated from the fetcher, so only the enum needs the dictionary.
  const rawLevel = course._catalog?.levels?.[0]
  const levelLabel = rawLevel
    ? (cl?.[rawLevel] ?? COURSE_LEVEL_FALLBACKS[rawLevel] ?? rawLevel)
    : course.category?.name || (ct?.course ?? COURSE_TYPE_FALLBACKS.course)
  const catalogColor = course._catalog?.color

  return (
    <Link
      href={`/${lang}/stream/courses/${course.slug}`}
      className="group block"
    >
      {/* Card Image */}
      <div className="relative aspect-video overflow-hidden rounded-xl">
        {course.imageUrl && !imageError ? (
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div
            className="h-full w-full rounded-xl"
            style={{
              backgroundColor: catalogColor || "#e5e7eb",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="space-y-1.5 px-2 pt-3 text-start">
        {/* Provider / Department */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">{levelLabel}</span>
        </div>

        {/* Title */}
        <h3 className="group-hover:text-primary overflow-hidden text-sm leading-tight font-semibold whitespace-nowrap transition-colors">
          {course.title}
        </h3>

        {/* Type */}
        <p className="text-muted-foreground text-xs">{courseType}</p>

        {/* Rating */}
        {course._catalog?.averageRating != null &&
          course._catalog.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium">
                {course._catalog.averageRating.toFixed(1)}
              </span>
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
              <span className="text-muted-foreground text-xs">
                ({course._count.enrollments})
              </span>
            </div>
          )}
      </div>
    </Link>
  )
}

// Memoized — hovering the courses grid churns the parent's hover state; with
// memo, only the hovered wrapper re-renders, not all N cards. Props are stable
// per item (course/lang/dictionary).
export const CourseCard = memo(CourseCardImpl)

export function CourseCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="space-y-1 pt-3">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}
