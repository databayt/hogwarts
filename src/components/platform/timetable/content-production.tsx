'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useParams } from 'next/navigation'
import { TimetableHeader } from './timetable-header'
import { TimetableGrid } from './timetable-grid'
import { ConfigDialog } from './config-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Shield, Eye } from 'lucide-react'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import type { LegacyTimetableData } from './types'
import { getWeeklyTimetable, getTermsForSelection } from './actions'
import { useTimetablePermissions } from './use-timetable-permissions'
import { SessionProvider } from 'next-auth/react'

interface Props {
  dictionary?: Dictionary['school']
}

interface ClassConfig {
  school: string
  schoolCode: string
  grade: string
  class: string
  lunchAfter: number
  displayFallbackData: boolean
  showAllSubjects: boolean
}

function getCurrentSchoolYear() {
  const today = new Date()
  let schoolYear = today.getFullYear()
  if (today.getMonth() < 2) {
    schoolYear--
  }
  return schoolYear
}

function generatePeriods(timetableData: LegacyTimetableData | null, classConfig: ClassConfig | null) {
  if (!timetableData?.day_time?.length || !timetableData?.timetable?.length) return []

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const days = (timetableData?.days as number[] | undefined)?.map((d) => dayLabels[d] ?? String(d)) ?? ["Mon", "Tue", "Wed", "Thu", "Fri"]

  // Create all regular periods
  const periods = timetableData.day_time.map((timeStr: string, idx: number) => {
    const period = timeStr.split('(')[0]
    const time = timeStr.split('(')[1]?.replace(')', '')

    return {
      id: period,
      time,
      subjects: days.map((_, dayIndex) => {
        const periodData = timetableData.timetable[dayIndex]?.[idx]
        return periodData?.subject || ""
      })
    }
  })

  // Insert lunch at the correct position
  const lunchPeriod = {
    id: "Lunch",
    time: "12:20~13:20",
    subjects: Array(days.length).fill("Lunch")
  }

  const lunchAfterFromServer = typeof timetableData?.lunchAfterPeriod === 'number' ? timetableData.lunchAfterPeriod : null
  const lunchAfter = lunchAfterFromServer ?? (typeof classConfig?.lunchAfter === 'number' ? classConfig.lunchAfter : null)
  if (typeof lunchAfter === 'number') periods.splice(lunchAfter, 0, lunchPeriod)

  return periods
}

