"use client"

import { useEffect, useState, useTransition } from "react"
import { TriangleAlert } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { getActiveTerm, getPersonalizedTimetable } from "../actions"
import AdminView from "./admin-view"
import GuardianView from "./guardian-view"
import StudentView from "./student-view"
import TeacherView from "./teacher-view"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
}

type ViewType = "admin" | "teacher" | "student" | "guardian"

interface PersonalizedData {
  viewType: ViewType
  filterData: {
    teacherId?: string
    classId?: string
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
}

export default function RoleRouter({ dictionary, lang }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [termId, setTermId] = useState<string | null>(null)
  const [viewData, setViewData] = useState<PersonalizedData | null>(null)

  // Load active term and personalized data on mount
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    startTransition(async () => {
      setError(null)
      try {
        // Get active term
        const { term, source } = await getActiveTerm()

        if (!term) {
          setError("No term configured for this school")
          return
        }

        setTermId(term.id)

        // Get personalized timetable data
        const data = await getPersonalizedTimetable({ termId: term.id })
        setViewData(data as PersonalizedData)

        // Log term source for debugging
        if (source === "most_recent") {
          console.log("Using most recent term (no active term set)")
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load timetable"
        )
      }
    })
  }

  // Handle term change (for admin view)
  const handleTermChange = async (newTermId: string) => {
    startTransition(async () => {
      setError(null)
      try {
        setTermId(newTermId)
        const data = await getPersonalizedTimetable({ termId: newTermId })
        setViewData(data as PersonalizedData)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load timetable"
        )
      }
    })
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

  switch (viewData.viewType) {
    case "admin":
      return <AdminView {...commonProps} onTermChange={handleTermChange} />

    case "teacher":
      return (
        <TeacherView
          {...commonProps}
          teacherId={viewData.filterData.teacherId}
        />
      )

    case "student":
      return (
        <StudentView {...commonProps} classId={viewData.filterData.classId} />
      )

    case "guardian":
      return (
        <GuardianView
          {...commonProps}
          childrenIds={viewData.filterData.childrenIds}
        />
      )

    default:
      // Fallback to student view (most restricted)
      return (
        <StudentView {...commonProps} classId={viewData.filterData.classId} />
      )
  }
}
