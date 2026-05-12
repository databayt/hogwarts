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
 * Curriculum dropdown only. Grade is driven by the sibling TabsNav, and the
 * "Curriculum" label was dropped — the trigger speaks for itself ("International
 * US" / "National" / etc.) and lives in a `justify-between` row alongside the
 * tabs at the page level.
 *
 * Each option's display label is looked up by `Curriculum.slug` against
 * `dictionary.community.curriculum.names` so the dropdown reads entirely in
 * the visitor's locale even though the DB stores names in mixed languages
 * (English for `gb-national`/`us-k12`/`ib-diploma`, Arabic for the GCC
 * national curricula). The DB `name` is the fallback when no slug-keyed
 * translation exists. The underlying option `value` stays `Curriculum.code`
 * so URL params and `Subject.curriculum` queries don't change.
 *
 * The trigger is rendered borderless (no input chrome) with a tight gap
 * between the selected text and the chevron — it reads like a tab control,
 * not a form field.
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
  // Slug → localized name. The JSON shape is the source of truth — adding a
  // new curriculum just means adding the slug to both dictionaries; nothing
  // in this file changes.
  const curriculumNames =
    (dictionary?.community?.curriculum?.names as
      | Record<string, string>
      | undefined) ?? {}

  return (
    <Select
      value={curriculum || "us-k12"}
      onValueChange={(value) => setFilters({ curriculum: value })}
    >
      <SelectTrigger
        aria-label={labelCurriculum}
        className="hover:bg-accent/50 dark:hover:bg-accent/50 w-auto gap-1 border-0 bg-transparent px-2 shadow-none dark:bg-transparent"
      >
        <SelectValue placeholder={placeholderCurriculum} />
      </SelectTrigger>
      <SelectContent>
        {options.curricula.map((c) => (
          <SelectItem key={c.id} value={c.code}>
            {curriculumNames[c.slug] ?? c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
