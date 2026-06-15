"use client"

import { BookOpen } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OcticonRepo } from "@/components/atom/icons"

import { ProfileEditSection } from "./edit-role-data"
import type { ProfileViewData } from "./queries"

interface StudentDashboardProps {
  data: ProfileViewData
  dictionary?: Record<string, any>
}

export default function StudentDashboard({
  data,
  dictionary,
}: StudentDashboardProps) {
  const s = dictionary?.student
  const subjects = data.roleDetail.subjects

  return (
    <div className="space-y-6">
      {data.isOwner && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{s?.editTitle ?? ""}</CardTitle>
            <CardDescription>{s?.editDescription ?? ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileEditSection
              entityType="student"
              steps={["contact"]}
              dictionary={dictionary}
            />
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="text-primary size-5" />
            {s?.subjects ?? ""}
          </CardTitle>
          <CardDescription>{s?.subjectsDescription ?? ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {s?.noSubjects ?? ""}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="border-border bg-card hover:bg-muted/50 flex items-center gap-2 rounded-lg border p-3 transition-colors"
                >
                  <OcticonRepo className="text-muted-foreground size-4 shrink-0" />
                  <span className="truncate text-sm font-medium">
                    {subject.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
