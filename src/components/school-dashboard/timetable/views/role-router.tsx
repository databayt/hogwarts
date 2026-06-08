"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition, type ReactNode } from "react"
import { TriangleAlert } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import {
  getActiveTerm,
  getPersonalizedTimetable,
  provisionTimetableForSchool,
} from "../actions"
import { DRAFT_TERM_ID } from "../config"
import AdminView from "./admin-view"
import GuardianView from "./guardian-view"
import StudentView from "./student-view"
import TeacherView from "./teacher-view"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
  defaultTab?: "today" | "full"
}

type ViewType = "admin" | "teacher" | "student" | "guardian"

interface PersonalizedData {
  viewType: ViewType
  editable?: boolean
  filterData: {
    teacherId?: string
    classId?: string
    classIds?: string[]
    childrenIds?: string[]
  }
  termInfo: {
    id: string
    termNumber: number
    yearName: string
    label: string
  }
  workingDays: number[]
  periods: Array<{
    id: string
    name: string
    order: number
    startTime: Date
    endTime: Date
    isBreak: boolean
  }>
  lunchAfterPeriod: number | null
  /** True when this is a display-only fallback grid (no real Term exists yet). */
  isDraft?: boolean
  /** True when the current user (ADMIN/DEVELOPER) can provision a real term. */
  canProvision?: boolean
}

export default function RoleRouter({ dictionary, lang, defaultTab }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [termId, setTermId] = useState<string | null>(null)
  const [viewData, setViewData] = useState<PersonalizedData | null>(null)
  const [provisioning, setProvisioning] = useState(false)

  // Load active term and personalized data on mount
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    startTransition(async () => {
      setError(null)
      try {
        // Get active term. getActiveTerm now always returns a term — a
        // display-only draft (id = DRAFT_TERM_ID) when the school has none — so
        // the grid renders an empty fallback instead of hard-blocking.
        const { term, source } = await getActiveTerm()

        if (!term) {
          setViewData(null)
          return
        }

        setTermId(term.id)

        // Get personalized timetable data
        const data = await getPersonalizedTimetable({ termId: term.id })
        setViewData(data as PersonalizedData)

        // Note: Using most recent term when no active term is set
        void source
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load timetable"
        )
      }
    })
  }

  // Provision a real term from the school's structure, then reload into the
  // editable real grid. Backs the draft "Set up timetable" CTA (admins only).
  const handleProvision = async () => {
    setProvisioning(true)
    setError(null)
    try {
      const res = await provisionTimetableForSchool()
      if (res.success) {
        loadInitialData()
      } else {
        setError(dictionary.timetable.setupFailed)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : dictionary.timetable.setupFailed
      )
    } finally {
      setProvisioning(false)
    }
  }

  // Loading state
  if (isPending && !viewData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // No data state
  if (!viewData || !termId) {
    return (
      <Alert>
        <AlertDescription>No timetable data available</AlertDescription>
      </Alert>
    )
  }

  // Route to appropriate view based on role
  const commonProps = {
    dictionary,
    lang,
    termId,
    termInfo: viewData.termInfo,
    workingDays: viewData.workingDays,
    periods: viewData.periods,
    lunchAfterPeriod: viewData.lunchAfterPeriod,
    isLoading: isPending,
  }

  let view: ReactNode
  switch (viewData.viewType) {
    case "admin":
      view = (
        <AdminView {...commonProps} editable={viewData.editable !== false} />
      )
      break

    case "teacher":
      view = (
        <TeacherView
          {...commonProps}
          teacherId={viewData.filterData.teacherId}
          defaultTab={defaultTab}
        />
      )
      break

    case "guardian":
      view = (
        <GuardianView
          {...commonProps}
          childrenIds={viewData.filterData.childrenIds}
          defaultTab={defaultTab}
        />
      )
      break

    case "student":
    default:
      // Student view is also the most-restricted fallback.
      view = (
        <StudentView
          {...commonProps}
          classId={viewData.filterData.classId}
          classIds={viewData.filterData.classIds}
          defaultTab={defaultTab}
        />
      )
  }

  const isDraft = viewData.termInfo.id === DRAFT_TERM_ID

  return (
    <div className="space-y-4">
      {isDraft && viewData.canProvision && (
        <Alert>
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{dictionary.timetable.draftNotice}</span>
            <Button size="sm" onClick={handleProvision} disabled={provisioning}>
              {provisioning
                ? dictionary.timetable.settingUp
                : dictionary.timetable.setupTimetable}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {view}
    </div>
  )
}
