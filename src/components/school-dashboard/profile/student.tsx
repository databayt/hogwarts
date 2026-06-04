"use client"

import { Trophy } from "lucide-react"

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
import type { ProfileAchievement } from "./types"

interface StudentDashboardProps {
  data: Record<string, unknown>
  isOwner?: boolean
  dictionary?: Record<string, any>
}

export default function StudentDashboard({
  data,
  isOwner,
  dictionary,
}: StudentDashboardProps) {
  const s = dictionary?.student
  const { open, isMobile } = useSidebar()
  const useMobileLayout = isMobile || open

  // All values below are real and tenant-scoped (derived in getProfileBasicData).
  const averagePercentage =
    typeof data.averagePercentage === "number"
      ? (data.averagePercentage as number)
      : undefined
  const subjects = Array.isArray(data.subjects)
    ? (data.subjects as string[])
    : []
  const achievements = Array.isArray(data.achievements)
    ? (data.achievements as ProfileAchievement[])
    : []

  return (
    <div className="space-y-6">
      {/* Self-Edit Section (owner only) */}
      {isOwner && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {s?.editTitle ?? "Edit Your Information"}
            </CardTitle>
            <CardDescription>
              {s?.editDescription ??
                "Update your contact details and emergency contacts"}
            </CardDescription>
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

      {/* Average grade (real average of recorded results) */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardDescription>
            {s?.averageGrade ?? "Average grade"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {averagePercentage !== undefined ? (
            <span className="text-3xl font-bold">{averagePercentage}%</span>
          ) : (
            <p className="text-muted-foreground text-sm">
              {s?.noGradesYet ?? "No grades recorded yet"}
            </p>
          )}
        </CardContent>
      </Card>

      <div
        className={cn(
          "grid gap-6",
          useMobileLayout ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}
      >
        {/* Subjects (real enrolled subjects) */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">
              {s?.subjects ?? "Subjects"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjects.length > 0 ? (
              <ul className="space-y-2">
                {subjects.map((name) => (
                  <li
                    key={name}
                    className="border-border rounded-lg border p-3 text-sm"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                {s?.noSubjects ?? "No subjects enrolled yet"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Achievements (real Achievement records) */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-5 text-amber-500" />
              {s?.recentAchievements ?? "Recent Achievements"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.length > 0 ? (
              achievements.map((a) => (
                <div
                  key={a.id}
                  className="border-border flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.description && (
                      <p className="text-muted-foreground text-xs">
                        {a.description}
                      </p>
                    )}
                  </div>
                  {a.earnedAt && (
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {new Date(a.earnedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                {s?.noAchievementsYet ?? "No achievements yet"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
