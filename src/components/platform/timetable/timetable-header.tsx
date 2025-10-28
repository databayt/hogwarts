'use client'

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { useTimetableStore } from "@/components/platform/timetable/timetable"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScheduleSettingsDialog } from "@/components/platform/timetable/schedule-settings-dialog"
import { SlotEditor } from "@/components/platform/timetable/slot-editor"
import { ConflictsDrawer } from "@/components/platform/timetable/conflicts-drawer"
import type { TermsApiResponse, ClassesApiResponse, TeachersApiResponse, ConflictsApiResponse } from "./types"

interface TimetableHeaderProps {
  schoolYear: number
  school: string
  grade: string
  class: string
  isNextWeek: boolean
  isWeekChangeLoading: boolean
  onWeekChange: (isNext: boolean) => void
}

export function TimetableHeader({
  schoolYear,
  school,
  grade,
  class: classNumber,
  isNextWeek,
  isWeekChangeLoading,
  onWeekChange,
}: TimetableHeaderProps) {
  const { loadWeekly } = useTimetableStore()
  const [termId, setTermId] = useState<string>("")
  const [terms, setTerms] = useState<Array<{ id: string; label: string }>>([])
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class')
  const [classes, setClasses] = useState<Array<{ id: string; label: string }>>([])
  const [teachers, setTeachers] = useState<Array<{ id: string; label: string }>>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedTeacher, setSelectedTeacher] = useState<string>("")
  const [openSettings, setOpenSettings] = useState(false)
  const [openSlot, setOpenSlot] = useState(false)
  const [conflicts, setConflicts] = useState<number | null>(null)
  const [openConflicts, setOpenConflicts] = useState(false)
  const [applyTarget, setApplyTarget] = useState<{ dayOfWeek?: number; periodId?: string }>({})

  async function safeFetchJson<T = unknown>(input: RequestInfo | URL): Promise<T | null> {
    try {
      const res = await fetch(input)
      if (!res.ok) return null
      return (await res.json()) as T
    } catch {
      return null
    }
  }

  useEffect(() => {
    ;(async () => {
      const data = await safeFetchJson<TermsApiResponse>('/api/terms')
      const nextTerms = data?.terms ?? []
      setTerms(nextTerms)
      if (!termId && nextTerms[0]) setTermId(nextTerms[0].id)
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!termId) return
      const [cData, tData] = await Promise.all([
        safeFetchJson<ClassesApiResponse>(`/api/classes?termId=${termId}`),
        safeFetchJson<TeachersApiResponse>(`/api/teachers?termId=${termId}`),
      ])
      const nextClasses = cData?.classes ?? []
      const nextTeachers = tData?.teachers ?? []
      setClasses(nextClasses)
      setTeachers(nextTeachers)
      if (!selectedClass && nextClasses[0]) setSelectedClass(nextClasses[0].id)
      if (!selectedTeacher && nextTeachers[0]) setSelectedTeacher(nextTeachers[0].id)
    })()
  }, [termId])

  // Refetch on selector changes
  useEffect(() => {
    ;(async () => {
      if (!termId) return
      const params: { termId: string; weekOffset?: 0 | 1; classId?: string; teacherId?: string } = { termId, weekOffset: isNextWeek ? 1 : 0 }
      if (viewMode === 'class' && selectedClass) params.classId = selectedClass
      if (viewMode === 'teacher' && selectedTeacher) params.teacherId = selectedTeacher
      try {
        await loadWeekly(params)
      } catch {
        // ignore
      }
      const cd = await safeFetchJson<ConflictsApiResponse>(`/api/timetable/conflicts?termId=${termId}`)
      setConflicts(cd?.conflicts ? cd.conflicts.length : 0)
    })()
  }, [termId, viewMode, selectedClass, selectedTeacher, isNextWeek, loadWeekly])

  return (
    <div className="mb-2 print:mb-8">
      <p className="lead print:text-lg">
        {schoolYear} School Year · {school}
      </p>
      <h2 className="print:text-4xl mb-4">
        Grade {grade}, Class {classNumber} · Timetable
      </h2>
      <div className="flex flex-wrap gap-2 mb-4 print:hidden items-center">
        <Select value={termId} onValueChange={setTermId}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Term" /></SelectTrigger>
          <SelectContent>
            {terms.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'class' | 'teacher')}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="View" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="class">Class</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
          </SelectContent>
        </Select>

        {viewMode === 'class' ? (
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select teacher" /></SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          variant="outline"
          onClick={() => onWeekChange(false)}
          disabled={!isNextWeek || isWeekChangeLoading}
          className={cn(
            "border-border rounded-xl bg-muted hover:bg-muted/80",
            "px-3",
            isWeekChangeLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronLeft className={cn(
            "w-4 h-4",
            "text-foreground",
            (isWeekChangeLoading || !isNextWeek) && "text-muted-foreground"
          )} />
        </Button>
        <Button
          variant="outline"
          onClick={() => onWeekChange(true)}
          disabled={isNextWeek || isWeekChangeLoading}
          className={cn(
            "border-border rounded-xl bg-muted hover:bg-muted/80",
            "px-3",
            isWeekChangeLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronRight className={cn(
            "w-4 h-4",
            "text-foreground",
            (isWeekChangeLoading || isNextWeek) && "text-muted-foreground"
          )} />
        </Button>

        <Button variant="ghost" className="ml-2" onClick={() => setOpenSettings(true)}>
          Schedule settings
        </Button>
        <Button variant="ghost" onClick={() => setOpenSlot(true)}>
          Edit slots
        </Button>
        {conflicts != null && (
          <button
            className={cn("muted underline-offset-2", conflicts > 0 ? "text-destructive underline" : "")}
            onClick={() => setOpenConflicts(true)}
          >
            <small>{conflicts} conflict(s)</small>
          </button>
        )}

        {/* Timetable Options Indicators */}
        <div className="flex items-center gap-2 ml-4">
          {useTimetableStore.getState().classConfig?.showAllSubjects && (
            <div className="px-2 py-1 bg-chart-1 text-chart-1 rounded-full">
              <small>All Subjects</small>
            </div>
          )}
          {useTimetableStore.getState().classConfig?.displayFallbackData && (
            <div className="px-2 py-1 bg-chart-2 text-chart-2 rounded-full">
              <small>Fallback Data</small>
            </div>
          )}
        </div>
      </div>

      <ScheduleSettingsDialog open={openSettings} onOpenChange={setOpenSettings} termId={termId} onSaved={() => { /* no-op, grid will reflect on next load */ }} />
      <SlotEditor open={openSlot} onOpenChange={setOpenSlot} termId={termId} initialDayOfWeek={applyTarget.dayOfWeek} initialPeriodId={applyTarget.periodId} />
      <ConflictsDrawer
        termId={termId}
        open={openConflicts}
        onOpenChange={setOpenConflicts}
        onApplySuggestion={(s) => {
          setApplyTarget(s)
          setOpenConflicts(false)
          setOpenSlot(true)
        }}
      />
    </div>
  )
} 