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

import {
  getGradesAndSubjects,
  updateTeacherExpertise,
  type GradeWithSubjects,
  type SubjectWithDept,
} from "./actions"
import type { ExpertiseFormData } from "./validation"

interface ExpertiseFormProps {
  teacherId: string
  initialData?: Partial<ExpertiseFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ExpertiseForm = forwardRef<WizardFormRef, ExpertiseFormProps>(
  ({ teacherId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [grades, setGrades] = useState<GradeWithSubjects[]>([])
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
      async function load() {
        const result = await getGradesAndSubjects()
        if (result.success && result.data) {
          setGrades(result.data)
        }
      }
      load()
    }, [])

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
        if (selectedGradeIds.size === 0 || selectedGradeIds.has(grade.id)) {
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
        {/* Grade filter — simple number badges */}
        <div className="space-y-2">
          <span className="text-muted-foreground text-xs font-medium">
            Grades
          </span>
          <div className="flex flex-wrap gap-2">
            {grades.map((grade) => (
              <button
                key={grade.id}
                type="button"
                onClick={() => toggleGrade(grade.id)}
                disabled={isPending}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                  selectedGradeIds.has(grade.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted border-border"
                )}
              >
                {grade.gradeNumber}
              </button>
            ))}
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
              <SelectValue placeholder="Primary Subjects" />
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
              <SelectValue placeholder="Secondary Subjects" />
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