function TimetableContentInner({ dictionary }: Props) {
  const params = useParams()
  const subdomain = params?.subdomain as string

  // Get permissions and role info
  const {
    role,
    permissions,
    viewType,
    isAdmin,
    canEdit,
    canExport,
    canConfigure,
    readOnlyMode
  } = useTimetablePermissions()

  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [timetableData, setTimetableData] = useState<LegacyTimetableData | null>(null)
  const [classConfig, setClassConfig] = useState<ClassConfig | null>(null)
  const [tempConfig, setTempConfig] = useState<ClassConfig | null>(null)
  const [isNextWeek, setIsNextWeek] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [teacherInfo, setTeacherInfo] = useState<Record<string, string>>({})
  const [termId, setTermId] = useState<string | null>(null)

  // Load initial term and timetable data
  useEffect(() => {
    loadInitialData()
  }, [subdomain])

  // Reload when week changes
  useEffect(() => {
    if (termId) {
      loadTimetable()
    }
  }, [isNextWeek, termId])

  const loadInitialData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get available terms first
      const { terms } = await getTermsForSelection()

      if (!terms || terms.length === 0) {
        setError('No terms found. Please create a term first.')
        setIsLoading(false)
        return
      }

      // Use the first (most recent) term
      const firstTerm = terms[0]
      setTermId(firstTerm.id)

      // Load timetable for this term
      await loadTimetableForTerm(firstTerm.id)
    } catch (err) {
      console.error('Failed to load initial data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load timetable data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTimetableForTerm = async (term: string) => {
    try {
      const data = await getWeeklyTimetable({
        termId: term,
        weekOffset: (isNextWeek ? 1 : 0) as 0 | 1,
      })

      setTimetableData(data as LegacyTimetableData)

      // Set default class config from school data if not already set
      if (!classConfig) {
        setClassConfig({
          school: subdomain || 'School',
          schoolCode: subdomain || 'school',
          grade: '1',
          class: 'A',
          lunchAfter: data.lunchAfterPeriod ?? 4,
          showAllSubjects: false,
          displayFallbackData: false
        })
      }
    } catch (err) {
      console.error('Failed to load timetable:', err)
      throw err
    }
  }

  const loadTimetable = async () => {
    if (!termId) return

    startTransition(async () => {
      setError(null)
      try {
        await loadTimetableForTerm(termId)
      } catch (err) {
        console.error('Failed to load timetable:', err)
        setError(err instanceof Error ? err.message : 'Failed to load timetable')
      }
    })
  }

  const changeWeek = (isNext: boolean) => {
    if ((isNext && isNextWeek) || (!isNext && !isNextWeek)) {
      return
    }
    setIsNextWeek(isNext)
  }

  const handleConfigSave = (newConfig: ClassConfig) => {
    setTempConfig(newConfig)
    setClassConfig(newConfig)
    setShowConfig(false)
    // Could save to localStorage or backend here
  }

  const handleSubjectChange = (dayIndex: number, periodIdx: number, newSubject: string) => {
    console.log(`Subject changed: Day ${dayIndex}, Period ${periodIdx} -> ${newSubject}`)
  }

  const saveTeacherInfo = (subject: string, info: string) => {
    setTeacherInfo(prev => ({ ...prev, [subject]: info }))
  }

  const getTeacherInfo = (subject: string) => {
    return teacherInfo[subject]
  }

  const getAvailableSubjects = () => {
    if (!timetableData?.timetable) return []

    const subjects = new Set<string>()
    timetableData.timetable.forEach((day: any[]) => {
      day.forEach((period: any) => {
        if (period?.subject && period.subject !== "Lunch") {
          subjects.add(period.subject)
        }
      })
    })

    return Array.from(subjects).sort()
  }

  const isWeekChangeLoading = isPending

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadInitialData} className="mt-4">
          <RefreshCw className="h-4 w-4 me-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!classConfig) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    )
  }

  const periods = generatePeriods(timetableData, classConfig)
  const availableSubjects = getAvailableSubjects()

  return (
    <div className="space-y-6">
      {/* Role indicator badge */}
      {role && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg print:hidden">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">
            Viewing as: {role}
          </span>
          {readOnlyMode && (
            <>
              <Eye className="h-4 w-4 ms-2" />
              <span className="text-sm text-muted-foreground">
                Read-only mode
              </span>
            </>
          )}
        </div>
      )}

      <main className="min-h-screen print:bg-white print:py-4">
        <div className="max-w-4xl mx-auto print:max-w-none">
          <TimetableHeader
            schoolYear={getCurrentSchoolYear()}
            school={classConfig.school}
            grade={classConfig.grade}
            class={classConfig.class}
            isNextWeek={isNextWeek}
            isWeekChangeLoading={isWeekChangeLoading}
            onWeekChange={changeWeek}
          />

          {isWeekChangeLoading ? (
            <div className="overflow-x-auto shadow-lg rounded-xl border border-border">
              <div className="min-w-full bg-background">
                <Skeleton className="h-[600px]" />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow-sm border border-border print:shadow-none print:border print:rounded-none">
              <TimetableGrid
                periods={periods}
                timetableData={timetableData}
                onTeacherInfoSave={canEdit ? saveTeacherInfo : () => {}}
                getTeacherInfo={getTeacherInfo}
                onSubjectChange={canEdit ? handleSubjectChange : undefined}
                showAllSubjects={classConfig.showAllSubjects}
                availableSubjects={availableSubjects}
              />
            </div>
          )}

          <div className="mt-6 print:hidden">
            <div className="flex justify-between items-center mb-4">
              {timetableData?.update_date && !error && (
                <p className="ms-1 text-sm text-muted-foreground">
                  Updated: {new Date(timetableData.update_date).toLocaleString()}
                </p>
              )}

              {/* Admin controls - only shown to admins */}
              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfig(true)}
                  >
                    Configure Settings
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Config dialog - only accessible by admins */}
          {canConfigure && (
            <ConfigDialog
              open={showConfig}
              onOpenChange={setShowConfig}
              classConfig={classConfig}
              onConfigChange={setTempConfig}
              onSave={handleConfigSave}
            />
          )}
        </div>
      </main>
    </div>
  )
}

// Export wrapped component with SessionProvider for auth context
export function TimetableContent({ dictionary }: Props) {
  return (
    <SessionProvider>
      <TimetableContentInner dictionary={dictionary} />
    </SessionProvider>
  )
}
