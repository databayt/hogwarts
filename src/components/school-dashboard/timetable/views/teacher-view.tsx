"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

import { getTimetableByTeacher, getTodaySchedule } from "../actions"
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
  teacherId?: string
  defaultTab?: "today" | "full"
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

export default function TeacherView({
  dictionary,
  lang,
  termId,
  termInfo,
  workingDays,
  periods,
  lunchAfterPeriod,
  isLoading,
  teacherId,
  defaultTab = "today",
}: Props) {
  const d = dictionary?.timetable
  const isRTL = lang === "ar"

  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Weekly data
  const [slots, setSlots] = useState<any[]>([])
  const [teacherInfo, setTeacherInfo] = useState<any>(null)
  const [workload, setWorkload] = useState<{
    daysPerWeek: number
    periodsPerWeek: number
    classesTeaching: number
  } | null>(null)

  // Today's schedule
  const [todaySchedule, setTodaySchedule] = useState<any[]>([])
  const [currentDay, setCurrentDay] = useState<number>(new Date().getDay())

  // Filters
  const [classroomFilter, setClassroomFilter] = useState<string>("all")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")

  // Load data
  useEffect(() => {
    loadData()
  }, [termId, teacherId])

  const loadData = async () => {
    if (!teacherId) {
      setError("Teacher profile not linked to your account")
      return
    }

    setIsLoadingData(true)
    setError(null)

    try {
      const [weeklyResult, todayResult] = await Promise.all([
        getTimetableByTeacher({ termId, teacherId }),
        getTodaySchedule(),
      ])

      setSlots(weeklyResult.slots)
      setTeacherInfo(weeklyResult.teacherInfo)
      setWorkload(weeklyResult.workload)
      setTodaySchedule(todayResult.schedule)
      setCurrentDay(todayResult.dayOfWeek)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule")
    } finally {
      setIsLoadingData(false)
    }
  }

  // Derive filter options from slots
  const filterOptions = useMemo(() => {
    const classrooms = new Set<string>()
    const subjects = new Set<string>()

    for (const slot of slots) {
      if (slot.className) classrooms.add(slot.className)
      if (slot.subject) subjects.add(slot.subject)
    }

    return {
      classrooms: Array.from(classrooms).sort(),
      subjects: Array.from(subjects).sort(),
    }
  }, [slots])

  const showFilters =
    filterOptions.classrooms.length > 1 || filterOptions.subjects.length > 1

  // Apply filters
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (classroomFilter !== "all" && slot.className !== classroomFilter)
        return false
      if (subjectFilter !== "all" && slot.subject !== subjectFilter)
        return false
      return true
    })
  }, [slots, classroomFilter, subjectFilter])

  const filteredTodaySchedule = useMemo(() => {
    if (classroomFilter === "all" && subjectFilter === "all")
      return todaySchedule

    return todaySchedule.filter((item) => {
      if (item.isBreak) return true
      if (classroomFilter !== "all" && item.className !== classroomFilter)
        return false
      if (subjectFilter !== "all" && item.subject !== subjectFilter)
        return false
      return true
    })
  }, [todaySchedule, classroomFilter, subjectFilter])

  const formatTime = (date: Date | string) => {
    const d = new Date(date)
    return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`
  }

  // Get current/next class
  const getCurrentClass = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    for (const item of todaySchedule) {
      if (item.isBreak) continue

      const startTime = new Date(item.startTime)
      const endTime = new Date(item.endTime)
      const startHour = startTime.getUTCHours()
      const startMinute = startTime.getUTCMinutes()
      const endHour = endTime.getUTCHours()
      const endMinute = endTime.getUTCMinutes()

      const currentTotalMinutes = currentHour * 60 + currentMinute
      const startTotalMinutes = startHour * 60 + startMinute
      const endTotalMinutes = endHour * 60 + endMinute

      if (
        currentTotalMinutes >= startTotalMinutes &&
        currentTotalMinutes < endTotalMinutes
      ) {
        return { type: "current", item }
      }
      if (currentTotalMinutes < startTotalMinutes) {
        return { type: "next", item }
      }
    }
    return null
  }

  const currentClassInfo = getCurrentClass()

  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {d?.title || "My Teaching Schedule"}
              </CardTitle>
              <CardDescription>
                {teacherInfo?.name || "Loading..."}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">{termInfo.label}</Badge>
            </div>
          </div>
        </CardHeader>

        {workload && (
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">
                  <strong>{workload.daysPerWeek}</strong> days/week
                </span>
              </div>
              <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">
                  <strong>{workload.periodsPerWeek}</strong> periods/week
                </span>
              </div>
              <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
                <BookOpen className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">
                  <strong>{workload.classesTeaching}</strong> classes
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Current/Next Class Card */}
      {currentClassInfo && !isLoadingData && defaultTab === "today" && (
        <Card
          className={cn(
            "border-2",
            currentClassInfo.type === "current"
              ? "border-green-500 bg-green-50 dark:bg-green-950/20"
              : "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
          )}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "rounded-full p-3",
                  currentClassInfo.type === "current"
                    ? "bg-green-500"
                    : "bg-blue-500"
                )}
              >
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">
                  {currentClassInfo.type === "current"
                    ? "Currently Teaching"
                    : "Next Class"}
                </p>
                <p className="text-lg font-semibold">
                  {currentClassInfo.item.subject ||
                    currentClassInfo.item.className}
                </p>
                <p className="text-muted-foreground text-sm">
                  {currentClassInfo.item.className} •{" "}
                  {currentClassInfo.item.room}
                </p>
              </div>
              <div className="text-end">
                <p className="text-2xl font-bold">
                  {formatTime(currentClassInfo.item.startTime)}
                </p>
                <p className="text-muted-foreground text-sm">
                  - {formatTime(currentClassInfo.item.endTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {showFilters && !isLoadingData && (
        <div className="flex flex-wrap gap-3">
          {filterOptions.classrooms.length > 1 && (
            <Select value={classroomFilter} onValueChange={setClassroomFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Classrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classrooms</SelectItem>
                {filterOptions.classrooms.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filterOptions.subjects.length > 1 && (
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {filterOptions.subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Content based on defaultTab */}
      {defaultTab === "today" ? (
        // Today's Schedule
        isLoadingData ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : filteredTodaySchedule.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No classes scheduled for today ({DAY_NAMES[currentDay]})</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredTodaySchedule.map((item, idx) => (
              <Card
                key={idx}
                className={cn(
                  "transition-colors",
                  item.isBreak && "bg-muted/50 border-dashed",
                  currentClassInfo?.item === item &&
                    currentClassInfo?.type === "current" &&
                    "border-green-500 bg-green-50 dark:bg-green-950/20"
                )}
              >
                <CardContent className="py-3">
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-center">
                      <p className="font-mono font-semibold">
                        {formatTime(item.startTime)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatTime(item.endTime)}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.isBreak
                          ? item.periodName
                          : item.subject || item.className || "Free Period"}
                      </p>
                      {!item.isBreak && item.className && (
                        <p className="text-muted-foreground text-sm">
                          {item.className} {item.room && `• ${item.room}`}
                        </p>
                      )}
                    </div>
                    {item.isBreak && <Badge variant="secondary">Break</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : // Full Week View
      isLoadingData || isLoading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <SimpleGrid
              slots={filteredSlots}
              workingDays={workingDays}
              periods={periods}
              lunchAfterPeriod={lunchAfterPeriod}
              isRTL={isRTL}
              viewMode="teacher"
              editable={false}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
