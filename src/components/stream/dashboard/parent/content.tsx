"use client"

import { BookOpen, GraduationCap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import type { ChildProgress } from "./actions"

interface Props {
  dictionary: Record<string, unknown>
  lang: string
  childrenProgress: ChildProgress[]
}

export function ParentProgressContent({
  childrenProgress: childrenData,
}: Props) {
  if (childrenData.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Children&apos;s Progress
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="text-muted-foreground mb-4 size-12" />
            <p className="text-muted-foreground text-sm">
              No linked students found. Please contact your school
              administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Children&apos;s Progress
      </h1>

      {childrenData.map((child) => (
        <Card key={child.student.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5" />
              {child.student.givenName} {child.student.surname}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {child.enrollments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Not enrolled in any courses yet.
              </p>
            ) : (
              <div className="space-y-4">
                {child.enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    <BookOpen className="text-muted-foreground size-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {enrollment.subjectName}
                        </p>
                        <Badge variant="outline" className="shrink-0">
                          {enrollment.completedLessons}/
                          {enrollment.totalLessons}
                        </Badge>
                      </div>
                      <Progress
                        value={enrollment.progressPercent}
                        className="mt-2 h-2"
                      />
                    </div>
                    <span className="text-muted-foreground shrink-0 text-sm font-medium">
                      {enrollment.progressPercent}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
