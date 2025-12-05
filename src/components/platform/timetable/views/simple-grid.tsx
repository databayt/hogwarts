'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Clock } from "lucide-react"

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Subject color mapping for visual distinction (following reference pattern)
const SUBJECT_COLORS: Record<string, string> = {
  Math: "bg-purple-100 border-purple-300 dark:bg-purple-900/50 dark:border-purple-800",
  English: "bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-800",
  Science: "bg-pink-100 border-pink-300 dark:bg-pink-900/50 dark:border-pink-800",
  Arabic: "bg-blue-100 border-blue-300 dark:bg-blue-900/50 dark:border-blue-800",
  PE: "bg-orange-100 border-orange-300 dark:bg-orange-900/50 dark:border-orange-800",
  Music: "bg-yellow-100 border-yellow-300 dark:bg-yellow-900/50 dark:border-yellow-800",
  Art: "bg-rose-100 border-rose-300 dark:bg-rose-900/50 dark:border-rose-800",
  History: "bg-amber-100 border-amber-300 dark:bg-amber-900/50 dark:border-amber-800",
  Geography: "bg-teal-100 border-teal-300 dark:bg-teal-900/50 dark:border-teal-800",
  Islamic: "bg-emerald-100 border-emerald-300 dark:bg-emerald-900/50 dark:border-emerald-800",
  Computer: "bg-cyan-100 border-cyan-300 dark:bg-cyan-900/50 dark:border-cyan-800",
  Physics: "bg-indigo-100 border-indigo-300 dark:bg-indigo-900/50 dark:border-indigo-800",
  Chemistry: "bg-violet-100 border-violet-300 dark:bg-violet-900/50 dark:border-violet-800",
  Biology: "bg-lime-100 border-lime-300 dark:bg-lime-900/50 dark:border-lime-800",
  Social: "bg-sky-100 border-sky-300 dark:bg-sky-900/50 dark:border-sky-800",
  Lunch: "bg-muted border-border",
}

// Fallback colors for unknown subjects
const FALLBACK_COLORS = [
  'bg-red-100 border-red-300 dark:bg-red-900/50 dark:border-red-800',
  'bg-orange-100 border-orange-300 dark:bg-orange-900/50 dark:border-orange-800',
  'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/50 dark:border-yellow-800',
  'bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-800',
  'bg-blue-100 border-blue-300 dark:bg-blue-900/50 dark:border-blue-800',
]

interface Slot {
  id: string
  dayOfWeek: number
  periodId: string
  periodName?: string
  subject?: string
  teacher?: string
  className?: string
  room?: string
  roomId?: string
  teacherId?: string
  classId?: string
}

interface Period {
  id: string
  name: string
  order: number
  startTime: Date | string
  endTime: Date | string
  isBreak: boolean
}

interface SimpleGridProps {
  slots: Slot[]
  workingDays: number[]
  periods: Period[]
  lunchAfterPeriod?: number | null
  isRTL?: boolean
  viewMode?: 'class' | 'teacher' | 'room'
  editable?: boolean
  highlightToday?: boolean
  onSlotClick?: (day: number, periodId: string, slot?: Slot) => void
}

function getSubjectColor(subject: string): string {
  if (!subject) return 'bg-muted border-border'

  // Check direct mapping first
  if (SUBJECT_COLORS[subject]) {
    return SUBJECT_COLORS[subject]
  }

  // Check partial matches
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) {
      return color
    }
  }

  // Fallback based on hash
  const hash = subject.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length]
}

