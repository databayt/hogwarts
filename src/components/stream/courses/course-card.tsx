"use client";

import { BookOpen, Star } from "lucide-react";
import Link from "next/link";
import { PublicCourseType } from "@/components/stream/data/course/get-all-courses";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Default provider logos for categories
const providerLogos: Record<string, string> = {
  "Technology": "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/cc/61dbdf2c1c475d82d3b8bf8eee1bda/MSFT-stacked-logo_FINAL.png",
  "Business": "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/4a/cb36835ae3421187080898a7ecc11d/Google-G_360x360.png",
  "AI": "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/b4/5cb90bb92f420b99bf323a0356f451/Icon.png",
  "default": "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/4a/cb36835ae3421187080898a7ecc11d/Google-G_360x360.png",
};

// Course types based on chapter count
const getCourseType = (chaptersCount: number): string => {
  if (chaptersCount >= 10) return "Professional Certificate";
  if (chaptersCount >= 5) return "Specialization";
  if (chaptersCount >= 3) return "Course";
  return "Short Course";
};

interface CourseCardProps {
  course: PublicCourseType;
  lang: string;
}

export function CourseCard({ course, lang }: CourseCardProps) {
  const chaptersCount = course._count.chapters;
  const isRTL = lang === "ar";
  const providerName = course.category?.name || "Course";
  const providerLogo = providerLogos[providerName] || providerLogos.default;
  const courseType = getCourseType(chaptersCount);

  return (
    <Link
      href={`/${lang}/stream/courses/${course.slug}`}
      className="block group"
    >
      {/* Card Image */}
      <div className="overflow-hidden aspect-video rounded-xl">
        {course.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.imageUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center rounded-xl">
            <BookOpen className="size-16 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("pt-3 px-2 space-y-1.5", isRTL && "text-right")}>
        {/* Provider */}
        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={providerLogo}
            alt={providerName}
            className="h-4 w-4 object-contain"
          />
          <span className="text-xs text-muted-foreground">{providerName}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {/* Type */}
        <p className="text-xs text-muted-foreground">
          {courseType}
        </p>

        {/* Rating */}
        <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
          <Star className="h-3 w-3 fill-current text-foreground" />
          <span className="text-xs font-medium">4.8</span>
        </div>
      </div>
    </Link>
  );
}

export function CourseCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="pt-3 space-y-1">
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
  );
}
