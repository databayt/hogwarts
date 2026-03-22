"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Check, Globe, School, User } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { setInstructorPreference } from "@/components/school-dashboard/listings/subjects/catalog/actions"

type InstructorSource = {
  type: "platform" | "school" | "teacher"
  id: string | null
  name: string
  videoCount: number
  totalViews: number
}

type SubjectWithInstructors = {
  id: string
  name: string
  slug: string
  department: string
  color: string | null
  instructors: InstructorSource[]
  currentPreference: {
    preferredSchoolId: string | null
    preferredUserId: string | null
  } | null
}

interface InstructorSettingsContentProps {
  dictionary: Record<string, unknown>
  lang: string
  subjects: SubjectWithInstructors[]
}

function getActiveSourceKey(
  preference: SubjectWithInstructors["currentPreference"]
): string {
  if (!preference) return "platform"
  if (preference.preferredSchoolId)
    return `school:${preference.preferredSchoolId}`
  if (preference.preferredUserId) return `teacher:${preference.preferredUserId}`
  return "platform"
}

function getSourceKey(source: InstructorSource): string {
  if (source.type === "platform") return "platform"
  return `${source.type}:${source.id}`
}

const SOURCE_ICONS = {
  platform: Globe,
  school: School,
  teacher: User,
} as const

export function InstructorSettingsContent({
  subjects,
}: InstructorSettingsContentProps) {
  const [isPending, startTransition] = useTransition()
  const [activePrefs, setActivePrefs] = useState<Map<string, string>>(
    new Map(
      subjects.map((s) => [s.id, getActiveSourceKey(s.currentPreference)])
    )
  )

  const handleSetPreference = (subjectId: string, source: InstructorSource) => {
    const key = getSourceKey(source)
    setActivePrefs((prev) => new Map(prev).set(subjectId, key))

    startTransition(async () => {
      const result = await setInstructorPreference({
        catalogSubjectId: subjectId,
        preferredSchoolId: source.type === "school" ? source.id : null,
        preferredUserId: source.type === "teacher" ? source.id : null,
      })

      if (!result.success) {
        toast.error(result.error || "Failed to update preference")
        // Revert on error
        setActivePrefs((prev) => {
          const next = new Map(prev)
          const subject = subjects.find((s) => s.id === subjectId)
          next.set(
            subjectId,
            getActiveSourceKey(subject?.currentPreference ?? null)
          )
          return next
        })
      }
    })
  }

  if (subjects.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">
          No subjects configured. Add subjects from catalog first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Instructor Settings
        </h1>
        <p className="text-muted-foreground">
          Set default video source per subject. Students will see the preferred
          instructor&apos;s videos first.
        </p>
      </div>

      <div className="grid gap-4">
        {subjects.map((subject) => {
          const activeKey = activePrefs.get(subject.id) ?? "platform"

          return (
            <Card key={subject.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {subject.color && (
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                  )}
                  <div>
                    <CardTitle className="text-base">{subject.name}</CardTitle>
                    <CardDescription>{subject.department}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {subject.instructors.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No videos available for this subject yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subject.instructors.map((source) => {
                      const key = getSourceKey(source)
                      const isActive = activeKey === key
                      const Icon = SOURCE_ICONS[source.type]

                      return (
                        <Button
                          key={key}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            handleSetPreference(subject.id, source)
                          }
                          className="h-auto gap-2 px-3 py-2"
                        >
                          <Icon className="size-4" />
                          <div className="text-start">
                            <span className="block text-sm font-medium">
                              {source.name}
                            </span>
                            <span className="text-xs opacity-70">
                              {source.videoCount} videos
                            </span>
                          </div>
                          {isActive && <Check className="ml-1 size-3.5" />}
                          {source.type === "platform" && (
                            <Badge
                              variant="secondary"
                              className="ml-1 px-1 py-0 text-[10px]"
                            >
                              Default
                            </Badge>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
