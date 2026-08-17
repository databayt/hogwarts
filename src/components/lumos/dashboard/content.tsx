"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react"

import { typographyVariants } from "@/lib/typography"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  COURSE_SLIDE_BASIS,
  CourseCarousel,
  CourseSlide,
} from "@/components/lumos/shared/course-carousel"

interface EnrolledCourse {
  id: string
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  enrollmentId: string
  enrolledAt: Date
  progressPercent: number
  completedLessons: number
  totalLessons: number
  chapters: Array<{
    lessons: Array<{ id: string }>
  }>
}

interface AvailableCourse {
  id: string
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  price: number | null
  chapters: Array<{
    lessons: Array<{ id: string }>
  }>
  _count: {
    enrollments: number
  }
}

interface Props {
  dictionary: Record<string, any>
  lang: string
  schoolId: string | null
  userId: string
  enrolledCourses: EnrolledCourse[]
  availableCourses: AvailableCourse[]
}

export function LumosDashboardContent({
  dictionary,
  lang,
  schoolId,
  userId,
  enrolledCourses,
  availableCourses,
}: Props) {
  const d = dictionary?.studentDashboard || dictionary?.lumos?.studentDashboard

  // Get lesson count
  const getLessonCount = (
    chapters: Array<{ lessons: Array<{ id: string }> }>
  ) => {
    return chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0)
  }

  return (
    <div className="space-y-8">
      {/* Enrolled Courses Section */}
      {enrolledCourses.length === 0 ? (
        <div>
          <div className="mb-6 flex flex-col gap-2">
            <h2 className={typographyVariants.cardTitle}>
              {d?.continueLearning || "Continue learning"}
            </h2>
          </div>
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <GraduationCap className="text-muted-foreground mx-auto mb-4 size-16" />
                <h3>{d?.noCoursesEnrolled || "No Courses Enrolled"}</h3>
                <p className="muted mb-6">
                  {d?.notEnrolledYet ||
                    "You haven't enrolled in any courses yet."}
                </p>
                <Link
                  className={buttonVariants()}
                  href={`/${lang}/lumos/courses`}
                >
                  {d?.browseCourses || "Browse Courses"}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <CourseCarousel
          lang={lang}
          title={d?.continueLearning || "Continue learning"}
        >
          {enrolledCourses.map((course) => (
            <CourseSlide key={course.id} className={COURSE_SLIDE_BASIS}>
              <Link
                href={
                  course.chapters[0]?.lessons[0]?.id
                    ? `/${lang}/lumos/courses/${course.slug}/${course.chapters[0].lessons[0].id}`
                    : `/${lang}/lumos/courses/${course.slug}`
                }
                className="group block"
              >
                <div className="bg-muted relative aspect-[16/10] overflow-hidden rounded-xl">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <BookOpen className="text-muted-foreground size-12" />
                    </div>
                  )}
                  {course.progressPercent === 100 && (
                    <Badge className="absolute end-2 top-2 bg-green-500">
                      {d?.completed || "Completed"}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 px-1 pt-3 text-start">
                  <h3 className="group-hover:text-primary line-clamp-1 text-sm font-semibold transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {`${course.completedLessons} / ${course.totalLessons} ${d?.lessonsCompleted || "lessons completed"} · ${course.progressPercent}%`}
                  </p>
                </div>
              </Link>
            </CourseSlide>
          ))}
        </CourseCarousel>
      )}

      {/* Available Courses Section */}
      {availableCourses.length > 0 && (
        <CourseCarousel
          lang={lang}
          title={d?.availableCourses || "Available Courses"}
          description={
            d?.discoverNewCourses ||
            "Discover new courses to level up your skills"
          }
          action={
            <Link
              href={`/${lang}/lumos/courses`}
              className={buttonVariants({ variant: "outline" })}
            >
              {d?.viewAll || "View All"}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          }
        >
          {availableCourses.map((course) => (
            <CourseSlide key={course.id} className={COURSE_SLIDE_BASIS}>
              <Link
                href={`/${lang}/lumos/courses/${course.slug}`}
                className="group block"
              >
                <div className="bg-muted relative aspect-[16/10] overflow-hidden rounded-xl">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <BookOpen className="text-muted-foreground size-12" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 px-1 pt-3 text-start">
                  <h3 className="group-hover:text-primary line-clamp-1 text-sm font-semibold transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {`${course.chapters.length} ${d?.chapters || "chapters"} · ${getLessonCount(course.chapters)} ${d?.lessons || "lessons"}`}
                  </p>
                </div>
              </Link>
            </CourseSlide>
          ))}
        </CourseCarousel>
      )}
    </div>
  )
}
