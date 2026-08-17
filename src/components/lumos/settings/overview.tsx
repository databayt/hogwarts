"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  COURSE_SLIDE_BASIS,
  CourseCarousel,
  CourseSlide,
} from "@/components/lumos/shared/course-carousel"

interface RecentCourse {
  id: string
  title: string
  slug: string
  isPublished: boolean
  createdAt: Date
  imageUrl: string | null
  color: string | null
  chapters: Array<{
    lessons: Array<{ id: string }>
  }>
  _count: {
    enrollments: number
  }
}

interface AdminStats {
  totalCourses: number
  totalEnrollments: number
  totalRevenue: number
  growthPercent: number
  recentCourses: RecentCourse[]
}

interface Props {
  dictionary: any
  lang: string
  schoolId: string | null
  userId: string
  userRole: string
  stats: AdminStats | null
}

export function LumosAdminDashboardContent({ dictionary, lang, stats }: Props) {
  const d = dictionary?.lumos?.adminDashboard || dictionary?.adminDashboard

  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getLessonCount = (course: RecentCourse) => {
    return course.chapters.reduce(
      (total, chapter) => total + chapter.lessons.length,
      0
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards — the page's own heading and tab strip already name this
          surface, so the section repeats no title of its own. */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalCourses || "Subjects"}
            </CardTitle>
            <BookOpen className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses ?? 0}</div>
            <p className="text-muted-foreground text-xs">
              {stats?.totalCourses === 0
                ? d?.noCoursesYet || "No subjects selected"
                : d?.coursesAvailable || "active subjects"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalEnrollments || "Enrollments"}
            </CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalEnrollments ?? 0}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats?.totalEnrollments === 0
                ? d?.noEnrollmentsYet || "No enrollments yet"
                : d?.activeStudents || "active students"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalRevenue || "Revenue"}
            </CardTitle>
            <DollarSign className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRevenue(stats?.totalRevenue ?? 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats?.totalRevenue === 0
                ? d?.noRevenueYet || "No revenue yet"
                : d?.fromCourseSales || "from enrollments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.growth || "Growth"}
            </CardTitle>
            <TrendingUp className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-2xl font-bold">
              {(stats?.growthPercent ?? 0) > 0 && (
                <ArrowUp className="size-5 text-green-500" />
              )}
              {(stats?.growthPercent ?? 0) < 0 && (
                <ArrowDown className="size-5 text-red-500" />
              )}
              {stats?.growthPercent ?? 0}%
            </div>
            <p className="text-muted-foreground text-xs">
              {d?.vsLastMonth || "vs last month"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Courses */}
      {stats?.recentCourses && stats.recentCourses.length > 0 ? (
        <CourseCarousel
          lang={lang}
          title={d?.recentCourses || "Recent Courses"}
        >
          {stats.recentCourses.map((course) => (
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
                    <div
                      className="size-full"
                      style={{ backgroundColor: course.color || undefined }}
                    />
                  )}
                </div>

                <div className="space-y-1 px-1 pt-3 text-start">
                  <h3 className="group-hover:text-primary line-clamp-1 text-sm font-semibold transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {`${course.chapters.length} ${d?.chapters || "chapters"} · ${getLessonCount(course)} ${d?.lessons || "lessons"}`}
                  </p>
                </div>
              </Link>
            </CourseSlide>
          ))}
        </CourseCarousel>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <BookOpen className="text-muted-foreground mx-auto mb-4 size-12" />
            <h3>{d?.noCoursesCreated || "No subjects selected yet"}</h3>
            <p className="muted mb-4">
              {d?.createFirstCourse ||
                "Select subjects from the catalog to get started"}
            </p>
            <Link
              className={buttonVariants()}
              href={`/${lang}/subjects/catalog`}
            >
              {d?.browseCatalog || "Browse Catalog"}
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
