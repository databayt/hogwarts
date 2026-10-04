"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useParams } from "next/navigation"

import type { ActionResponse } from "@/lib/action-response"
import { getTeacherSubjects } from "@/components/school-dashboard/timetable/assignments/actions"
import type { TeacherEditorData } from "@/components/school-dashboard/timetable/assignments/queries"

type Pending = Promise<ActionResponse<TeacherEditorData>>

/**
 * Starts loading the Subjects & sections editor's data when the teacher
 * wizard opens, so reaching that step shows the editor at once instead of a
 * skeleton (the wizard switches steps in the browser, with no request in
 * between). The request starts in an effect, never during render — calling
 * a Server Action mid-render makes React retry the render and refire it.
 */
const PrefetchContext = createContext<Map<string, Pending> | null>(null)

export function TeacherSubjectsPrefetch({ children }: { children: ReactNode }) {
  const params = useParams()
  const teacherId = typeof params.id === "string" ? params.id : null
  const [cache] = useState(() => new Map<string, Pending>())

  useEffect(() => {
    if (teacherId && !cache.has(teacherId)) {
      cache.set(teacherId, getTeacherSubjects(teacherId))
    }
  }, [teacherId, cache])

  return <PrefetchContext value={cache}>{children}</PrefetchContext>
}

/**
 * The prefetched first load for this teacher, consumed once. Stable across
 * renders — the editor's load effect depends on it.
 */
export function useTakePrefetchedSubjects(): (
  teacherId: string
) => Pending | null {
  const cache = useContext(PrefetchContext)
  return useCallback(
    (teacherId: string) => {
      const pending = cache?.get(teacherId) ?? null
      cache?.delete(teacherId)
      return pending
    },
    [cache]
  )
}
