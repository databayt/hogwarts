"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";

export function StreamDashboardContent() {
  return (
    <div className="space-y-8">
      {/* Enrolled Courses Section */}
      <div>
        <div className="flex flex-col gap-2 mb-6">
          <h2>Enrolled Courses</h2>
          <p className="muted">
            Here you can see all the courses you have access to
          </p>
        </div>

        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <GraduationCap className="mx-auto size-16 text-muted-foreground mb-4" />
              <h3>No Courses Enrolled</h3>
              <p className="muted mb-6">
                You haven't enrolled in any courses yet.
              </p>
              <Link
                className={buttonVariants()}
                href="/stream/courses"
              >
                Browse Courses
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Courses Section */}
      <div>
        <div className="flex flex-col gap-2 mb-6">
          <h2>Available Courses</h2>
          <p className="muted">
            Here you can see all the courses you can purchase
          </p>
        </div>

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
      </div>
    </div>
  );
}
