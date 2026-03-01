"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Settings,
  TriangleAlert,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import {
  detectTimetableConflicts,
  getClassesForSelection,
  getGradeLevelsForSelection,
  getRoomsForSelection,
  getSubjectsForSlotEditor,
  getTeachersForSelection,
  getTeachersForSlotEditor,
  getTimetableByGradeLevel,
  getTimetableByTeacher,
  upsertTimetableSlot,
} from "../actions"
import { ConflictsDrawer } from "../conflicts-drawer"
import { SlotEditorDialog } from "../slot-editor-dialog"
import type {
  ClassInfo,
  ClassroomInfo,
  SubjectInfo,
  TeacherInfo,
  TimetableSlot,
} from "../types"
import SimpleGrid from "./simple-grid"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
  termId: string
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
  isLoading?: boolean
}

type ViewMode = "grade" | "teacher"

export default function AdminView({
  dictionary,
  lang,
  termId,
  workingDays,
  periods,
  lunchAfterPeriod,
  isLoading,
}: Props) {
  const d = dictionary?.timetable
  const isRTL = lang === "ar"

  const [viewMode, setViewMode] = useState<ViewMode>("grade")
  const [selectedId, setSelectedId] = useState<string>("")
  const [selectedGrade, setSelectedGrade] = useState<string>("")

  // Data lists for selectors
  const [teachers, setTeachers] = useState<
    Array<{ id: string; label: string }>
  >([])
  const [rooms, setRooms] = useState<
    Array<{ id: string; label: string; capacity: number }>
  >([])

  // Grade-level data
  const [gradeLevels, setGradeLevels] = useState<
    Array<{ id: string; name: string; order: number }>
  >([])
  const [gradeData, setGradeData] = useState<
    Map<
      string,
      {
        slots: any[]
        workingDays: number[]
        periods: any[]
        lunchAfterPeriod: number | null
        subjects: Array<{ id: string; name: string }>
      }
    >
  >(new Map())
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set())
  const [loadingGrades, setLoadingGrades] = useState<Set<string>>(new Set())

  // Timetable data (teacher view)
  const [slots, setSlots] = useState<any[]>([])
  const [entityInfo, setEntityInfo] = useState<any>(null)

  // Conflicts
  const [conflicts, setConflicts] = useState<any[]>([])
  const [showConflicts, setShowConflicts] = useState(false)
  const [conflictSlotIds, setConflictSlotIds] = useState<Set<string>>(new Set())

  // Slot editor
  const [slotEditorOpen, setSlotEditorOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined)
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(
    undefined
  )

  // Slot editor resource lists
  const [slotEditorTeachers, setSlotEditorTeachers] = useState<TeacherInfo[]>(
    []
  )
  const [slotEditorSubjects, setSlotEditorSubjects] = useState<SubjectInfo[]>(
    []
  )
  const [slotEditorClassrooms, setSlotEditorClassrooms] = useState<
    ClassroomInfo[]
  >([])
  const [slotEditorClasses, setSlotEditorClasses] = useState<ClassInfo[]>([])

  const [isLoadingData, setIsLoadingData] = useState(false)

  // Load selector options + slot editor resources on mount
  useEffect(() => {
    loadSelectorOptions()
    loadSlotEditorResources()
  }, [termId])

  // Clear grade data when term changes
  useEffect(() => {
    setGradeData(new Map())
    setExpandedGrades(new Set())
    setSelectedGrade("")
  }, [termId])

  // Load teacher timetable when teacher selection changes
  useEffect(() => {
    if (selectedId && viewMode === "teacher") {
      loadTimetable()
    }
  }, [selectedId, termId])

  const loadSelectorOptions = async () => {
    const [gradesResult, teachersResult] = await Promise.all([
      getGradeLevelsForSelection({ termId }),
      getTeachersForSelection({ termId }),
    ])
    setGradeLevels(gradesResult.gradeLevels)
    setTeachers(teachersResult.teachers)

    // Auto-expand first grade on initial load
    if (gradesResult.gradeLevels.length > 0) {
      const firstName = gradesResult.gradeLevels[0].name
      setSelectedGrade(firstName)
      setExpandedGrades(new Set([firstName]))
      loadGradeData(firstName)
    }
  }

  const loadSlotEditorResources = async () => {
    const [subjectsResult, teachersResult, classesResult, roomsResult] =
      await Promise.all([
        getSubjectsForSlotEditor({ termId }),
        getTeachersForSlotEditor({ termId }),
        getClassesForSelection({ termId }),
        getRoomsForSelection(),
      ])
    setSlotEditorSubjects(subjectsResult.subjects)
    setSlotEditorTeachers(teachersResult.teachers)
    setSlotEditorClasses(
      classesResult.classes.map((c) => ({
        id: c.id,
        name: c.label,
        grade: "",
        section: "",
        capacity: 50,
        currentEnrollment: 0,
      }))
    )
    setSlotEditorClassrooms(
      roomsResult.rooms.map((r) => ({
        id: r.id,
        name: r.label,
        capacity: r.capacity,
        type: "regular" as const,
        isAvailable: true,
      }))
    )
    setRooms(roomsResult.rooms)
  }

  const loadGradeData = async (gradeName: string) => {
    setLoadingGrades((prev) => new Set(prev).add(gradeName))
    try {
      const result = await getTimetableByGradeLevel({ termId, gradeName })
      setGradeData((prev) => {
        const next = new Map(prev)
        next.set(gradeName, {
          slots: result.slots,
          workingDays: result.workingDays,
          periods: result.periods,
          lunchAfterPeriod: result.lunchAfterPeriod ?? null,
          subjects: result.subjects,
        })
        return next
      })
    } finally {
      setLoadingGrades((prev) => {
        const next = new Set(prev)
        next.delete(gradeName)
        return next
      })
    }
  }

  const toggleGrade = (gradeName: string) => {
    setExpandedGrades((prev) => {
      const next = new Set(prev)
      if (next.has(gradeName)) {
        next.delete(gradeName)
      } else {
        next.add(gradeName)
        if (!gradeData.has(gradeName)) {
          loadGradeData(gradeName)
        }
      }
      return next
    })
  }

  const loadTimetable = useCallback(async () => {
    setIsLoadingData(true)
    try {
      const result = await getTimetableByTeacher({
        termId,
        teacherId: selectedId,
      })
      setEntityInfo(result.teacherInfo)
      setSlots(result?.slots || [])
    } finally {
      setIsLoadingData(false)
    }
  }, [selectedId, termId])

  const checkConflicts = async () => {
    const result = await detectTimetableConflicts({ termId })
    setConflicts(result.conflicts)
    setShowConflicts(true)

    const conflictIds = new Set<string>()
    for (const conflict of result.conflicts) {
      if (conflict.classA?.id) conflictIds.add(conflict.classA.id)
      if (conflict.classB?.id) conflictIds.add(conflict.classB.id)
    }
    setConflictSlotIds(conflictIds)
  }

  const handleGradeSelect = (gradeName: string) => {
    setSelectedGrade(gradeName)
    setSelectedId("")
    setViewMode("grade")
    setExpandedGrades(new Set([gradeName]))
    if (!gradeData.has(gradeName)) {
      loadGradeData(gradeName)
    }
  }

  const handleTeacherSelect = (teacherId: string) => {
    setSelectedId(teacherId)
    setSelectedGrade("")
    setViewMode("teacher")
    setExpandedGrades(new Set())
    setSlots([])
    setEntityInfo(null)
    setIsLoadingData(true)
  }

  // Handle slot click to open editor
  const handleSlotClick = useCallback(
    (day: number, periodId: string, slot?: any) => {
      setSelectedDay(day)
      setSelectedPeriod(periodId)
      setSelectedSlot(slot || null)
      setSlotEditorOpen(true)
    },
    []
  )

  // Handle slot save
  const handleSlotSave = useCallback(
    async (data: Partial<TimetableSlot>) => {
      await upsertTimetableSlot({
        termId,
        dayOfWeek: data.dayOfWeek!,
        periodId: data.periodId!,
        classId: data.classId!,
        teacherId: data.teacherId!,
        classroomId: data.classroomId!,
        weekOffset: data.weekOffset ?? 0,
      })

      // Reload timetable and re-check conflicts
      await loadTimetable()
      const result = await detectTimetableConflicts({ termId })
      const conflictIds = new Set<string>()
      for (const conflict of result.conflicts) {
        if (conflict.classA?.id) conflictIds.add(conflict.classA.id)
        if (conflict.classB?.id) conflictIds.add(conflict.classB.id)
      }
      setConflictSlotIds(conflictIds)
      setConflicts(result.conflicts)
    },
    [termId, loadTimetable]
  )

  // Handle conflict suggestion application
  const handleApplySuggestion = useCallback(
    (suggestion: { dayOfWeek: number; periodId: string }) => {
      setSelectedDay(suggestion.dayOfWeek)
      setSelectedPeriod(suggestion.periodId)
      setSelectedSlot(null)
      setSlotEditorOpen(true)
    },
    []
  )

  return (
    <div className="space-y-4">
      {/* Toolbar: Grade + Teacher selectors, Conflicts, Settings */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Grade + Teacher selectors */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 shrink-0" />
                <Select value={selectedGrade} onValueChange={handleGradeSelect}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={
                        (d?.navigation as any)?.byGrade || "Select grade"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((grade) => (
                      <SelectItem key={grade.id} value={grade.name}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" />
                <Select value={selectedId} onValueChange={handleTeacherSelect}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={d?.navigation?.byTeacher || "Select teacher"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={checkConflicts}>
                <TriangleAlert className="me-2 h-4 w-4" />
                Check Conflicts
              </Button>

              {conflicts.length > 0 && (
                <Badge variant="destructive">
                  {conflicts.length} conflict
                  {conflicts.length !== 1 ? "s" : ""}
                </Badge>
              )}

              <Button variant="ghost" size="icon" asChild>
                <a href={`/${lang}/s/_/timetable/settings`}>
                  <Settings className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade View */}
      {viewMode === "grade" && (
        <div className="space-y-3">
          {gradeLevels.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center">
                <GraduationCap className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No grade levels found for this term</p>
              </CardContent>
            </Card>
          ) : (
            gradeLevels.map((grade) => {
              const isExpanded = expandedGrades.has(grade.name)
              const isLoadingGrade = loadingGrades.has(grade.name)
              const data = gradeData.get(grade.name)

              return (
                <Collapsible
                  key={grade.id}
                  open={isExpanded}
                  onOpenChange={() => toggleGrade(grade.name)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="hover:bg-muted/50 cursor-pointer pb-3 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                            <CardTitle className="text-base">
                              {grade.name}
                            </CardTitle>
                            {data && (
                              <Badge variant="secondary">
                                {data.subjects.length} subject
                                {data.subjects.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {isLoadingGrade ? (
                          <Skeleton className="h-48 w-full rounded-lg" />
                        ) : data ? (
                          <SimpleGrid
                            slots={data.slots}
                            workingDays={data.workingDays}
                            periods={data.periods}
                            lunchAfterPeriod={data.lunchAfterPeriod}
                            isRTL={isRTL}
                            viewMode="class"
                            editable={false}
                          />
                        ) : null}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })
          )}
        </div>
      )}

      {/* Teacher View */}
      {viewMode === "teacher" && (
        <>
          {entityInfo && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Teacher</p>
                    <p className="font-semibold">
                      {entityInfo.name || entityInfo.label}
                    </p>
                  </div>

                  {entityInfo.email && (
                    <div>
                      <p className="text-muted-foreground text-sm">Email</p>
                      <p className="text-sm">{entityInfo.email}</p>
                    </div>
                  )}

                  <Badge variant="secondary">{slots.length} periods/week</Badge>
                  <Badge variant="outline">
                    {new Set(slots.map((s: any) => s.classId)).size} classes
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoadingData || isLoading ? (
            <Skeleton className="h-96 w-full rounded-lg" />
          ) : selectedId ? (
            <Card>
              <CardContent className="pt-4">
                <SimpleGrid
                  slots={slots}
                  workingDays={workingDays}
                  periods={periods}
                  lunchAfterPeriod={lunchAfterPeriod}
                  isRTL={isRTL}
                  viewMode="teacher"
                  editable={true}
                  onSlotClick={handleSlotClick}
                  conflictSlotIds={conflictSlotIds}
                />
              </CardContent>
            </Card>
          ) : null}
        </>
      )}

      {/* Slot Editor Dialog */}
      <SlotEditorDialog
        open={slotEditorOpen}
        onOpenChange={setSlotEditorOpen}
        slot={selectedSlot}
        initialDay={selectedDay}
        initialPeriod={selectedPeriod}
        periods={periods.map((p) => ({
          id: p.id,
          name: p.name,
          startTime:
            p.startTime instanceof Date
              ? p.startTime.toISOString()
              : String(p.startTime),
          endTime:
            p.endTime instanceof Date
              ? p.endTime.toISOString()
              : String(p.endTime),
          order: p.order,
          isBreak: p.isBreak,
        }))}
        teachers={slotEditorTeachers}
        subjects={slotEditorSubjects}
        classrooms={slotEditorClassrooms}
        classes={slotEditorClasses}
        existingSlots={slots}
        workingDays={workingDays}
        onSave={handleSlotSave}
        dictionary={d}
      />

      {/* Conflicts Drawer */}
      <ConflictsDrawer
        termId={termId}
        open={showConflicts}
        onOpenChange={setShowConflicts}
        onApplySuggestion={handleApplySuggestion}
      />
    </div>
  )
}
