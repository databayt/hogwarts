"use client"

import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { getSubjectImage } from "@/components/platform/listings/subjects/image-map"
import { PublicCourseType } from "@/components/stream/data/course/get-all-courses"

// Default provider logos for categories
const providerLogos: Record<string, string> = {
  Technology:
    "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/cc/61dbdf2c1c475d82d3b8bf8eee1bda/MSFT-stacked-logo_FINAL.png",
  Business:
    "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/4a/cb36835ae3421187080898a7ecc11d/Google-G_360x360.png",
  AI: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/b4/5cb90bb92f420b99bf323a0356f451/Icon.png",
  default:
    "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/4a/cb36835ae3421187080898a7ecc11d/Google-G_360x360.png",
}

// Course types based on chapter count
const getCourseType = (chaptersCount: number): string => {
  if (chaptersCount >= 10) return "Professional Certificate"
  if (chaptersCount >= 5) return "Specialization"
  if (chaptersCount >= 3) return "Course"
  return "Short Course"
}

interface CourseCardProps {
  course: PublicCourseType
  lang: string
}

export function CourseCard({ course, lang }: CourseCardProps) {
  const chaptersCount = course._count.chapters
  const isRTL = lang === "ar"
  const providerName = course.category?.name || "Course"
  const providerLogo = providerLogos[providerName] || providerLogos.default
  const courseType = getCourseType(chaptersCount)
  const fallbackImage = getSubjectImage(
    course.title || course.category?.name || ""
  )

  return (
    <Link
      href={`/${lang}/stream/courses/${course.slug}`}
      className="group block"
    >
      {/* Card Image */}
      <div className="relative aspect-video overflow-hidden rounded-xl">
        <Image
          src={course.imageUrl || fallbackImage}
          alt={course.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      {/* Content */}
      <div className="space-y-1.5 px-2 pt-3 text-start">
        {/* Provider */}
        <div className="flex items-center gap-1.5 rtl:flex-row-reverse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={providerLogo}
            alt={providerName}
            className="h-4 w-4 object-contain"
          />
          <span className="text-muted-foreground text-xs">{providerName}</span>
        </div>

        {/* Title */}
        <h3 className="group-hover:text-primary line-clamp-2 text-sm leading-tight font-semibold transition-colors">
          {course.title}
        </h3>

        {/* Type */}
        <p className="text-muted-foreground text-xs">{courseType}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 rtl:flex-row-reverse">
          <Star className="text-foreground h-3 w-3 fill-current" />
          <span className="text-xs font-medium">4.8</span>
        </div>
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
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  )
}
