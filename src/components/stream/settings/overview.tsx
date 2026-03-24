"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserCog,
  Users,
  Video,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface RecentCourse {
  id: string
  title: string
  slug: string
  isPublished: boolean
  createdAt: Date
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

export function StreamAdminDashboardContent({
  dictionary,
  lang,
  stats,
}: Props) {
  const d = dictionary?.stream?.adminDashboard

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
    <div className="space-y-6">
      <div>
        <h2>{d?.title || "Stream Overview"}</h2>
        <p className="muted">
          {d?.description ||
            "Monitor enrollments, video library, and student engagement"}
        </p>
      </div>

      {/* Stats Cards */}
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

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={`/${lang}/stream/courses`}
        >
          <BookOpen className="mr-2 size-4" />
          {d?.viewAllCourses || "Browse Courses"}
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={`/${lang}/stream/settings?tab=enrollments`}
        >
          <Users className="mr-2 size-4" />
          {d?.manageEnrollments || "Manage Enrollments"}
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={`/${lang}/stream/settings?tab=instructors`}
        >
          <UserCog className="mr-2 size-4" />
          {d?.instructorSettings || "Instructor Settings"}
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={`/${lang}/stream/settings?tab=videos`}
        >
          <Video className="mr-2 size-4" />
          {d?.manageVideos || "Video Library"}
        </Link>
      </div>

      {/* Recent Courses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{d?.recentCourses || "Recent Subjects"}</CardTitle>
              <CardDescription>
                {d?.mostRecentlyCreated ||
                  "Recently selected subjects with enrollment data"}
              </CardDescription>
            </div>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/${lang}/stream/courses`}
            >
              {d?.viewAllCourses || "View All"}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.recentCourses && stats.recentCourses.length > 0 ? (
            <div className="space-y-4">
              {stats.recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{course.title}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          course.isPublished
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {course.isPublished
                          ? d?.published || "Published"
                          : d?.draft || "Draft"}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-1 flex gap-4 text-sm">
                      <span>
                        {course.chapters.length} {d?.chapters || "chapters"}
                      </span>
                      <span>
                        {getLessonCount(course)} {d?.lessons || "lessons"}
                      </span>
                      <span>
                        {course._count.enrollments} {d?.enrolled || "enrolled"}
                      </span>
                    </div>
                  </div>
                  <Link
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                    href={`/${lang}/stream/courses/${course.slug}`}
                  >
                    {d?.view || "View"}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
