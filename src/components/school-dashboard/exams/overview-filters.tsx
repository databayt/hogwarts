"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Subject and grade filter chips for the admin exams overview dashboard
import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"

interface FilterOption {
  id: string
  label: string
}

interface OverviewFiltersProps {
  subjects: FilterOption[]
  grades: FilterOption[]
}

export function OverviewFilters({ subjects, grades }: OverviewFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSubjectId = searchParams.get("subjectId") || ""
  const currentGradeId = searchParams.get("gradeId") || ""

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  if (subjects.length === 0 && grades.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Subject chips */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            Subject:
          </span>
          <Badge
            variant={!currentSubjectId ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => updateFilter("subjectId", "")}
          >
            All
          </Badge>
          {subjects.map((s) => (
            <Badge
              key={s.id}
              variant={currentSubjectId === s.id ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() =>
                updateFilter("subjectId", currentSubjectId === s.id ? "" : s.id)
              }
            >
              {s.label}
              {currentSubjectId === s.id && <X className="ms-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      )}

      {/* Grade chips */}
      {grades.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            Grade:
          </span>
          <Badge
            variant={!currentGradeId ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => updateFilter("gradeId", "")}
          >
            All
          </Badge>
          {grades.map((g) => (
            <Badge
              key={g.id}
              variant={currentGradeId === g.id ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() =>
                updateFilter("gradeId", currentGradeId === g.id ? "" : g.id)
              }
            >
              {g.label}
              {currentGradeId === g.id && <X className="ms-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
