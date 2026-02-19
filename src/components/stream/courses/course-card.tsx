"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import type { CatalogCourseType } from "@/components/stream/data/catalog/get-all-courses"

// Course types based on chapter count
const getCourseType = (chaptersCount: number): string => {
  if (chaptersCount >= 10) return "Professional Certificate"
  if (chaptersCount >= 5) return "Specialization"
  if (chaptersCount >= 3) return "Course"
  return "Short Course"
}

interface CourseCardProps {
  course: CatalogCourseType
  lang: string
}

export function CourseCard({ course, lang }: CourseCardProps) {
  const [imageError, setImageError] = useState(false)
  const chaptersCount = course._count.chapters
  const levelLabel = course._catalog?.levels?.[0]
    ? course._catalog.levels[0].charAt(0) +
      course._catalog.levels[0].slice(1).toLowerCase()
    : course.category?.name || "Course"
  const courseType = getCourseType(chaptersCount)
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
        <div className="flex items-center gap-1.5 rtl:flex-row-reverse">
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
