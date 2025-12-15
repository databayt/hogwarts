"use client"

import Link from "next/link"
import { BookOpen, GraduationCap } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  dictionary: any
  lang: string
  schoolId: string | null
  userId: string
}

export function StreamDashboardContent({
  dictionary,
  lang,
  schoolId,
  userId,
}: Props) {
  return (
    <div className="space-y-8">
      {/* Enrolled Courses Section */}
      <div>
        <div className="mb-6 flex flex-col gap-2">
          <h2>Enrolled Courses</h2>
          <p className="muted">
            Here you can see all the courses you have access to
          </p>
        </div>

        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <GraduationCap className="text-muted-foreground mx-auto mb-4 size-16" />
              <h3>No Courses Enrolled</h3>
              <p className="muted mb-6">
                You haven't enrolled in any courses yet.
              </p>
              <Link
                className={buttonVariants()}
                href={`/${lang}/stream/courses`}
              >
                Browse Courses
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Courses Section */}
      <div>
        <div className="mb-6 flex flex-col gap-2">
          <h2>Available Courses</h2>
          <p className="muted">
            Here you can see all the courses you can purchase
          </p>
        </div>

        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-4 size-16" />
              <h3>No Courses Available</h3>
              <p className="muted mb-6">
                There are currently no courses available. Check back soon!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
