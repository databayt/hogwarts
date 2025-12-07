"use client";

import { BookOpen, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PublicCourseType } from "@/components/stream/data/course/get-all-courses";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  course: PublicCourseType;
  lang: string;
}

export function CourseCard({ course, lang }: CourseCardProps) {
  const chaptersCount = course._count.chapters;
  const enrollmentsCount = course._count.enrollments;
  const isRTL = lang === "ar";

  return (
    <Link
      href={`/${lang}/stream/courses/${course.slug}`}
      className="block group bg-background rounded-xl overflow-hidden"
    >
      {/* Card Image */}
      <div className="overflow-hidden aspect-video">
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300 !relative"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <BookOpen className="size-16 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("p-4 space-y-2", isRTL && "text-right")}>
        {/* Category */}
        {course.category && (
          <p className="text-xs text-muted-foreground">
            {course.category.name}
          </p>
        )}

        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {/* Stats */}
        <div className={cn("flex items-center gap-3 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
            <BookOpen className="size-3" />
            <span>{chaptersCount}</span>
          </div>
          <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
            <Users className="size-3" />
            <span>{enrollmentsCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-background rounded-xl overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}
