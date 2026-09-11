"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { CatalogCourseType } from "@/components/lumos/data/catalog/get-all-courses"

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

interface CourseCardProps {
  course: CatalogCourseType
  lang: string
  dictionary?: Record<string, any>
  /**
   * Sizing for the context the card sits in. The grid lets it be fluid; a
   * shelf gives it a fixed width and stops it shrinking.
   */
  className?: string
  /**
   * Show the grade instead of the school level in the eyebrow.
   *
   * The catalog holds one Subject row per subject PER GRADE, and the grade
   * lives on the row rather than in its name — so any list spanning grades
   * renders "Arabic, Arabic, Arabic" with nothing to tell them apart. A shelf
   * that IS one grade carries it in the shelf title instead and leaves this
   * off.
   */
  showGrade?: boolean
  /** Denser type, for the grid where the cards sit three or more to a row. */
  compact?: boolean
}

function CourseCardImpl({
  course,
  lang,
  dictionary,
  className,
  showGrade = false,
  compact = false,
}: CourseCardProps) {
  const [imageError, setImageError] = useState(false)
  const chaptersCount = course._count.chapters
  const courseTypeKey = getCourseTypeKey(chaptersCount)
  const ct = dictionary?.courseTypes as Record<string, string> | undefined
  const courseType = ct?.[courseTypeKey] ?? COURSE_TYPE_FALLBACKS[courseTypeKey]
  // `levels` holds raw SchoolLevel enum values; the department name arrives
  // pre-translated from the fetcher, so only the enum needs the dictionary.
  // The eyebrow is the GRADE or nothing. It used to fall back to the school
  // level ("Elementary" / "ثانوي"), which on a page already scoped to one
  // grade said the same thing on every card and cost the card a third line —
  // so the card is now two lines, title and type, unless the grade is genuinely
  // telling the reader something (a list that spans grades: see `showGrade`).
  // `search.gradeLabel` is the existing "Grade {n}" template, in both
  // dictionaries.
  const grade = course._catalog?.grades?.[0]
  const eyebrow =
    showGrade && grade != null
      ? (dictionary?.search?.gradeLabel as string | undefined)?.replace(
          "{n}",
          String(grade)
        ) || `Grade ${grade}`
      : null
  const catalogColor = course._catalog?.color

  return (
    <Link
      href={`/${lang}/lumos/courses/${course.slug}`}
      className={cn("group block", className)}
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
      <div
        className={cn(
          "px-2 text-start",
          compact ? "space-y-1 pt-2" : "space-y-1.5 pt-3"
        )}
      >
        {/* Grade, on the lists that span several. */}
        {eyebrow ? (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">{eyebrow}</span>
          </div>
        ) : null}

        {/* Title */}
        <h3
          className={cn(
            "group-hover:text-primary overflow-hidden leading-tight font-semibold whitespace-nowrap transition-colors",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {course.title}
        </h3>

        {/* Type */}
        <p
          className={cn(
            "text-muted-foreground",
            compact ? "text-[11px]" : "text-xs"
          )}
        >
          {courseType}
        </p>

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
