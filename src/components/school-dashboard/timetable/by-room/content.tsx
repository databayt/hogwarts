"use client"

import { useEffect, useState, useTransition } from "react"
import {
  Clock,
  DoorOpen,
  RefreshCw,
  TriangleAlert,
  User,
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
import { Progress } from "@/components/ui/progress"
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
  getRoomsForSelection,
  getTermsForSelection,
  getTimetableByRoom,
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
  className: string
  classId: string
  teacher: string
  teacherId: string
  subject: string
}

type RoomTimetableData = {
  roomInfo: { id: string; name: string; capacity: number } | null
  workingDays: number[]
  periods: { id: string; name: string; startTime: Date; endTime: Date }[]
  slots: SlotData[]
  utilization: { usedSlots: number; totalSlots: number; rate: number }
  lunchAfterPeriod: number | null
}

export default function TimetableByRoomContent({ dictionary }: Props) {
  const d = dictionary?.timetable

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [terms, setTerms] = useState<{ id: string; label: string }[]>([])
  const [rooms, setRooms] = useState<
    { id: string; label: string; capacity: number }[]
  >([])
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedRoom, setSelectedRoom] = useState<string>("")

  const [timetableData, setTimetableData] = useState<RoomTimetableData | null>(
    null
  )

  // Load terms and rooms on mount
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load timetable when room changes
  useEffect(() => {
    if (selectedTerm && selectedRoom) {
      loadTimetable()
    }
  }, [selectedTerm, selectedRoom])

  const loadInitialData = async () => {
    try {
      const [termsResult, roomsResult] = await Promise.all([
        getTermsForSelection(),
        getRoomsForSelection(),
      ])
      setTerms(termsResult.terms)
      setRooms(roomsResult.rooms)
      if (termsResult.terms.length > 0) {
        setSelectedTerm(termsResult.terms[0].id)
      }
    } catch {
      setError("Failed to load initial data")
    }
  }

  const loadTimetable = async () => {
    startTransition(async () => {
      setError(null)
      try {
        const data = await getTimetableByRoom({
          termId: selectedTerm,
          roomId: selectedRoom,
          weekOffset: 0,
        })
        setTimetableData(data as RoomTimetableData)
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

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return "text-red-500"
    if (rate >= 60) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            {d?.byRoom?.title || "Timetable by Room"}
          </CardTitle>
          <CardDescription>
            {d?.byRoom?.description || "View room allocation and utilization"}
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
              <label className="text-sm font-medium">Room</label>
              <Select
                value={selectedRoom}
                onValueChange={setSelectedRoom}
                disabled={!selectedTerm}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.label} ({room.capacity} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRoom && (
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

          {/* Room Info & Utilization */}
          {timetableData?.roomInfo && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-muted flex items-center gap-4 rounded-lg p-4">
                <DoorOpen className="text-primary h-8 w-8" />
                <div>
                  <h3 className="text-lg font-semibold">
                    {timetableData.roomInfo.name}
                  </h3>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    Capacity: {timetableData.roomInfo.capacity} seats
                  </p>
                </div>
              </div>

              <div className="bg-primary/5 space-y-2 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Room Utilization</h4>
                  <span
                    className={cn(
                      "font-semibold",
                      getUtilizationColor(timetableData.utilization.rate)
                    )}
                  >
                    {timetableData.utilization.rate}%
                  </span>
                </div>
                <Progress
                  value={timetableData.utilization.rate}
                  className="h-2"
                />
                <p className="text-muted-foreground text-sm">
                  {timetableData.utilization.usedSlots} of{" "}
                  {timetableData.utilization.totalSlots} slots used
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
                  {teachingPeriods.map((period) => (
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
                                  {slot.className}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {slot.subject}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  <User className="me-1 h-3 w-3" />
                                  {slot.teacher}
                                </Badge>
                              </div>
                            ) : (
                              <div className="p-2 text-center text-sm text-green-600 italic">
                                Available
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
            selectedRoom &&
            (!timetableData || timetableData.slots.length === 0) && (
              <div className="text-muted-foreground py-12 text-center">
                <DoorOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>This room has no scheduled classes</p>
              </div>
            )}

          {/* No Selection */}
          {!selectedRoom && !isPending && (
            <div className="text-muted-foreground py-12 text-center">
              <DoorOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Select a room to view its schedule</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
