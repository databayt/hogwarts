"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { BookOpen, Users, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardContent() {
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
            <BookOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No courses yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No enrollments yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">No revenue yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">No growth data</p>
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
          <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center space-y-2">
              <TrendingUp className="mx-auto size-12 text-muted-foreground" />
              <p className="muted">Chart visualization placeholder</p>
              <p className="text-xs text-muted-foreground">
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
              <CardDescription>Your most recently created courses</CardDescription>
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
          <div className="text-center py-10">
            <BookOpen className="mx-auto size-12 text-muted-foreground mb-4" />
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
  );
}
