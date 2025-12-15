"use client"

import { useEffect, useState, useTransition } from "react"
import {
  BookOpen,
  Clock,
  MapPin,
  RefreshCw,
  TriangleAlert,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { type Dictionary } from "@/components/internationalization/dictionaries"

import {
  getClassesForSelection,
  getTermsForSelection,
  getTimetableByClass,
} from "../actions"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  dictionary: Dictionary["school"]
}

type SlotData = {
  id: string
  dayOfWeek: number
  periodId: string
  periodName: string
  teacher: string
  teacherId: string
  room: string
  roomId: string
  subject: string
}

type ClassTimetableData = {
  classInfo: { id: string; name: string; subject?: string } | null
  workingDays: number[]
  periods: { id: string; name: string; startTime: Date; endTime: Date }[]
  slots: SlotData[]
  lunchAfterPeriod: number | null
}

export default function TimetableByClassContent({ dictionary }: Props) {
  const d = dictionary?.timetable

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [terms, setTerms] = useState<{ id: string; label: string }[]>([])
  const [classes, setClasses] = useState<{ id: string; label: string }[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")

  const [timetableData, setTimetableData] = useState<ClassTimetableData | null>(
    null
  )

  // Load terms on mount
  useEffect(() => {
    loadTerms()
  }, [])

  // Load classes when term changes
  useEffect(() => {
    if (selectedTerm) {
      loadClasses(selectedTerm)
    }
  }, [selectedTerm])

  // Load timetable when class changes
  useEffect(() => {
    if (selectedTerm && selectedClass) {
      loadTimetable()
    }
  }, [selectedTerm, selectedClass])

  const loadTerms = async () => {
    try {
      const { terms: fetchedTerms } = await getTermsForSelection()
      setTerms(fetchedTerms)
      if (fetchedTerms.length > 0) {
        setSelectedTerm(fetchedTerms[0].id)
      }
    } catch (err) {
      setError("Failed to load terms")
    }
  }

  const loadClasses = async (termId: string) => {
    try {
      const { classes: fetchedClasses } = await getClassesForSelection({
        termId,
      })
      setClasses(fetchedClasses)
      setSelectedClass("")
      setTimetableData(null)
    } catch (err) {
      setError("Failed to load classes")
    }
  }

  const loadTimetable = async () => {
    startTransition(async () => {
      setError(null)
      try {
        const data = await getTimetableByClass({
          termId: selectedTerm,
          classId: selectedClass,
          weekOffset: 0,
        })
        setTimetableData(data as ClassTimetableData)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load timetable"
        )
      }
    })
  }

  const getSlot = (
    dayOfWeek: number,
    periodId: string
  ): SlotData | undefined => {
    return timetableData?.slots.find(
      (s) => s.dayOfWeek === dayOfWeek && s.periodId === periodId
    )
  }

  const formatTime = (date: Date) => {
    const d = new Date(date)
    return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`
  }

  // ListFilter to teaching periods only
  const teachingPeriods =
    timetableData?.periods.filter(
      (p) =>
        !p.name.toLowerCase().includes("break") &&
        !p.name.toLowerCase().includes("lunch")
    ) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {d?.byClass?.title || "Timetable by Class"}
          </CardTitle>
          <CardDescription>
            {d?.byClass?.description ||
              "View timetables filtered by class section"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
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
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Class</label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={!selectedTerm}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClass && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTimetable}
                  disabled={isPending}
                >
                  <RefreshCw
                    className={cn("me-2 h-4 w-4", isPending && "animate-spin")}
                  />
                  Refresh
                </Button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Class Info */}
          {timetableData?.classInfo && (
            <div className="bg-muted flex items-center gap-4 rounded-lg p-4">
              <BookOpen className="text-primary h-8 w-8" />
              <div>
                <h3 className="text-lg font-semibold">
                  {timetableData.classInfo.name}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {timetableData.slots.length} scheduled periods per week
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {isPending && (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
          )}

          {/* Timetable Grid */}
          {!isPending && timetableData && teachingPeriods.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="border-e p-3 text-start">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Period</span>
                      </div>
                    </th>
                    {timetableData.workingDays.map((day) => (
                      <th key={day} className="min-w-[140px] p-3 text-center">
                        {DAY_LABELS[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teachingPeriods.map((period, idx) => (
                    <tr key={period.id} className="border-t">
                      <td className="bg-muted/50 border-e p-3">
                        <div className="font-medium">{period.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {formatTime(period.startTime)} -{" "}
                          {formatTime(period.endTime)}
                        </div>
                      </td>
                      {timetableData.workingDays.map((day) => {
                        const slot = getSlot(day, period.id)
                        return (
                          <td
                            key={`${day}-${period.id}`}
                            className="border-e p-2"
                          >
                            {slot ? (
                              <div className="bg-primary/10 space-y-1 rounded-md p-2">
                                <div className="text-sm font-medium">
                                  {slot.subject}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {slot.teacher}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="me-1 h-3 w-3" />
                                  {slot.room}
                                </Badge>
                              </div>
                            ) : (
                              <div className="text-muted-foreground p-2 text-center text-sm">
                                -
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!isPending &&
            selectedClass &&
            (!timetableData || timetableData.slots.length === 0) && (
              <div className="text-muted-foreground py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No timetable data found for this class</p>
              </div>
            )}

          {/* No Selection */}
          {!selectedClass && !isPending && (
            <div className="text-muted-foreground py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Select a class to view its timetable</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