export default function SimpleGrid({
  slots,
  workingDays,
  periods,
  lunchAfterPeriod,
  isRTL = false,
  viewMode = 'class',
  editable = false,
  highlightToday = false,
  onSlotClick
}: SimpleGridProps) {
  const today = new Date().getDay()

  // Build a map for quick slot lookup
  const slotMap = useMemo(() => {
    const map = new Map<string, Slot>()
    for (const slot of slots) {
      map.set(`${slot.dayOfWeek}-${slot.periodId}`, slot)
    }
    return map
  }, [slots])

  // Format time from Date
  const formatTime = (date: Date | string) => {
    const d = new Date(date)
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`
  }

  // Get display text based on view mode
  const getSlotDisplay = (slot: Slot) => {
    switch (viewMode) {
      case 'teacher':
        return {
          primary: slot.className || slot.subject || '',
          secondary: slot.room || ''
        }
      case 'room':
        return {
          primary: slot.subject || slot.className || '',
          secondary: slot.teacher || ''
        }
      case 'class':
      default:
        return {
          primary: slot.subject || '',
          secondary: slot.teacher || ''
        }
    }
  }

  // Sort working days for RTL
  const sortedDays = isRTL ? [...workingDays].reverse() : workingDays

  // Filter periods (teaching only, no breaks)
  const teachingPeriods = periods.filter(p => !p.isBreak)

  // Calculate grid columns class
  const totalCols = sortedDays.length + 1
  const gridColsClass = (() => {
    switch (totalCols) {
      case 2: return 'grid-cols-2'
      case 3: return 'grid-cols-3'
      case 4: return 'grid-cols-4'
      case 5: return 'grid-cols-5'
      case 6: return 'grid-cols-6'
      case 7: return 'grid-cols-7'
      case 8: return 'grid-cols-8'
      default: return 'grid-cols-6'
    }
  })()

  // Calculate lunch col span
  const lunchColSpan = (() => {
    switch (sortedDays.length) {
      case 1: return 'col-span-1'
      case 2: return 'col-span-2'
      case 3: return 'col-span-3'
      case 4: return 'col-span-4'
      case 5: return 'col-span-5'
      case 6: return 'col-span-6'
      case 7: return 'col-span-7'
      default: return 'col-span-5'
    }
  })()

  return (
    <div className="overflow-x-auto rounded-xl shadow-lg border border-border">
      <div className="min-w-full bg-card">
        {/* Header */}
        <div className={cn("grid bg-muted/50 border-b border-border", gridColsClass)}>
          <div className="py-5 px-8 text-muted-foreground flex items-center justify-center border-r border-border">
            <Clock className="w-4 h-4 mr-2" />
            <span className="font-medium">Period</span>
          </div>
          {sortedDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                "py-5 px-8 font-medium text-center",
                highlightToday && day === today
                  ? "bg-primary/10 text-primary"
                  : "text-foreground",
                index < sortedDays.length - 1 ? "border-r border-border" : ""
              )}
            >
              {DAY_LABELS[day]}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="divide-y divide-border">
          {teachingPeriods.map((period, periodIdx) => (
            <div key={period.id}>
              {/* Lunch Row (inserted after specified period) */}
              {lunchAfterPeriod && periodIdx + 1 === lunchAfterPeriod && (
                <div className={cn("grid", gridColsClass)}>
                  <div className="py-5 px-8 bg-muted/50 flex flex-col justify-center items-center border-r border-border">
                    <span className="font-medium text-foreground">Lunch</span>
                    <span className="text-xs text-muted-foreground mt-1">(12:20)</span>
                  </div>
                  <div
                    className={cn(
                      "py-5 px-8 flex items-center justify-center bg-muted/30",
                      lunchColSpan
                    )}
                  >
                    <span className="font-medium text-muted-foreground">Lunch Break</span>
                  </div>
                </div>
              )}

              {/* Regular Period Row */}
              <div className={cn("grid", gridColsClass)}>
                {/* Period Cell */}
                <div className="py-5 px-8 bg-muted/50 flex flex-col justify-center items-center border-r border-border">
                  <span className="font-medium text-foreground">Period {period.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    ({formatTime(period.startTime)})
                  </span>
                </div>

                {/* Day Cells */}
                {sortedDays.map((day, dayIdx) => {
                  const slot = slotMap.get(`${day}-${period.id}`)
                  const display = slot ? getSlotDisplay(slot) : null

                  return (
                    <div
                      key={`${day}-${period.id}`}
                      className={cn(
                        "py-5 px-8 flex flex-col items-center justify-center transition-all duration-200",
                        slot && display?.primary
                          ? getSubjectColor(display.primary)
                          : "bg-muted/20",
                        dayIdx < sortedDays.length - 1 ? "border-r border-border" : "",
                        highlightToday && day === today && "ring-2 ring-inset ring-primary/20",
                        editable && "cursor-pointer hover:shadow-inner"
                      )}
                      onClick={() => editable && onSlotClick?.(day, period.id, slot)}
                    >
                      {slot && display ? (
                        <>
                          <span className="font-medium text-foreground text-center">
                            {display.primary}
                          </span>
                          {display.secondary && (
                            <span className="text-xs text-muted-foreground mt-1">
                              {display.secondary}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground/50">
                          {editable ? '+' : '-'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
