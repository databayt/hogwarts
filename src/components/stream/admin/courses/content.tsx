"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, PlusIcon } from "lucide-react";
import Link from "next/link";

export default function AdminCoursesContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>Your Courses</h2>

        <Link className={buttonVariants()} href="/stream/admin/courses/create">
          <PlusIcon className="mr-2 size-4" />
          Create Course
        </Link>
      </div>

      {/* Empty State - Will be replaced with real courses list */}
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <BookOpen className="mx-auto size-12 text-muted-foreground mb-4" />
            <h3>No courses yet</h3>
            <p className="muted mb-4">
              Create your first course to get started with Stream LMS
            </p>
            <Link
              className={buttonVariants()}
              href="/stream/admin/courses/create"
            >
              <PlusIcon className="mr-2 size-4" />
              Create Your First Course
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid - Placeholder for future implementation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Course cards will be displayed here */}
      </div>
    </div>
  );
}
