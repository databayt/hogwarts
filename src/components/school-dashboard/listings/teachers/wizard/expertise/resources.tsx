"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  createContext,
  ReactNode,
  use,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

import { getGradesAndSubjects, type GradeWithSubjects } from "./actions"

/**
 * The expertise step's grade/subject catalogue, requested once when the
 * teacher wizard opens. The step used to be an async server page that awaited
 * these queries (plus their translations) before it could render, so
 * reaching it blocked on them; now they load while the admin fills in the
 * earlier steps, and the step reads the settled promise with `use()`.
 */
const GradesContext = createContext<Promise<GradeWithSubjects[]> | null>(null)

export function TeacherExpertiseResources({
  children,
}: {
  children: ReactNode
}) {
  // The promise is made during render (pure); the request starts in an
  // effect. Calling a Server Action while rendering updates the router
  // mid-render — React discards that render and re-runs the initializer, so
  // the request fired again on every retry, forever.
  const [grades] = useState(() => {
    let resolve!: (value: GradeWithSubjects[]) => void
    const promise = new Promise<GradeWithSubjects[]>((r) => (resolve = r))
    return { promise, resolve }
  })
  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    getGradesAndSubjects()
      .then((result) => (result.success ? (result.data ?? []) : []))
      .catch((): GradeWithSubjects[] => [])
      .then(grades.resolve)
  }, [grades])

  return (
    <GradesContext.Provider value={grades.promise}>
      {children}
    </GradesContext.Provider>
  )
}

/** Suspends until the catalogue has loaded. */
export function useTeacherExpertiseGrades(): GradeWithSubjects[] {
  const grades = useContext(GradesContext)
  if (!grades) {
    throw new Error(
      "useTeacherExpertiseGrades must be used within TeacherExpertiseResources"
    )
  }
  return use(grades)
}
