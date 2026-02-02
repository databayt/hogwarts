"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

import { DAYS_OF_WEEK } from "./config"
import {
  Period,
  SubjectInfo,
  TeacherInfo,
  TimetableDictionary,
  TimetableSlot,
} from "./types"
import { formatPeriodTime, getSlotDisplayInfo, getSubjectColor } from "./utils"

interface TimetableMobileProps {
  slots: TimetableSlot[]
  periods: Period[]
  workingDays: number[]
  teachers: TeacherInfo[]
  subjects: SubjectInfo[]
  viewType: "class" | "teacher" | "room" | "student"
  editable?: boolean
  onSlotClick?: (slot: TimetableSlot) => void
  onSlotEdit?: (slot: TimetableSlot) => void
  onEmptyCellClick?: (day: number, periodId: string) => void
  dictionary?: TimetableDictionary
}

export function TimetableMobile({
  slots,
  periods,
  workingDays,
  teachers,
  subjects,
  viewType,
  editable = false,
  onSlotClick,
  onSlotEdit,
  onEmptyCellClick,
  dictionary = {},
}: TimetableMobileProps) {
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay()
    return workingDays.includes(today) ? today : workingDays[0]
  })
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set())
  const [touchStart, setTouchStart] = useState<number | null>(null)

  // Get day name
  const getDayLabel = useCallback((dayId: number, short = false) => {
    const day = DAYS_OF_WEEK.find((d) => d.id === dayId)
    return short ? day?.short : day?.name
  }, [])

  // Get slots for selected day
  const daySlots = useMemo(
    () => slots.filter((s) => s.dayOfWeek === selectedDay),
    [slots, selectedDay]
  )

  // Navigation handlers
  const goToNextDay = useCallback(() => {
    const currentIndex = workingDays.indexOf(selectedDay)
    if (currentIndex < workingDays.length - 1) {
      setSelectedDay(workingDays[currentIndex + 1])
    }
  }, [selectedDay, workingDays])

  const goToPrevDay = useCallback(() => {
    const currentIndex = workingDays.indexOf(selectedDay)
    if (currentIndex > 0) {
      setSelectedDay(workingDays[currentIndex - 1])
    }
  }, [selectedDay, workingDays])

  // Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStart === null) return

      const touchEnd = e.changedTouches[0].clientX
      const diff = touchStart - touchEnd

      // Minimum swipe distance (50px)
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swipe left = next day
          goToNextDay()
        } else {
          // Swipe right = prev day
          goToPrevDay()
        }
      }

      setTouchStart(null)
    },
    [touchStart, goToNextDay, goToPrevDay]
  )

  // Toggle period expansion
  const togglePeriod = useCallback((periodId: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev)
      if (next.has(periodId)) {
        next.delete(periodId)
      } else {
        next.add(periodId)
      }
      return next
    })
  }, [])

  // Get slot for a specific period
  const getSlotForPeriod = useCallback(
    (periodId: string): TimetableSlot | null => {
      return daySlots.find((s) => s.periodId === periodId) || null
    },
    [daySlots]
  )

  const canGoPrev = workingDays.indexOf(selectedDay) > 0
  const canGoNext = workingDays.indexOf(selectedDay) < workingDays.length - 1

  return (
    <div className="flex h-full flex-col">
      {/* Day Selector - Horizontal scroll on mobile */}
      <div className="border-b pb-2">
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-2">
            {workingDays.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "min-w-[80px] flex-shrink-0",
                  selectedDay === day && "font-semibold"
                )}
              >
                {getDayLabel(day, true)}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Day Navigation Header */}
      <div className="bg-muted/50 flex items-center justify-between border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevDay}
          disabled={!canGoPrev}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <h3 className="text-lg font-semibold">{getDayLabel(selectedDay)}</h3>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          disabled={!canGoNext}
          className="h-8 w-8"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Period List - Swipeable */}
      <div
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="space-y-2 p-4">
          {periods.map((period) => {
            const slot = getSlotForPeriod(period.id)
            const isExpanded = expandedPeriods.has(period.id)
            const displayInfo = slot
              ? getSlotDisplayInfo(slot, subjects, teachers)
              : null

            // Break period
            if (period.isBreak) {
              return (
                <Card key={period.id} className="bg-muted/30">
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground text-sm">
                        {period.name}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {formatPeriodTime(period.startTime, period.endTime)}
                    </span>
                  </CardContent>
                </Card>
              )
            }

            // Regular period
            return (
              <Collapsible key={period.id} open={isExpanded}>
                <Card
                  className={cn(
                    "transition-all",
                    slot && "cursor-pointer hover:shadow-md",
                    editable && !slot && "hover:border-primary cursor-pointer"
                  )}
                  style={
                    displayInfo
                      ? {
                          borderLeftColor: displayInfo.color,
                          borderLeftWidth: "4px",
                        }
                      : undefined
                  }
                  onClick={() => {
                    if (slot) {
                      togglePeriod(period.id)
                      onSlotClick?.(slot)
                    } else if (editable) {
                      onEmptyCellClick?.(selectedDay, period.id)
                    }
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">
                              {formatPeriodTime(
                                period.startTime,
                                period.endTime
                              )}
                            </p>
                            <p className="text-sm font-medium">{period.name}</p>
                          </div>
                        </div>

                        {slot && displayInfo ? (
                          <div className="text-end">
                            <CardTitle
                              className="text-base"
                              style={{ color: displayInfo.color }}
                            >
                              {displayInfo.subject}
                            </CardTitle>
                            {displayInfo.isSubstitute && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Substitute
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {editable
                              ? dictionary.tapToAdd || "Tap to add"
                              : dictionary.noClass || "No class"}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  {slot && displayInfo && (
                    <CollapsibleContent>
                      <CardContent className="space-y-3 border-t pt-3">
                        {/* Teacher */}
                        <div className="flex items-center gap-2">
                          <User className="text-muted-foreground h-4 w-4" />
                          <span className="text-sm">{displayInfo.teacher}</span>
                        </div>

                        {/* Room */}
                        {slot.classroomId && (
                          <div className="flex items-center gap-2">
                            <MapPin className="text-muted-foreground h-4 w-4" />
                            <span className="text-sm">{slot.classroomId}</span>
                          </div>
                        )}

                        {/* Edit button */}
                        {editable && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSlotEdit?.(slot)
                            }}
                          >
                            {dictionary.edit || "Edit"}
                          </Button>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  )}
                </Card>
              </Collapsible>
            )
          })}
        </div>
      </div>

      {/* Day Summary */}
      <div className="bg-muted/30 border-t px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {daySlots.length} {dictionary.classesScheduled || "classes"}
          </span>
          <span className="text-muted-foreground">
            {workingDays.indexOf(selectedDay) + 1} / {workingDays.length}{" "}
            {dictionary.days || "days"}
          </span>
        </div>
      </div>
    </div>
  )
}
