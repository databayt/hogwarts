"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  DoorOpen,
  FileText,
  GraduationCap,
  RefreshCw,
  Settings,
  TriangleAlert,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import {
  detectTimetableConflicts,
  getClassesForSelection,
  getGradeLevelsForSelection,
  getRoomsForSelection,
  getTeachersForSelection,
  getTermsForSelection,
  getTimetableByClass,
  getTimetableByGradeLevel,
  getTimetableByRoom,
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
  onTermChange: (termId: string) => void
}

type ViewMode = "class" | "teacher" | "room" | "grade"

// Group classes by grade name
function groupClassesByGrade(
  classes: Array<{ id: string; label: string }>
): Map<string, Array<{ id: string; label: string }>> {
  const groups = new Map<string, Array<{ id: string; label: string }>>()
  for (const cls of classes) {
    // Extract grade from class name like "Mathematics - Grade 10"
    const match = cls.label.match(/ - (.+)$/)
    const gradeName = match ? match[1] : "Other"
    if (!groups.has(gradeName)) {
      groups.set(gradeName, [])
    }
    groups.get(gradeName)!.push(cls)
  }
  return groups
}

export default function AdminView({
  dictionary,
  lang,
  termId,
  termInfo,
  workingDays,
  periods,
  lunchAfterPeriod,
  isLoading,
  onTermChange,
}: Props) {
  const d = dictionary?.timetable
  const isRTL = lang === "ar"

  const [viewMode, setViewMode] = useState<ViewMode>("class")
  const [selectedId, setSelectedId] = useState<string>("")

  // Data lists for selectors
  const [terms, setTerms] = useState<Array<{ id: string; label: string }>>([])
  const [classes, setClasses] = useState<Array<{ id: string; label: string }>>(
    []
  )
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

  // Timetable data
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

  // Grouped classes for the class selector
  const groupedClasses = useMemo(() => groupClassesByGrade(classes), [classes])

  // Load initial selectors
  useEffect(() => {
    loadSelectors()
  }, [])

  // Reload entity list when term changes
  useEffect(() => {
    loadEntityList()
  }, [termId, viewMode])

  // Load timetable when selection changes
  useEffect(() => {
    if (selectedId && viewMode !== "grade") {
      loadTimetable()
    }
  }, [selectedId, termId])

  const loadSelectors = async () => {
    const [termsResult, roomsResult] = await Promise.all([
      getTermsForSelection(),
      getRoomsForSelection(),
    ])
    setTerms(termsResult.terms)
    setRooms(roomsResult.rooms)
  }

  const loadEntityList = async () => {
    if (viewMode === "class") {
      const result = await getClassesForSelection({ termId })
      setClasses(result.classes)
      if (result.classes.length > 0 && !selectedId) {
        setSelectedId(result.classes[0].id)
      }
    } else if (viewMode === "teacher") {
      const result = await getTeachersForSelection({ termId })
      setTeachers(result.teachers)
      if (result.teachers.length > 0 && !selectedId) {
        setSelectedId(result.teachers[0].id)
      }
    } else if (viewMode === "grade") {
      const result = await getGradeLevelsForSelection({ termId })
      setGradeLevels(result.gradeLevels)
    }
  }

  const loadTimetable = async () => {
    setIsLoadingData(true)
    try {
      let result: any
      if (viewMode === "class") {
        result = await getTimetableByClass({ termId, classId: selectedId })
        setEntityInfo(result.classInfo)
      } else if (viewMode === "teacher") {
        result = await getTimetableByTeacher({ termId, teacherId: selectedId })
        setEntityInfo(result.teacherInfo)
      } else if (viewMode === "room") {
        result = await getTimetableByRoom({ termId, roomId: selectedId })
        setEntityInfo(result.roomInfo)
      }
      setSlots(result?.slots || [])
    } finally {
      setIsLoadingData(false)
    }
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
        // Load data if not already loaded
        if (!gradeData.has(gradeName)) {
          loadGradeData(gradeName)
        }
      }
      return next
    })
  }

  const checkConflicts = async () => {
    const result = await detectTimetableConflicts({ termId })
    setConflicts(result.conflicts)
    setShowConflicts(true)

    // Build set of conflicting class IDs for visual indicators
    const conflictIds = new Set<string>()
    for (const conflict of result.conflicts) {
      if (conflict.classA?.id) conflictIds.add(conflict.classA.id)
      if (conflict.classB?.id) conflictIds.add(conflict.classB.id)
    }
    setConflictSlotIds(conflictIds)
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    setSelectedId("") // Reset selection
    setSlots([])
    setEntityInfo(null)
  }

  const getEntityList = () => {
    switch (viewMode) {
      case "class":
        return classes
      case "teacher":
        return teachers
      case "room":
        return rooms.map((r) => ({
          id: r.id,
          label: `${r.label} (${r.capacity})`,
        }))
      default:
        return []
    }
  }

  const getViewIcon = () => {
    switch (viewMode) {
      case "class":
        return <Calendar className="h-4 w-4" />
      case "teacher":
        return <Users className="h-4 w-4" />
      case "room":
        return <DoorOpen className="h-4 w-4" />
      case "grade":
        return <GraduationCap className="h-4 w-4" />
    }
  }

  // Handle slot click to open editor
  const handleSlotClick = useCallback(
    (day: number, periodId: string, slot?: any) => {
      setSelectedDay(day)
      setSelectedPeriod(periodId)
      setSelectedSlot(slot || null)

      // Build simplified data for the slot editor from existing state
      const teacherInfos: TeacherInfo[] = teachers.map((t) => ({
        id: t.id,
        firstName: t.label.split(" ")[0] || "",
        lastName: t.label.split(" ").slice(1).join(" ") || "",
        email: "",
        subjects: [],
      }))
      setSlotEditorTeachers(teacherInfos)

      const classInfos: ClassInfo[] = classes.map((c) => ({
        id: c.id,
        name: c.label,
        grade: "",
        section: "",
        capacity: 50,
        currentEnrollment: 0,
      }))
      setSlotEditorClasses(classInfos)

      const roomInfos: ClassroomInfo[] = rooms.map((r) => ({
        id: r.id,
        name: r.label,
        capacity: r.capacity,
        type: "regular" as const,
        isAvailable: true,
      }))
      setSlotEditorClassrooms(roomInfos)

      setSlotEditorSubjects([])
      setSlotEditorOpen(true)
    },
    [teachers, classes, rooms]
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
    [termId, selectedId, viewMode]
  )

  // Handle conflict suggestion application
  const handleApplySuggestion = useCallback(
    (suggestion: { dayOfWeek: number; periodId: string }) => {
      // Open slot editor pre-filled with the suggested time
      setSelectedDay(suggestion.dayOfWeek)
      setSelectedPeriod(suggestion.periodId)
      setSelectedSlot(null)
      setSlotEditorOpen(true)
    },
    []
  )

  // Render the entity selector (grouped for class view, flat for others)
  const renderEntitySelector = () => {
    if (viewMode === "grade") return null

    const hasGroups = viewMode === "class" && groupedClasses.size > 1

    return (
      <div className="flex items-center gap-2">
        {getViewIcon()}
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={`Select ${viewMode}`} />
          </SelectTrigger>
          <SelectContent>
            {hasGroups
              ? Array.from(groupedClasses.entries()).map(
                  ([gradeName, gradeClasses]) => (
                    <SelectGroup key={gradeName}>
                      <SelectLabel>{gradeName}</SelectLabel>
                      {gradeClasses.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )
                )
              : getEntityList().map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={loadTimetable}
          disabled={!selectedId || isLoadingData}
        >
          <RefreshCw
            className={cn("h-4 w-4", isLoadingData && "animate-spin")}
          />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {d?.title || "Timetable Administration"}
              </CardTitle>
              <Badge variant="outline">{termInfo.label}</Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Term Selector */}
              <Select value={termId} onValueChange={onTermChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Conflict Check */}
              <Button variant="outline" size="sm" onClick={checkConflicts}>
                <TriangleAlert className="me-2 h-4 w-4" />
                Check Conflicts
              </Button>

              {conflicts.length > 0 && (
                <Badge variant="destructive">
                  {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""}
                </Badge>
              )}

              {/* Settings Link */}
              <Button variant="ghost" size="icon" asChild>
                <a href={`/${lang}/s/_/timetable/settings`}>
                  <Settings className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* View Mode Tabs */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => handleViewModeChange(v as ViewMode)}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="class" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {d?.navigation?.byClass || "By Class"}
                </TabsTrigger>
                <TabsTrigger value="teacher" className="gap-2">
                  <Users className="h-4 w-4" />
                  {d?.navigation?.byTeacher || "By Teacher"}
                </TabsTrigger>
                <TabsTrigger value="room" className="gap-2">
                  <DoorOpen className="h-4 w-4" />
                  {d?.navigation?.byRoom || "By Room"}
                </TabsTrigger>
                <TabsTrigger value="grade" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  {(d?.navigation as any)?.byGrade || "By Grade"}
                </TabsTrigger>
              </TabsList>

              {/* Entity Selector (hidden for grade view) */}
              {renderEntitySelector()}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Entity Info Card (for class/teacher/room views) */}
      {entityInfo && viewMode !== "grade" && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-muted-foreground text-sm">
                  {viewMode === "class" && "Class"}
                  {viewMode === "teacher" && "Teacher"}
                  {viewMode === "room" && "Room"}
                </p>
                <p className="font-semibold">
                  {entityInfo.name || entityInfo.label}
                </p>
              </div>

              {viewMode === "teacher" && entityInfo.email && (
                <div>
                  <p className="text-muted-foreground text-sm">Email</p>
                  <p className="text-sm">{entityInfo.email}</p>
                </div>
              )}

              {viewMode === "room" && entityInfo.capacity && (
                <div>
                  <p className="text-muted-foreground text-sm">Capacity</p>
                  <p className="text-sm">{entityInfo.capacity} students</p>
                </div>
              )}

              {/* Workload stats for teacher view */}
              {viewMode === "teacher" && (
                <>
                  <Badge variant="secondary">{slots.length} periods/week</Badge>
                  <Badge variant="outline">
                    {new Set(slots.map((s) => s.classId)).size} classes
                  </Badge>
                </>
              )}

              {/* Utilization for room view */}
              {viewMode === "room" && (
                <Badge variant="secondary">{slots.length} slots used</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Timetable Grid (for class/teacher/room views) */}
      {viewMode !== "grade" && (
        <>
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
                  viewMode={viewMode}
                  editable={true}
                  onSlotClick={handleSlotClick}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Select a {viewMode} to view timetable</p>
              </CardContent>
            </Card>
          )}
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
