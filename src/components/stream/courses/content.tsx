"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { PublicCourseType } from "@/components/stream/data/course/get-all-courses";
import { CourseCard, CourseCardSkeleton } from "./course-card";
import { Suspense } from "react";
import Image from "next/image";

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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <Image
          src="/anthropic/6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg"
          alt="Courses"
          width={120}
          height={120}
          className="mb-2"
        />
        <h2>Explore Courses</h2>
        <p className="muted">
          Discover our wide range of courses designed to help you achieve your
          learning goals.
        </p>
      </div>

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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h2>Explore Courses</h2>
        <p className="muted">
          Discover our wide range of courses designed to help you achieve your
          learning goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
