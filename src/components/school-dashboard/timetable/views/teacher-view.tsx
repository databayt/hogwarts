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
import { TimetableGridSkeleton } from "./grid-skeleton"
import { JoinLinkButton } from "./join-link-button"
import {
  ClosureNotice,
  isLiveJoinable,
  isRowLiveJoinable,
  LiveJoinButton,
  OnlineBadge,
  type LiveClassJoinInfo,
  type SchoolClosureInfo,
} from "./live-join-button"
import SimpleGrid from "./simple-grid"
import { SlotDetailDialog } from "./slot-detail-dialog"
import { StartLiveClassButton } from "./start-live-class-button"
import { inJoinWindow, useNowMs } from "./use-now-ms"
import { useSlotOpen } from "./use-slot-open"

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
    untimed?: boolean
  }>
  lunchAfterPeriod: number | null
  isLoading?: boolean
  teacherId?: string
  defaultTab?: "today" | "full"
}

const DAY_NAMES_EN = [
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
  periods: schoolPeriods,
  lunchAfterPeriod,
  isLoading,
  teacherId,
  defaultTab = "today",
}: Props) {
  const d = dictionary?.timetable as Record<string, any> | undefined
  const tv = (d as Record<string, any>)?.teacherViewUi
  // "Online" marker beside the physical room — set once here, used on both the
  // Current/Next card and the day list.
  const ONLINE_LABEL = (d as Record<string, any>)?.online ?? "Online"
  const CLOSED_LABEL =
    (d as Record<string, any>)?.closedToday ?? "School is closed today"
  const dayNames: string[] = (d?.dayNames as string[]) ?? DAY_NAMES_EN
  const isRTL = lang === "ar"

  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Weekly data
  const [slots, setSlots] = useState<any[]>([])
  // The grid's own bell, from the fetch: grades ring different bells, so the
  // school-wide list from the router is only the fallback until it lands.
  const [gridPeriods, setGridPeriods] = useState<typeof schoolPeriods | null>(
    null
  )
  const periods = gridPeriods ?? schoolPeriods
  const [teacherInfo, setTeacherInfo] = useState<any>(null)
  const [workload, setWorkload] = useState<{
    daysPerWeek: number
    periodsPerWeek: number
    classesTeaching: number
  } | null>(null)
  const [liveIndicators, setLiveIndicators] = useState<
    Record<string, "live" | "scheduled">
  >({})
  const [liveJoin, setLiveJoin] = useState<Record<string, LiveClassJoinInfo>>(
    {}
  )
  // Which cell the reader opened. The grid is read-only here, so a click means
  // "tell me about this", not "let me change it".
  const [inspectedSlotId, setInspectedSlotId] = useState<string | null>(null)
  // Whether the school teaches live at all (its teaching mode). An in-person
  // school offers no Start — Join to an existing room is never gated.
  const [liveEnabled, setLiveEnabled] = useState(false)
  // Today's slots that are online by policy, row or no row yet.
  const [onlineToday, setOnlineToday] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  // Today's join windows as instants, from the server (school zone).
  const [joinWindows, setJoinWindows] = useState<
    Record<string, { fromMs: number; untilMs: number }>
  >({})
  const nowMs = useNowMs()
  const startErrorLabel =
    dictionary?.liveClasses?.startError ??
    (isRTL ? "تعذّر بدء البث المباشر" : "Couldn't start the live class")
  // The Today list and the Current/Next card follow the grid's contract: the
  // SERVER's window (instants, school zone) decides when Join shows, so a
  // teacher on another clock (abroad) sees it at the class's real time; the
  // device-clock check is only the fallback for a row without a window. A
  // class that has a room, or is online by policy, goes in through the slot's
  // join link; Start stays for an in-person section of a live-enabled school.
  const joinLabel = dictionary?.liveClasses?.join ?? (isRTL ? "انضمام" : "Join")
  const todayJoin = (item: any, deviceOpen: boolean) => {
    if (!item || item.isBreak) return null
    const id: string | undefined = item.timetableId ?? undefined
    const w = id ? joinWindows[id] : undefined
    if (!(w ? inJoinWindow(nowMs, w) : deviceOpen)) return null
    if (id && (item.liveClass?.sessionId || onlineToday.has(id))) {
      return <JoinLinkButton timetableId={id} lang={lang} label={joinLabel} />
    }
    if (item.liveClass) {
      return (
        <LiveJoinButton liveClass={item.liveClass} lang={lang} label={joinLabel} />
      )
    }
    if (!liveEnabled || !id) return null
    return (
      <StartLiveClassButton
        timetableId={id}
        lang={lang}
        label={
          dictionary?.liveClasses?.start ??
          (isRTL ? "بدء البث المباشر" : "Start live class")
        }
        startingLabel={
          dictionary?.liveClasses?.starting ??
          (isRTL ? "جارٍ البدء…" : "Starting…")
        }
        errorLabel={startErrorLabel}
      />
    )
  }
  // A click on today's live cell IS the join (or, inside the window with no
  // room yet, the start); any other cell opens the dialog.
  const { open: openSlot } = useSlotOpen({
    lang,
    liveJoin,
    onlineToday,
    joinWindows,
    onInspect: setInspectedSlotId,
    canStart: liveEnabled,
    startErrorLabel,
  })

  // Today's schedule
  const [todaySchedule, setTodaySchedule] = useState<any[]>([])
  const [closure, setClosure] = useState<SchoolClosureInfo>(null)
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
      setError(
        tv?.profileNotLinked ?? "Teacher profile not linked to your account"
      )
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
      setGridPeriods(
        weeklyResult.periods.length > 0 ? weeklyResult.periods : null
      )
      setTeacherInfo(weeklyResult.teacherInfo)
      setWorkload(weeklyResult.workload)
      setLiveIndicators(weeklyResult.liveIndicators ?? {})
      setLiveJoin(weeklyResult.liveJoin ?? {})
      setLiveEnabled(weeklyResult.liveEnabled ?? false)
      setOnlineToday(new Set(weeklyResult.onlineToday ?? []))
      setJoinWindows(weeklyResult.joinWindows ?? {})
      setTodaySchedule(todayResult.schedule)
      setClosure(todayResult.closure ?? null)
      setCurrentDay(todayResult.dayOfWeek)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : (tv?.noClasses ?? "Failed to load schedule")
      )
    } finally {
      setIsLoadingData(false)
    }
  }

  // Derive filter options from slots
  const filterOptions = useMemo(() => {
    // class name → grade number, so the filter runs KG → G12 rather than
    // alphabetically («الأول ابتدائي», «الأول ثانوي», «الأول متوسط»…)
    const classrooms = new Map<string, number>()
    const subjects = new Set<string>()

    for (const slot of slots) {
      if (slot.className && !classrooms.has(slot.className))
        classrooms.set(slot.className, slot.gradeNumber ?? Infinity)
      if (slot.subject) subjects.add(slot.subject)
    }

    return {
      classrooms: Array.from(classrooms.keys()).sort(
        (a, b) =>
          classrooms.get(a)! - classrooms.get(b)! || a.localeCompare(b, "ar")
      ),
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
      // An untimed period has no clock to be «now» against.
      if (item.untimed) continue
      if (!item.subject && !item.teacher) continue

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
                {tv?.title ?? d?.title ?? "My Teaching Schedule"}
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
                  <strong>{workload.daysPerWeek}</strong>{" "}
                  {tv?.daysPerWeek ?? "days/week"}
                </span>
              </div>
              <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">
                  <strong>{workload.periodsPerWeek}</strong>{" "}
                  {tv?.periodsPerWeek ?? "periods/week"}
                </span>
              </div>
              <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
                <BookOpen className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">
                  <strong>{workload.classesTeaching}</strong>{" "}
                  {tv?.classes ?? "classes"}
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Declared holiday / cancelled day — informs, never blanks. */}
      {!isLoadingData && (
        <ClosureNotice closure={closure} label={CLOSED_LABEL} />
      )}

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
                    ? (tv?.currentlyTeaching ?? "Currently Teaching")
                    : (tv?.nextClass ?? "Next Class")}
                </p>
                <p className="text-lg font-semibold">
                  {currentClassInfo.item.subject ||
                    currentClassInfo.item.className}
                </p>
                <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                  <span>
                    {currentClassInfo.item.sectionName
                      ? `${currentClassInfo.item.sectionName} · ${currentClassInfo.item.room || ""}`
                      : `${currentClassInfo.item.className || ""} · ${currentClassInfo.item.room || ""}`}
                  </span>
                  <OnlineBadge
                    liveClass={currentClassInfo.item.liveClass}
                    label={ONLINE_LABEL}
                  />
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
              {todayJoin(
                currentClassInfo.item,
                isLiveJoinable(
                  currentClassInfo.type as "current" | "next",
                  currentClassInfo.item.startTime
                )
              )}
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
                <SelectValue
                  placeholder={tv?.allClassrooms ?? "All Classrooms"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {tv?.allClassrooms ?? "All Classrooms"}
                </SelectItem>
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
                <SelectValue placeholder={tv?.allSubjects ?? "All Subjects"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {tv?.allSubjects ?? "All Subjects"}
                </SelectItem>
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
              <p>
                {tv?.noClasses?.replace("{day}", dayNames[currentDay]) ??
                  `No classes scheduled for today (${dayNames[currentDay]})`}
              </p>
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
                      {item.untimed ? (
                        <p className="font-semibold">{item.periodName}</p>
                      ) : (
                        <>
                          <p className="font-mono font-semibold">
                            {formatTime(item.startTime)}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatTime(item.endTime)}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.isBreak
                          ? item.periodName
                          : item.subject ||
                            item.className ||
                            (tv?.freePeriod ?? "Free Period")}
                      </p>
                      {!item.isBreak &&
                        (item.className || item.sectionName) && (
                          <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                            <span>
                              {item.sectionName || item.className}{" "}
                              {item.room && `· ${item.room}`}
                            </span>
                            <OnlineBadge
                              liveClass={item.liveClass}
                              label={ONLINE_LABEL}
                            />
                          </p>
                        )}
                    </div>
                    {item.isBreak && (
                      <Badge variant="secondary">{tv?.break ?? "Break"}</Badge>
                    )}
                    {/* Join — or Start, when no session exists yet — on every
                        row of the day, mirroring the Current/Next card above.
                        With the crons bridged rather than native, a teacher
                        pressing Start is what brings a class online for a school
                        that has not turned on the online-school policy at all. */}
                    {todayJoin(
                      item,
                      isRowLiveJoinable(item.startTime, item.endTime)
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : // Full Week View
      isLoadingData || isLoading ? (
        <TimetableGridSkeleton workingDays={workingDays} periods={periods} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <SimpleGrid
              slots={filteredSlots}
              workingDays={workingDays}
              periods={periods}
              isRTL={isRTL}
              viewMode="teacher"
              editable={false}
              liveIndicators={liveIndicators}
              onSlotInspect={openSlot}
              // The cell itself joins or starts (see useSlotOpen); this keeps a
              // visible Start label on the teacher's period that has no room yet.
              renderSlotAction={(slot) => {
                // A room exists (or the section is online and the link will
                // open one): say Join, through the slot's join link — the
                // room makes the teacher its host. Gated on the SERVER's
                // window (instants; only today's slots have one), right on
                // any device clock — so it comes before the device-clock
                // checks below, which only the Start fallback still uses.
                if (liveJoin[slot.id] || onlineToday.has(slot.id)) {
                  if (!inJoinWindow(nowMs, joinWindows[slot.id])) return null
                  return (
                    <JoinLinkButton
                      timetableId={slot.id}
                      lang={lang}
                      label={
                        dictionary?.liveClasses?.join ??
                        (isRTL ? "انضمام" : "Join")
                      }
                    />
                  )
                }
                // An in-person section of a school that teaches live: the
                // teacher can still open an online arm for this period.
                if (!liveEnabled || !inJoinWindow(nowMs, joinWindows[slot.id]))
                  return null
                return (
                  <StartLiveClassButton
                    timetableId={slot.id}
                    lang={lang}
                    label={
                      dictionary?.liveClasses?.start ??
                      (isRTL ? "بدء البث المباشر" : "Start live class")
                    }
                    startingLabel={
                      dictionary?.liveClasses?.starting ??
                      (isRTL ? "جارٍ البدء…" : "Starting…")
                    }
                    errorLabel={
                      dictionary?.liveClasses?.startError ??
                      (isRTL
                        ? "تعذّر بدء البث المباشر"
                        : "Couldn't start the live class")
                    }
                  />
                )
              }}
              dictionary={{
                period: d?.period,
                break: d?.break,
                days: d?.dayNames,
                conflict: d?.conflict,
                liveNow: d?.liveNow,
                scheduledToday: dictionary?.liveClasses?.status?.scheduled,
              }}
            />
          </CardContent>
        </Card>
      )}
      <SlotDetailDialog
        slotId={inspectedSlotId}
        open={!!inspectedSlotId}
        onOpenChange={(next) => !next && setInspectedSlotId(null)}
        dictionary={dictionary}
        lang={lang}
        liveClass={inspectedSlotId ? (liveJoin[inspectedSlotId] ?? null) : null}
      />
    </div>
  )
}
