"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"

import { cn } from "@/lib/utils"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"

import { getSubjectsForExpertise, updateTeacherExpertise } from "./actions"
import type { ExpertiseFormData } from "./validation"

interface SubjectOption {
  id: string
  subjectName: string
  department: { id: string; departmentName: string } | null
}

type ExpertiseLevel = "PRIMARY" | "SECONDARY" | null

interface ExpertiseFormProps {
  teacherId: string
  initialData?: Partial<ExpertiseFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ExpertiseForm = forwardRef<WizardFormRef, ExpertiseFormProps>(
  ({ teacherId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [subjects, setSubjects] = useState<SubjectOption[]>([])
    // Map: subjectId → "PRIMARY" | "SECONDARY" | null (not selected)
    const [selections, setSelections] = useState<
      Record<string, ExpertiseLevel>
    >({})

    // Initialize from initialData
    useEffect(() => {
      if (initialData?.subjectExpertise) {
        const init: Record<string, ExpertiseLevel> = {}
        for (const item of initialData.subjectExpertise) {
          init[item.subjectId] = item.expertiseLevel as ExpertiseLevel
        }
        setSelections(init)
      }
    }, [initialData])

    // Fetch subjects on mount
    useEffect(() => {
      async function loadSubjects() {
        const result = await getSubjectsForExpertise()
        if (result.success && result.data) {
          setSubjects(result.data)
        }
      }
      loadSubjects()
    }, [])

    // Optional step, always valid
    useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

    const toggleSubject = useCallback(
      (subjectId: string, level: "PRIMARY" | "SECONDARY") => {
        setSelections((prev) => {
          const current = prev[subjectId]
          if (current === level) {
            // Deselect
            const next = { ...prev }
            delete next[subjectId]
            return next
          }
          return { ...prev, [subjectId]: level }
        })
      },
      []
    )

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const subjectExpertise = Object.entries(selections)
                .filter(([, level]) => level !== null)
                .map(([subjectId, expertiseLevel]) => ({
                  subjectId,
                  expertiseLevel: expertiseLevel as "PRIMARY" | "SECONDARY",
                }))
              const result = await updateTeacherExpertise(teacherId, {
                subjectExpertise,
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
      <div className="space-y-4">
        {subjects.length === 0 && !isPending && (
          <p className="text-muted-foreground text-sm">
            No subjects found. Add subjects to your school first.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => {
            const level = selections[subject.id]
            return (
              <div key={subject.id} className="flex gap-1">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => toggleSubject(subject.id, "PRIMARY")}
                  className={cn(
                    "rounded-s-full border px-3 py-1.5 text-sm transition-colors",
                    level === "PRIMARY"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted border-border"
                  )}
                >
                  {subject.subjectName}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => toggleSubject(subject.id, "SECONDARY")}
                  className={cn(
                    "rounded-e-full border px-3 py-1.5 text-sm transition-colors",
                    level === "SECONDARY"
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "hover:bg-muted border-border"
                  )}
                >
                  2nd
                </button>
              </div>
            )
          })}
        </div>
        {subjects.length > 0 && (
          <div className="text-muted-foreground flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="bg-primary inline-block h-2 w-2 rounded-full" />
              Primary
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-secondary inline-block h-2 w-2 rounded-full" />
              Secondary
            </span>
          </div>
        )}
      </div>
    )
  }
)

ExpertiseForm.displayName = "ExpertiseForm"
