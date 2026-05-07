"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { CommunityFilterOptions } from "./types"
import { gradesFromGradeRange } from "./util"

interface Props {
  options: CommunityFilterOptions
  dictionary: Dictionary
}

// Sentinel used in <Select> for the "no filter" entry. shadcn/Radix forbids
// an empty-string value, so we round-trip an explicit "all" → URL-empty.
const ALL = "__all__"

export function CommunityFilterBar({ options, dictionary }: Props) {
  const [{ curriculum, grade }, setFilters] = useQueryStates(
    {
      curriculum: parseAsString.withDefault(""),
      grade: parseAsInteger,
    },
    { shallow: false }
  )

  const filters = dictionary?.community?.filters
  const labelCurriculum = filters?.curriculum ?? "Curriculum"
  const labelGrade = filters?.grade ?? "Grade"
  const placeholderCurriculum =
    filters?.curriculumPlaceholder ?? "All curricula"
  const placeholderGrade = filters?.gradePlaceholder ?? "All grades"

  // When a curriculum is picked, narrow the grade list to that curriculum's
  // declared range — otherwise default to 1..12.
  const grades = useMemo(() => {
    const selected = options.curricula.find((c) => c.code === curriculum)
    return gradesFromGradeRange(selected?.gradeRange ?? null)
  }, [curriculum, options.curricula])

  return (
    <div className="bg-background sticky top-14 z-30 -mx-4 flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:mx-0 sm:rounded-md sm:border sm:px-4">
      <div className="flex items-center gap-2">
        <label className="text-muted-foreground text-sm">
          {labelCurriculum}
        </label>
        <Select
          value={curriculum || ALL}
          onValueChange={(value) =>
            setFilters({ curriculum: value === ALL ? "" : value })
          }
        >
          <SelectTrigger className="w-[200px]" aria-label={labelCurriculum}>
            <SelectValue placeholder={placeholderCurriculum} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{placeholderCurriculum}</SelectItem>
            {options.curricula.map((c) => (
              <SelectItem key={c.id} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-muted-foreground text-sm">{labelGrade}</label>
        <Select
          value={grade ? String(grade) : ALL}
          onValueChange={(value) =>
            setFilters({ grade: value === ALL ? null : Number(value) })
          }
        >
          <SelectTrigger className="w-[160px]" aria-label={labelGrade}>
            <SelectValue placeholder={placeholderGrade} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{placeholderGrade}</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g} value={String(g)}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(curriculum || grade) && filters?.reset ? (
        <button
          type="button"
          onClick={() => setFilters({ curriculum: "", grade: null })}
          className="text-muted-foreground hover:text-foreground ms-auto text-sm underline-offset-4 hover:underline"
        >
          {filters.reset}
        </button>
      ) : null}
    </div>
  )
}
