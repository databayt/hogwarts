"use client"

import Link from "next/link"
import { BookOpen, DollarSign, TrendingUp, Users } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Props {
  dictionary: any
  lang: string
  schoolId: string | null
  userId: string
  userRole: string
}

export function StreamAdminDashboardContent({
  dictionary,
  lang,
  schoolId,
  userId,
  userRole,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2>Stream LMS Admin Dashboard</h2>
        <p className="muted">
          Manage your courses, track enrollments, and monitor revenue
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-muted-foreground text-xs">No courses yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enrollments
            </CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-muted-foreground text-xs">No enrollments yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-muted-foreground text-xs">No revenue yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-muted-foreground text-xs">No growth data</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Statistics</CardTitle>
          <CardDescription>
            Overview of course enrollments over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted flex h-[300px] items-center justify-center rounded-lg">
            <div className="space-y-2 text-center">
              <TrendingUp className="text-muted-foreground mx-auto size-12" />
              <p className="muted">Chart visualization placeholder</p>
              <p className="text-muted-foreground text-xs">
                Enrollment data will be displayed here
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
              <CardTitle>Recent Courses</CardTitle>
              <CardDescription>
                Your most recently created courses
              </CardDescription>
            </div>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/stream/admin/courses"
            >
              View All Courses
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center">
            <BookOpen className="text-muted-foreground mx-auto mb-4 size-12" />
            <h3>No courses yet</h3>
            <p className="muted mb-4">
              Create your first course to get started
            </p>
            <Link
              className={buttonVariants()}
              href="/stream/admin/courses/create"
            >
              Create Course
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
