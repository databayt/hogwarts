"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo } from "react"
import { parseAsInteger, useQueryStates } from "nuqs"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { CommunityFilterOptions } from "./types"
import { gradesFromGradeRange } from "./util"

interface Props {
  /** Currently active grade (1..12), or `null` for "All". */
  active: number | null
  /** Filter options — used to look up the active curriculum's gradeRange. */
  options: CommunityFilterOptions
  /** Curriculum.code currently selected (for resetting an out-of-range grade). */
  currentCurriculum: string
  dictionary: Dictionary
}

/**
 * Under-hero pill nav: `[All] [1] [2] … [12]`. Mirrors the kun homepage's
 * `HomeTabs` pattern (`/Users/abdout/kun/src/components/root/home/tabs.tsx`)
 * but instead of section anchors it filters the SubjectsGrid by grade via
 * the shared `?grade=` URL param.
 *
 * Pills are trimmed to the selected curriculum's `gradeRange` (e.g. `"7-12"`
 * → only 6 pills). If the active grade falls outside the new range when the
 * curriculum changes, an effect resets the URL param to `null` (= "All").
 */
export function CommunityTabsNav({
  active,
  options,
  currentCurriculum,
  dictionary,
}: Props) {
  const [, setQuery] = useQueryStates(
    { grade: parseAsInteger },
    { shallow: false }
  )

  const grades = useMemo(() => {
    const selected = options.curricula.find((c) => c.code === currentCurriculum)
    return gradesFromGradeRange(selected?.gradeRange ?? null)
  }, [options.curricula, currentCurriculum])

  // Defensive reset: if active grade is outside the curriculum's range,
  // drop it back to "All" rather than showing an empty grid.
  useEffect(() => {
    if (active && !grades.includes(active)) {
      setQuery({ grade: null })
    }
  }, [active, grades, setQuery])

  const tabs = dictionary?.community?.tabs as
    | {
        all?: string
        gradeShort?: string
        gradeAria?: string
      }
    | undefined
  const allLabel = tabs?.all ?? "All"
  const ariaTemplate = tabs?.gradeAria ?? "Grade {n}"

  return (
    <nav
      aria-label={allLabel}
      className="border-border/50 dark:border-border border-b-[0.5px] py-3"
    >
      <ScrollArea className="w-full">
        <div className="flex items-center gap-1">
          <PillButton
            active={active === null}
            onClick={() => setQuery({ grade: null })}
            label={allLabel}
          />
          {grades.map((g) => (
            <PillButton
              key={g}
              active={active === g}
              onClick={() => setQuery({ grade: g })}
              label={String(g)}
              ariaLabel={ariaTemplate.replace("{n}", String(g))}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </nav>
  )
}

interface PillProps {
  active: boolean
  onClick: () => void
  label: string
  ariaLabel?: string
}

function PillButton({ active, onClick, label, ariaLabel }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active || undefined}
      aria-label={ariaLabel ?? label}
      aria-pressed={active}
      className={cn(
        "hover:text-primary flex h-7 items-center justify-center rounded-full px-4 text-sm transition-colors",
        active ? "bg-muted text-primary" : "text-muted-foreground"
      )}
    >
      <span>{label}</span>
    </button>
  )
}
