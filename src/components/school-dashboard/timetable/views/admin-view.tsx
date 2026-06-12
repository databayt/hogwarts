"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import { getCookie, setCookie } from "cookies-next"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import {
  getRoomsForSelection,
  getSectionsForTimetable,
  getSubjectsForSlotEditor,
  getTeachersForSelection,
  getTeachersForSlotEditor,
  getTimetableByRoom,
  getTimetableByTeacher,
  upsertTimetableSlot,
} from "../actions"
import { SlotEditorDialog } from "../slot-editor-dialog"
import type {
  ClassroomInfo,
  SubjectInfo,
  TeacherInfo,
  TimetableSlot,
} from "../types"
import type { SectionForTimetable } from "../validation"
import SimpleGrid from "./simple-grid"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
  termId: string
  editable?: boolean
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

type ViewMode = "classroom" | "teacher"

/** Persisted classroom/teacher filter selection (per browser). */
const FILTER_COOKIE = "tt_filter"

interface SavedFilter {
  viewMode?: ViewMode
  roomId?: string
  teacherId?: string
}

function readFilterCookie(): SavedFilter | null {
  try {
    const raw = getCookie(FILTER_COOKIE)
    if (typeof raw !== "string") return null
    return JSON.parse(raw) as SavedFilter
  } catch {
    return null
  }
}

function writeFilterCookie(next: SavedFilter): void {
  setCookie(FILTER_COOKIE, JSON.stringify(next))
}

