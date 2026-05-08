"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { parseAsString, useQueryStates } from "nuqs"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { CommunityFilterOptions } from "./types"

interface Props {
  options: CommunityFilterOptions
  dictionary: Dictionary
}

/**
 * Curriculum dropdown only. Grade is now driven by the under-hero TabsNav,
 * so this bar is intentionally narrow.
 *
 * The `us-k12` row's `name` is overridden in the dropdown to read
 * "International US" (or its localized equivalent), matching the user-facing
 * mental model. Underlying value stays `us-k12` so existing query code, URL
 * params, and the seeded `Subject.curriculum` column all still match.
 */
export function CommunityFilterBar({ options, dictionary }: Props) {
  const [{ curriculum }, setFilters] = useQueryStates(
    { curriculum: parseAsString.withDefault("us-k12") },
    { shallow: false }
  )

  const filters = dictionary?.community?.filters
  const labelCurriculum = filters?.curriculum ?? "Curriculum"
  const placeholderCurriculum =
    filters?.curriculumPlaceholder ?? "All curricula"
  const internationalUsLabel =
    dictionary?.community?.curriculum?.internationalUS ?? "International US"

  return (
    <div className="bg-background flex flex-wrap items-center gap-3 py-3">
      <div className="flex items-center gap-2">
        <label className="text-muted-foreground text-sm">
          {labelCurriculum}
        </label>
        <Select
          value={curriculum || "us-k12"}
          onValueChange={(value) => setFilters({ curriculum: value })}
        >
          <SelectTrigger className="w-[220px]" aria-label={labelCurriculum}>
            <SelectValue placeholder={placeholderCurriculum} />
          </SelectTrigger>
          <SelectContent>
            {options.curricula.map((c) => (
              <SelectItem key={c.id} value={c.code}>
                {c.code === "us-k12" ? internationalUsLabel : c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
