"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import {
  getTeachingScopeOptions,
  type TeachingScopeGrade,
} from "@/components/school-dashboard/teaching-scope/actions"

/**
 * The school's grades and their sections are the same for every
 * announcement and don't change mid-session, so they load once per page —
 * reopening a form is then free.
 */
let gradesCache: Promise<TeachingScopeGrade[]> | null = null

function loadGrades(): Promise<TeachingScopeGrade[]> {
  gradesCache ??= getTeachingScopeOptions().then((res) =>
    res.success && res.data ? res.data.grades : []
  )
  return gradesCache
}

/**
 * Grade and section choices for an announcement's audience — loaded only
 * once one is needed (school-wide is the common case).
 */
export function useAnnouncementScopeOptions(enabled: boolean) {
  const [grades, setGrades] = useState<TeachingScopeGrade[]>([])
  useEffect(() => {
    if (!enabled) return
    let active = true
    loadGrades().then((g) => {
      if (active) setGrades(g)
    })
    return () => {
      active = false
    }
  }, [enabled])

  return {
    gradeOptions: grades.map((g) => ({ label: g.name, value: g.id })),
    sectionOptions: grades.flatMap((g) =>
      g.sections.map((s) => ({ label: s.name, value: s.id }))
    ),
  }
}
