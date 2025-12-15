"use client"

import { useEffect, useState } from "react"
import { BookOpen, DollarSign, TrendingUp, Users } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { AnalyticsData, getStreamAnalytics } from "./actions"

export function StreamAnalyticsContent() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      const data = await getStreamAnalytics()
      setAnalytics(data)
      setIsLoading(false)
    }

    fetchAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Total Courses
              </p>
              <h3 className="mt-2 text-2xl font-bold">
                {analytics.totalCourses}
              </h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Total Enrollments
              </p>
              <h3 className="mt-2 text-2xl font-bold">
                {analytics.totalEnrollments}
              </h3>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Total Revenue
              </p>
              <h3 className="mt-2 text-2xl font-bold">
                ${analytics.totalRevenue.toFixed(2)}
              </h3>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Active Students
              </p>
              <h3 className="mt-2 text-2xl font-bold">
                {analytics.activeStudents}
              </h3>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Enrollment Trend Chart */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Enrollment Trend (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.enrollmentTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Enrollments"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Courses */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">
            Top Courses by Enrollment
          </h3>
          <div className="space-y-4">
            {analytics.topCourses.map((course, index) => (
              <div
                key={course.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {course.enrollments} students
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-green-600">
                  ${course.revenue.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue by Month */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">
            Revenue Trend (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
