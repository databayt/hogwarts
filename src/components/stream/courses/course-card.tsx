"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PublicCourseType } from "@/components/stream/data/course/get-all-courses";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseCardProps {
  course: PublicCourseType;
  lang: string;
}

export function CourseCard({ course, lang }: CourseCardProps) {
  const chaptersCount = course._count.chapters;
  const enrollmentsCount = course._count.enrollments;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/${lang}/stream/courses/${course.slug}`}>
        <div className="relative aspect-video w-full overflow-hidden">
          {course.imageUrl ? (
            <Image
              src={course.imageUrl}
              alt={course.title}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <BookOpen className="size-16 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/${lang}/stream/courses/${course.slug}`} className="flex-1">
            <h3 className="hover:text-primary transition-colors line-clamp-2">
              {course.title}
            </h3>
          </Link>
          {course.category && (
            <Badge variant="secondary" className="shrink-0">
              {course.category.name}
            </Badge>
          )}
        </div>

        {course.description && (
          <p className="muted line-clamp-2">
            {course.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="size-4" />
            <span>{chaptersCount} chapters</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="size-4" />
            <span>{enrollmentsCount} enrolled</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div>
          {course.price && course.price > 0 ? (
            <span className="text-2xl font-bold text-primary">
              ${course.price.toFixed(2)}
            </span>
          ) : (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Free
            </Badge>
          )}
        </div>
        <Button asChild>
          <Link href={`/${lang}/stream/courses/${course.slug}`}>
            View Course
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-10 w-28" />
      </CardFooter>
    </Card>
  );
}
