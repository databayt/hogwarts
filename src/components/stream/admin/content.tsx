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
  Users,
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
  schoolId,
  userId,
  userRole,
  stats,
}: Props) {
  const isRTL = lang === "ar"
  const d = dictionary?.stream?.adminDashboard

  // Format revenue
  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Get lesson count for a course
  const getLessonCount = (course: RecentCourse) => {
    return course.chapters.reduce(
      (total, chapter) => total + chapter.lessons.length,
      0
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>{d?.title || "Stream LMS Admin Dashboard"}</h2>
        <p className="muted">
          {d?.description ||
            "Manage your courses, track enrollments, and monitor revenue"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalCourses || "Total Courses"}
            </CardTitle>
            <BookOpen className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses ?? 0}</div>
            <p className="text-muted-foreground text-xs">
              {stats?.totalCourses === 0
                ? d?.noCoursesYet || "No courses yet"
                : d?.coursesAvailable || "courses available"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalEnrollments || "Total Enrollments"}
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
              {d?.totalRevenue || "Total Revenue"}
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
                : d?.fromCourseSales || "from course sales"}
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

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>
            {d?.enrollmentStatistics || "Enrollment Statistics"}
          </CardTitle>
          <CardDescription>
            {d?.overviewOfEnrollments ||
              "Overview of course enrollments over time"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted flex h-[300px] items-center justify-center rounded-lg">
            <div className="space-y-2 text-center">
              <TrendingUp className="text-muted-foreground mx-auto size-12" />
              <p className="muted">
                {d?.chartComingSoon || "Chart visualization coming soon"}
              </p>
              <p className="text-muted-foreground text-xs">
                {d?.enrollmentDataWillBeDisplayed ||
                  "Enrollment data will be displayed here"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Courses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{d?.recentCourses || "Recent Courses"}</CardTitle>
              <CardDescription>
                {d?.mostRecentlyCreated || "Your most recently created courses"}
              </CardDescription>
            </div>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/${lang}/stream/admin/courses`}
            >
              {d?.viewAllCourses || "View All Courses"}
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
                    href={`/${lang}/stream/admin/courses/${course.id}/edit`}
                  >
                    {d?.edit || "Edit"}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-4 size-12" />
              <h3>{d?.noCoursesCreated || "No courses yet"}</h3>
              <p className="muted mb-4">
                {d?.createFirstCourse ||
                  "Create your first course to get started"}
              </p>
              <Link
                className={buttonVariants()}
                href={`/${lang}/stream/admin/courses/create`}
              >
                {d?.createCourse || "Create Course"}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
