"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { PublicCourseType } from "@/components/stream/data/course/get-all-courses";
import { CourseCard, CourseCardSkeleton } from "./course-card";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/stream/search-bar";

interface Props {
  dictionary: any;
  lang: string;
  schoolId: string | null;
  courses: PublicCourseType[];
  searchParams?: { category?: string; search?: string };
}

export function StreamCoursesContent({
  dictionary,
  lang,
  schoolId,
  courses,
  searchParams
}: Props) {
  const isRTL = lang === "ar";

  // Filter courses based on search params
  const filteredCourses = courses.filter((course) => {
    if (searchParams?.category && course.category?.name !== searchParams.category) {
      return false;
    }
    if (searchParams?.search) {
      const searchLower = searchParams.search.toLowerCase();
      return (
        course.title.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-10">
      {/* Hero Section - Like "Come teach with us" */}
      <section className="py-8">
        <div className={cn(
          "flex flex-col md:flex-row items-center gap-8",
          isRTL && "md:flex-row-reverse"
        )}>
          {/* Hero Image */}
          <div className="relative flex items-center justify-center rounded-xl p-6 size-40 md:size-44 bg-[#D97757] shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/anthropic/6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg"
              alt="Courses"
              className="size-32 md:size-36"
            />
          </div>

          {/* Text Content */}
          <div className={cn(
            "space-y-3",
            isRTL ? "text-right" : "text-left"
          )}>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              {dictionary?.courses?.heroTitle || "The Library"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              {dictionary?.courses?.heroDescription ||
                "Explore our collection of courses and begin your learning journey"}
            </p>
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
              <BookOpen className="mx-auto size-16 text-muted-foreground mb-4" />
              <h3>No Courses Available</h3>
              <p className="muted mb-6">
                There are currently no courses available. Check back soon!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StreamCoursesLoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-6 space-y-10">
      {/* Hero Section Skeleton */}
      <section className="py-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative flex items-center justify-center rounded-xl p-6 size-40 md:size-44 bg-[#D97757] shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/anthropic/6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg"
              alt="Courses"
              className="size-32 md:size-36"
            />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              The Library
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Explore our collection of courses and begin your learning journey
            </p>
          </div>
        </div>
      </section>

      {/* Search Bar Skeleton */}
      <section>
        <div className="h-11 w-full bg-muted rounded-full animate-pulse" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
