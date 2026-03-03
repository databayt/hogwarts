"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
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
  getClassesForSelection,
  getRoomsForSelection,
  getSubjectsForSlotEditor,
  getTeachersForSelection,
  getTeachersForSlotEditor,
  getTimetableByRoom,
  getTimetableByTeacher,
  upsertTimetableSlot,
} from "../actions"
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

type ViewMode = "classroom" | "teacher"

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
  const [slotEditorClasses, setSlotEditorClasses] = useState<ClassInfo[]>([])

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

    // Default to first classroom
    if (roomsResult.rooms.length > 0) {
      setSelectedClassroom(roomsResult.rooms[0].id)
      setViewMode("classroom")
      setIsLoadingData(true)
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
  }

  const handleTeacherSelect = (teacherId: string) => {
    setSelectedId(teacherId)
    setSelectedClassroom("")
    setViewMode("teacher")
    setSlots([])
    setEntityInfo(null)
    setIsLoadingData(true)
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
        termId,
        dayOfWeek: data.dayOfWeek!,
        periodId: data.periodId!,
        classId: data.classId!,
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
                : "Select classroom"}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-0">
            <Command>
              <CommandInput placeholder="Search..." />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
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
                : d?.navigation?.byTeacher || "Select teacher"}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-0">
            <Command>
              <CommandInput placeholder="Search..." />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
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
              editable={true}
              onSlotClick={handleSlotClick}
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
              <Badge variant="secondary">{slots.length} periods/week</Badge>
              <Badge variant="outline">
                {new Set(slots.map((s: any) => s.classId)).size} classes
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
              editable={true}
              onSlotClick={handleSlotClick}
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
        classes={slotEditorClasses}
        existingSlots={slots}
        workingDays={workingDays}
        onSave={handleSlotSave}
        dictionary={d}
      />
    </div>
  )
}
