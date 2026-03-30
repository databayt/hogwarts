"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  useTransition,
} from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  updateTeacherExpertise,
  type GradeWithSubjects,
  type SubjectWithDept,
} from "./actions"
import type { ExpertiseFormData } from "./validation"

interface ExpertiseFormProps {
  teacherId: string
  grades: GradeWithSubjects[]
  initialData?: Partial<ExpertiseFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ExpertiseForm = forwardRef<WizardFormRef, ExpertiseFormProps>(
  ({ teacherId, grades, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const teachers = (dictionary?.school as Record<string, unknown>)
      ?.teachers as Record<string, unknown> | undefined
    const wizard = teachers?.wizard as Record<string, unknown> | undefined
    const t = wizard?.expertise as Record<string, string> | undefined
    const tWizard = wizard as Record<string, string> | undefined

    const [selectedGradeIds, setSelectedGradeIds] = useState<Set<string>>(
      new Set()
    )
    const [primarySubjects, setPrimarySubjects] = useState<Set<string>>(
      new Set()
    )
    const [secondarySubjects, setSecondarySubjects] = useState<Set<string>>(
      new Set()
    )

    useEffect(() => {
      if (initialData?.subjectExpertise && grades.length > 0) {
        const primary = new Set<string>()
        const secondary = new Set<string>()
        const gradeIds = new Set<string>()

        for (const item of initialData.subjectExpertise) {
          if (item.expertiseLevel === "PRIMARY") {
            primary.add(item.subjectId)
          } else {
            secondary.add(item.subjectId)
          }
        }

        const allSelected = new Set([...primary, ...secondary])
        for (const grade of grades) {
          if (grade.subjects.some((s) => allSelected.has(s.id))) {
            gradeIds.add(grade.id)
          }
        }

        setPrimarySubjects(primary)
        setSecondarySubjects(secondary)
        setSelectedGradeIds(gradeIds)
      }
    }, [initialData, grades])

    useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

    // Subjects from selected grades (deduplicated)
    const filteredSubjects = useMemo(() => {
      const map = new Map<string, SubjectWithDept>()
      for (const grade of grades) {
        if (selectedGradeIds.has(grade.id)) {
          for (const subject of grade.subjects) {
            map.set(subject.id, subject)
          }
        }
      }
      return Array.from(map.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    }, [grades, selectedGradeIds])

    const primaryOptions = useMemo(
      () => filteredSubjects.filter((s) => !secondarySubjects.has(s.id)),
      [filteredSubjects, secondarySubjects]
    )

    const secondaryOptions = useMemo(
      () => filteredSubjects.filter((s) => !primarySubjects.has(s.id)),
      [filteredSubjects, primarySubjects]
    )

    const toggleGrade = useCallback((gradeId: string) => {
      setSelectedGradeIds((prev) => {
        const next = new Set(prev)
        if (next.has(gradeId)) next.delete(gradeId)
        else next.add(gradeId)
        return next
      })
    }, [])

    const addPrimary = useCallback((subjectId: string) => {
      setPrimarySubjects((prev) => new Set(prev).add(subjectId))
      setSecondarySubjects((prev) => {
        const next = new Set(prev)
        next.delete(subjectId)
        return next
      })
    }, [])

    const addSecondary = useCallback((subjectId: string) => {
      setSecondarySubjects((prev) => new Set(prev).add(subjectId))
      setPrimarySubjects((prev) => {
        const next = new Set(prev)
        next.delete(subjectId)
        return next
      })
    }, [])

    const removePrimary = useCallback((subjectId: string) => {
      setPrimarySubjects((prev) => {
        const next = new Set(prev)
        next.delete(subjectId)
        return next
      })
    }, [])

    const removeSecondary = useCallback((subjectId: string) => {
      setSecondarySubjects((prev) => {
        const next = new Set(prev)
        next.delete(subjectId)
        return next
      })
    }, [])

    const subjectName = useCallback(
      (id: string) => {
        for (const grade of grades) {
          for (const s of grade.subjects) {
            if (s.id === id) return s.name
          }
        }
        return id
      },
      [grades]
    )

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const subjectExpertise = [
                ...Array.from(primarySubjects).map((subjectId) => ({
                  subjectId,
                  expertiseLevel: "PRIMARY" as const,
                })),
                ...Array.from(secondarySubjects).map((subjectId) => ({
                  subjectId,
                  expertiseLevel: "SECONDARY" as const,
                })),
              ]
              const result = await updateTeacherExpertise(teacherId, {
                subjectExpertise,
              })
              if (!result.success) {
                ErrorToast(
                  result.error || tWizard?.failedToSave || "Failed to save"
                )
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : tWizard?.failedToSave || "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    return (
      <div className="space-y-6">
        {/* Grade filter — simple number badges */}
        <div className="space-y-4">
          <div>
            <p className="font-semibold">{t?.grades || "Grades"}</p>
            <p className="text-muted-foreground text-xs">
              {t?.selectOneOrMore || "Select one or more"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {grades.map((grade) => {
              const label =
                grade.gradeNumber <= 0
                  ? `K${grade.gradeNumber + 2}`
                  : `G${grade.gradeNumber}`
              return (
                <button
                  key={grade.id}
                  type="button"
                  onClick={() => toggleGrade(grade.id)}
                  disabled={isPending}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    selectedGradeIds.has(grade.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 hover:bg-muted border-border"
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Primary subjects */}
        <div className="space-y-3">
          <Select
            disabled={isPending || filteredSubjects.length === 0}
            onValueChange={addPrimary}
            value=""
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={t?.primarySubjects || "Primary Subjects"}
              />
            </SelectTrigger>
            <SelectContent>
              {primaryOptions.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                  disabled={primarySubjects.has(s.id)}
                >
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(primarySubjects).map((id) => (
              <Badge key={id} variant="default" className="gap-1">
                {subjectName(id)}
                <button
                  type="button"
                  onClick={() => removePrimary(id)}
                  className="hover:bg-primary-foreground/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Secondary subjects */}
        <div className="space-y-3">
          <Select
            disabled={isPending || filteredSubjects.length === 0}
            onValueChange={addSecondary}
            value=""
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={t?.secondarySubjects || "Secondary Subjects"}
              />
            </SelectTrigger>
            <SelectContent>
              {secondaryOptions.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                  disabled={secondarySubjects.has(s.id)}
                >
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(secondarySubjects).map((id) => (
              <Badge key={id} variant="secondary" className="gap-1">
                {subjectName(id)}
                <button
                  type="button"
                  onClick={() => removeSecondary(id)}
                  className="hover:bg-secondary-foreground/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    )
  }
)

ExpertiseForm.displayName = "ExpertiseForm"
