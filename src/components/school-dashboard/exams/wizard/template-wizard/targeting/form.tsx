"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"

import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { updateTemplateTargeting } from "./actions"
import type { TargetingFormData } from "./validation"

interface SelectOption {
  id: string
  name: string
}

interface TargetingFormProps {
  templateId: string
  initialData?: Partial<TargetingFormData>
  onValidChange?: (isValid: boolean) => void
  gradeOptions: SelectOption[]
  sectionOptions: SelectOption[]
  classroomOptions: SelectOption[]
}

export const TargetingForm = forwardRef<WizardFormRef, TargetingFormProps>(
  (
    {
      templateId,
      initialData,
      onValidChange,
      gradeOptions,
      sectionOptions,
      classroomOptions,
    },
    ref
  ) => {
    const { dictionary } = useDictionary()
    const t = dictionary?.school?.exams?.wizard?.templateWizard?.targeting
    const [isPending, startTransition] = useTransition()
    const [gradeIds, setGradeIds] = React.useState<string[]>(
      initialData?.gradeIds ?? []
    )
    const [sectionIds, setSectionIds] = React.useState<string[]>(
      initialData?.sectionIds ?? []
    )
    const [classroomIds, setClassroomIds] = React.useState<string[]>(
      initialData?.classroomIds ?? []
    )

    // This step is optional, always valid
    React.useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

    // Sync initial data when it loads
    React.useEffect(() => {
      if (initialData?.gradeIds) setGradeIds(initialData.gradeIds)
      if (initialData?.sectionIds) setSectionIds(initialData.sectionIds)
      if (initialData?.classroomIds) setClassroomIds(initialData.classroomIds)
    }, [
      initialData?.gradeIds,
      initialData?.sectionIds,
      initialData?.classroomIds,
    ])

    const toggleId = (
      current: string[],
      setter: React.Dispatch<React.SetStateAction<string[]>>,
      id: string
    ) => {
      setter((prev) =>
        prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
      )
    }

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const result = await updateTemplateTargeting(templateId, {
                gradeIds,
                sectionIds,
                classroomIds,
              })
              if (!result.success) {
                ErrorToast(result.error || "Failed to save")
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    return (
      <div className="space-y-6">
        {/* Grades */}
        <div className="space-y-2">
          <Label>{t?.grades ?? "Grades"}</Label>
          {gradeOptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No grades available.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {gradeOptions.map((g) => (
                <Badge
                  key={g.id}
                  variant={gradeIds.includes(g.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleId(gradeIds, setGradeIds, g.id)}
                >
                  {g.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-2">
          <Label>{t?.sections ?? "Sections"}</Label>
          {sectionOptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {gradeIds.length === 0
                ? "Select grades to see sections."
                : (t?.noSections ??
                  "No sections available for selected grades.")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sectionOptions.map((s) => (
                <Badge
                  key={s.id}
                  variant={sectionIds.includes(s.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleId(sectionIds, setSectionIds, s.id)}
                >
                  {s.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Classrooms */}
        <div className="space-y-2">
          <Label>{t?.classrooms ?? "Classrooms"}</Label>
          {classroomOptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {gradeIds.length === 0
                ? "Select grades to see classrooms."
                : (t?.noClassrooms ??
                  "No classrooms available for selected grades.")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classroomOptions.map((c) => (
                <Badge
                  key={c.id}
                  variant={classroomIds.includes(c.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleId(classroomIds, setClassroomIds, c.id)}
                >
                  {c.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {isPending && (
          <p className="text-muted-foreground text-sm">Saving...</p>
        )}
      </div>
    )
  }
)

TargetingForm.displayName = "TargetingForm"
