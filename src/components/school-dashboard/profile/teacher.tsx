"use client"

import { GraduationCap, Users } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OcticonTable } from "@/components/atom/icons"

import { ProfileEditSection } from "./edit-role-data"
import type { ProfileViewData } from "./queries"

interface TeacherDashboardProps {
  data: ProfileViewData
  dictionary?: Record<string, any>
}

export default function TeacherDashboard({
  data,
  dictionary,
}: TeacherDashboardProps) {
  const t = dictionary?.teacher
  const classes = data.roleDetail.classes
  const studentsStat = data.stats.find((s) => s.key === "students")?.value ?? 0

  return (
    <div className="space-y-6">
      {data.isOwner && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t?.editTitle ?? ""}</CardTitle>
            <CardDescription>{t?.editDescription ?? ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileEditSection
              entityType="teacher"
              steps={["contact", "qualifications", "experience"]}
              dictionary={dictionary}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <OcticonTable className="size-4" />
              {t?.classes ?? ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{classes.length}</span>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="size-4" />
              {t?.students ?? ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{studentsStat}</span>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="text-primary size-5" />
            {t?.myClasses ?? ""}
          </CardTitle>
          <CardDescription>{t?.myClassesDescription ?? ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t?.noClasses ?? ""}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="border-border bg-card hover:bg-muted/50 rounded-lg border p-3 transition-colors"
                >
                  <p className="truncate text-sm font-medium">{cls.name}</p>
                  {cls.subjectName && (
                    <p className="text-muted-foreground text-xs">
                      {cls.subjectName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
