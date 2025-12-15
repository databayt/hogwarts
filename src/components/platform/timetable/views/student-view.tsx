"use client"

import { useEffect, useState } from "react"
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  GraduationCap,
  TriangleAlert,
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
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { getTimetableByClass, getTodaySchedule } from "../actions"
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
  classId?: string
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

export default function StudentView({
  dictionary,
  lang,
  termId,
  termInfo,
  workingDays,
  periods,
  lunchAfterPeriod,
  isLoading,
  classId,
}: Props) {
  const d = dictionary?.timetable
  const isRTL = lang === "ar"

  const [viewTab, setViewTab] = useState<"today" | "week">("today")
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Weekly data
  const [slots, setSlots] = useState<any[]>([])
  const [classInfo, setClassInfo] = useState<any>(null)

  // Today's schedule
  const [todaySchedule, setTodaySchedule] = useState<any[]>([])
  const [currentDay, setCurrentDay] = useState<number>(new Date().getDay())

  // Load data
  useEffect(() => {
    loadData()
  }, [termId, classId])

  const loadData = async () => {
    if (!classId) {
      setError("Class enrollment not found for your account")
      return
    }

    setIsLoadingData(true)
    setError(null)

    try {
      const [weeklyResult, todayResult] = await Promise.all([
        getTimetableByClass({ termId, classId }),
        getTodaySchedule(),
      ])

      setSlots(weeklyResult.slots)
      setClassInfo(weeklyResult.classInfo)
      setTodaySchedule(todayResult.schedule)
      setCurrentDay(todayResult.dayOfWeek)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule")
    } finally {
      setIsLoadingData(false)
    }
  }

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
      if (!item.subject && !item.className) continue

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

  // Count subjects
  const uniqueSubjects = new Set(slots.map((s) => s.subject).filter(Boolean))

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
                <GraduationCap className="h-5 w-5" />
                {d?.title || "My Class Schedule"}
              </CardTitle>
              <CardDescription>
                {classInfo?.name || "Loading..."}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">{termInfo.label}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
              <BookOpen className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">
                <strong>{uniqueSubjects.size}</strong> subjects
              </span>
            </div>
            <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">
                <strong>{slots.length}</strong> periods/week
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current/Next Class Card */}
      {currentClassInfo && !isLoadingData && (
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
                <ChevronRight className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">
                  {currentClassInfo.type === "current"
                    ? "Current Class"
                    : "Next Up"}
                </p>
                <p className="text-lg font-semibold">
                  {currentClassInfo.item.subject ||
                    currentClassInfo.item.className}
                </p>
                <p className="text-muted-foreground text-sm">
                  {currentClassInfo.item.teacher &&
                    `${currentClassInfo.item.teacher} • `}
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

      {/* View Tabs */}
      <Tabs
        value={viewTab}
        onValueChange={(v) => setViewTab(v as "today" | "week")}
      >
        <TabsList>
          <TabsTrigger value="today" className="gap-2">
            <Clock className="h-4 w-4" />
            Today ({DAY_NAMES[currentDay]})
          </TabsTrigger>
          <TabsTrigger value="week" className="gap-2">
            <Calendar className="h-4 w-4" />
            Week View
          </TabsTrigger>
        </TabsList>

        {/* Today's Schedule */}
        <TabsContent value="today" className="mt-4">
          {isLoadingData ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : todaySchedule.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No classes scheduled for today</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((item, idx) => (
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
                            : item.subject || "Free Period"}
                        </p>
                        {!item.isBreak && item.teacher && (
                          <p className="text-muted-foreground text-sm">
                            {item.teacher} {item.room && `• ${item.room}`}
                          </p>
                        )}
                      </div>
                      {item.isBreak && <Badge variant="secondary">Break</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week" className="mt-4">
          {isLoadingData || isLoading ? (
            <Skeleton className="h-96 w-full rounded-lg" />
          ) : (
            <Card>
              <CardContent className="pt-4">
                <SimpleGrid
                  slots={slots}
                  workingDays={workingDays}
                  periods={periods}
                  lunchAfterPeriod={lunchAfterPeriod}
                  isRTL={isRTL}
                  viewMode="class"
                  editable={false}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
