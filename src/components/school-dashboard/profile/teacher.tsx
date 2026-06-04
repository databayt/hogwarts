"use client"

import { Users } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSidebar } from "@/components/ui/sidebar"

import { ProfileEditSection } from "./edit-role-data"

interface TeacherDashboardProps {
  data: Record<string, unknown>
  isOwner?: boolean
  dictionary?: Record<string, any>
}

interface TeacherClass {
  id: string
  name: string
  studentCount: number
}

export default function TeacherDashboard({
  data,
  isOwner,
  dictionary,
}: TeacherDashboardProps) {
  const t = dictionary?.teacher
  const { open, isMobile } = useSidebar()
  const useMobileLayout = isMobile || open

  // Real, tenant-scoped values derived in getProfileBasicData.
  const classCount =
    typeof data.classCount === "number"
      ? (data.classCount as number)
      : undefined
  const studentsTaught =
    typeof data.studentsTaught === "number"
      ? (data.studentsTaught as number)
      : undefined
  const classes = Array.isArray(data.classes)
    ? (data.classes as TeacherClass[])
    : []

  return (
    <div className="space-y-6">
      {/* Self-Edit Section (owner only) */}
      {isOwner && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t?.editTitle ?? "Edit Your Information"}
            </CardTitle>
            <CardDescription>
              {t?.editDescription ??
                "Update your contact details, qualifications and experience"}
            </CardDescription>
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

      {/* Stats (real counts) */}
      <div
        className={cn(
          "grid gap-4",
          useMobileLayout ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"
        )}
      >
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription>{t?.classes ?? "Classes"}</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{classCount ?? 0}</span>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="size-4" />
              {t?.students ?? "Students"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{studentsTaught ?? 0}</span>
          </CardContent>
        </Card>
      </div>

      {/* Class list (real classes taught) */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">
            {t?.myClasses ?? "My Classes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length > 0 ? (
            <ul className="space-y-2">
              {classes.map((c) => (
                <li
                  key={c.id}
                  className="border-border flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {(t?.studentsCount ?? "{count} students").replace(
                      "{count}",
                      String(c.studentCount)
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t?.noClasses ?? "No classes assigned yet"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