export default function AdminView({
  dictionary,
  lang,
  termId,
  editable: editableProp = true,
  workingDays,
  periods,
  lunchAfterPeriod,
  isLoading,
}: Props) {
  const d = dictionary?.timetable as Record<string, any> | undefined
  const av = (d as Record<string, any>)?.adminViewUi
  const isRTL = lang === "ar"

  const [viewMode, setViewMode] = useState<ViewMode>("classroom")
  const [selectedId, setSelectedId] = useState<string>("")
  const [selectedClassroom, setSelectedClassroom] = useState<string>("")
  const [classroomOpen, setClassroomOpen] = useState(false)
  const [teacherOpen, setTeacherOpen] = useState(false)

  // Data lists for selectors
  const [teachers, setTeachers] = useState<
    Array<{ id: string; label: string }>
  >([])
  const [rooms, setRooms] = useState<
    Array<{ id: string; label: string; capacity: number }>
  >([])

  // Timetable data
  const [slots, setSlots] = useState<any[]>([])
  const [entityInfo, setEntityInfo] = useState<any>(null)

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
  const [slotEditorSections, setSlotEditorSections] = useState<
    SectionForTimetable[]
  >([])

  const [isLoadingData, setIsLoadingData] = useState(false)

  // Load selector options + slot editor resources on mount
  useEffect(() => {
    loadSelectorOptions()
    loadSlotEditorResources()
  }, [termId])

  // Load timetable when selection changes
  useEffect(() => {
    if (viewMode === "classroom" && selectedClassroom) {
      loadTimetable()
    } else if (viewMode === "teacher" && selectedId) {
      loadTimetable()
    }
  }, [selectedClassroom, selectedId, termId])

  const loadSelectorOptions = async () => {
    const [roomsResult, teachersResult] = await Promise.all([
      getRoomsForSelection(),
      getTeachersForSelection({ termId }),
    ])
    setRooms(roomsResult.rooms)
    setTeachers(teachersResult.teachers)

    // Restore the last filter from the cookie, but only if the saved id still
    // exists in this school/term's options; otherwise fall back to the first
    // classroom. Server queries are schoolId-scoped, so a stale id is harmless —
    // this just avoids landing on an empty grid.
    const saved = readFilterCookie()
    const savedTeacher =
      saved?.viewMode === "teacher" &&
      saved.teacherId &&
      teachersResult.teachers.some((t) => t.id === saved.teacherId)
        ? saved.teacherId
        : null
    const savedRoom =
      saved?.viewMode === "classroom" &&
      saved.roomId &&
      roomsResult.rooms.some((r) => r.id === saved.roomId)
        ? saved.roomId
        : null

    if (savedTeacher) {
      setViewMode("teacher")
      setSelectedId(savedTeacher)
      setIsLoadingData(true)
    } else if (savedRoom) {
      setViewMode("classroom")
      setSelectedClassroom(savedRoom)
      setIsLoadingData(true)
    } else if (roomsResult.rooms.length > 0) {
      // Default to first classroom
      setSelectedClassroom(roomsResult.rooms[0].id)
      setViewMode("classroom")
      setIsLoadingData(true)
    }
  }

  const loadSlotEditorResources = async () => {
    const [subjectsResult, teachersResult, sectionsResult, roomsResult] =
      await Promise.all([
        getSubjectsForSlotEditor({ termId }),
        getTeachersForSlotEditor({ termId }),
        getSectionsForTimetable(),
        getRoomsForSelection(),
      ])
    setSlotEditorSubjects(subjectsResult.subjects)
    setSlotEditorTeachers(teachersResult.teachers)
    setSlotEditorSections(sectionsResult.sections)
    setSlotEditorClassrooms(
      roomsResult.rooms.map((r) => ({
        id: r.id,
        name: r.label,
        capacity: r.capacity,
        type: "regular" as const,
        isAvailable: true,
      }))
    )
  }

  const loadTimetable = useCallback(async () => {
    setIsLoadingData(true)
    try {
      if (viewMode === "classroom" && selectedClassroom) {
        const result = await getTimetableByRoom({
          termId,
          roomId: selectedClassroom,
        })
        setEntityInfo(result.roomInfo)
        setSlots(result?.slots || [])
      } else if (viewMode === "teacher" && selectedId) {
        const result = await getTimetableByTeacher({
          termId,
          teacherId: selectedId,
        })
        setEntityInfo(result.teacherInfo)
        setSlots(result?.slots || [])
      }
    } finally {
      setIsLoadingData(false)
    }
  }, [viewMode, selectedClassroom, selectedId, termId])

  const handleClassroomSelect = (roomId: string) => {
    setSelectedClassroom(roomId)
    setSelectedId("")
    setViewMode("classroom")
    setSlots([])
    setEntityInfo(null)
    setIsLoadingData(true)
    writeFilterCookie({ viewMode: "classroom", roomId })
  }

  const handleTeacherSelect = (teacherId: string) => {
    setSelectedId(teacherId)
    setSelectedClassroom("")
    setViewMode("teacher")
    setSlots([])
    setEntityInfo(null)
    setIsLoadingData(true)
    writeFilterCookie({ viewMode: "teacher", teacherId })
  }

  const handleSlotClick = useCallback(
    (day: number, periodId: string, slot?: any) => {
      setSelectedDay(day)
      setSelectedPeriod(periodId)
      setSelectedSlot(slot || null)
      setSlotEditorOpen(true)
    },
    []
  )

  const handleSlotSave = useCallback(
    async (data: Partial<TimetableSlot>) => {
      await upsertTimetableSlot({
        // Editing an existing slot (incl. legacy classId rows) updates by id —
        // the server backfills sectionId/subjectId, migrating the row in place.
        ...(data.id ? { id: data.id } : {}),
        termId,
        dayOfWeek: data.dayOfWeek!,
        periodId: data.periodId!,
        sectionId: data.sectionId!,
        subjectId: data.subjectId!,
        teacherId: data.teacherId!,
        classroomId: data.classroomId!,
        weekOffset: data.weekOffset ?? 0,
      })

      await loadTimetable()
    },
    [termId, loadTimetable]
  )

  return (
    <div className="space-y-12">
      {/* Toolbar: Classroom + Teacher selectors */}
      <div className="flex items-center gap-4">
        <Popover open={classroomOpen} onOpenChange={setClassroomOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between">
              {selectedClassroom
                ? rooms.find((r) => r.id === selectedClassroom)?.label
                : (av?.selectClassroom ?? "Select classroom")}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-0">
            <Command>
              <CommandInput placeholder={av?.search ?? "Search..."} />
              <CommandList>
                <CommandEmpty>{av?.noResults ?? "No results."}</CommandEmpty>
                <CommandGroup>
                  {rooms.map((r) => (
                    <CommandItem
                      key={r.id}
                      value={r.label}
                      onSelect={() => {
                        handleClassroomSelect(r.id)
                        setClassroomOpen(false)
                      }}
                    >
                      {r.label}
                      <Check
                        className={cn(
                          "ms-auto",
                          selectedClassroom === r.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover open={teacherOpen} onOpenChange={setTeacherOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between">
              {selectedId
                ? teachers.find((t) => t.id === selectedId)?.label
                : (av?.selectTeacher ?? "Select teacher")}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-0">
            <Command>
              <CommandInput placeholder={av?.search ?? "Search..."} />
              <CommandList>
                <CommandEmpty>{av?.noResults ?? "No results."}</CommandEmpty>
                <CommandGroup>
                  {teachers.map((t) => (
                    <CommandItem
                      key={t.id}
                      value={t.label}
                      onSelect={() => {
                        handleTeacherSelect(t.id)
                        setTeacherOpen(false)
                      }}
                    >
                      {t.label}
                      <Check
                        className={cn(
                          "ms-auto",
                          selectedId === t.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Classroom View */}
      {viewMode === "classroom" && (
        <>
          {isLoadingData || isLoading ? (
            <Skeleton className="h-96 w-full rounded-lg" />
          ) : selectedClassroom ? (
            <SimpleGrid
              slots={slots}
              workingDays={workingDays}
              periods={periods}
              lunchAfterPeriod={lunchAfterPeriod}
              isRTL={isRTL}
              viewMode="room"
              editable={editableProp}
              onSlotClick={editableProp ? handleSlotClick : undefined}
            />
          ) : null}
        </>
      )}

      {/* Teacher View */}
      {viewMode === "teacher" && (
        <>
          {entityInfo && (
            <div className="text-muted-foreground flex items-center gap-3 text-sm">
              <span className="text-foreground font-medium">
                {entityInfo.name || entityInfo.label}
              </span>
              {entityInfo.email && <span>{entityInfo.email}</span>}
              <Badge variant="secondary">
                {av?.periodsPerWeek?.replace("{count}", String(slots.length)) ??
                  `${slots.length} periods/week`}
              </Badge>
              <Badge variant="outline">
                {av?.classCount?.replace(
                  "{count}",
                  String(
                    new Set(slots.map((s: any) => s.sectionId ?? s.classId))
                      .size
                  )
                ) ??
                  `${new Set(slots.map((s: any) => s.sectionId ?? s.classId)).size} classes`}
              </Badge>
            </div>
          )}

          {isLoadingData || isLoading ? (
            <Skeleton className="h-96 w-full rounded-lg" />
          ) : selectedId ? (
            <SimpleGrid
              slots={slots}
              workingDays={workingDays}
              periods={periods}
              lunchAfterPeriod={lunchAfterPeriod}
              isRTL={isRTL}
              viewMode="teacher"
              editable={editableProp}
              onSlotClick={editableProp ? handleSlotClick : undefined}
            />
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
        sections={slotEditorSections}
        existingSlots={slots}
        workingDays={workingDays}
        onSave={handleSlotSave}
        dictionary={d}
      />
    </div>
  )
}
