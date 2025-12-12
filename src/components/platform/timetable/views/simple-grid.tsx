'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Clock } from "lucide-react"

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Subject color mapping with hover effects (reference UI pattern)
const SUBJECT_COLORS: Record<string, string> = {
  Math: "bg-purple-100 hover:bg-purple-200 border-purple-300 dark:bg-purple-900/50 dark:hover:bg-purple-900/70 dark:border-purple-800",
  English: "bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-900/50 dark:hover:bg-green-900/70 dark:border-green-800",
  Science: "bg-pink-100 hover:bg-pink-200 border-pink-300 dark:bg-pink-900/50 dark:hover:bg-pink-900/70 dark:border-pink-800",
  Arabic: "bg-blue-100 hover:bg-blue-200 border-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 dark:border-blue-800",
  PE: "bg-orange-100 hover:bg-orange-200 border-orange-300 dark:bg-orange-900/50 dark:hover:bg-orange-900/70 dark:border-orange-800",
  Music: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900/50 dark:hover:bg-yellow-900/70 dark:border-yellow-800",
  Art: "bg-rose-100 hover:bg-rose-200 border-rose-300 dark:bg-rose-900/50 dark:hover:bg-rose-900/70 dark:border-rose-800",
  History: "bg-amber-100 hover:bg-amber-200 border-amber-300 dark:bg-amber-900/50 dark:hover:bg-amber-900/70 dark:border-amber-800",
  Geography: "bg-teal-100 hover:bg-teal-200 border-teal-300 dark:bg-teal-900/50 dark:hover:bg-teal-900/70 dark:border-teal-800",
  Islamic: "bg-emerald-100 hover:bg-emerald-200 border-emerald-300 dark:bg-emerald-900/50 dark:hover:bg-emerald-900/70 dark:border-emerald-800",
  Computer: "bg-cyan-100 hover:bg-cyan-200 border-cyan-300 dark:bg-cyan-900/50 dark:hover:bg-cyan-900/70 dark:border-cyan-800",
  Physics: "bg-indigo-100 hover:bg-indigo-200 border-indigo-300 dark:bg-indigo-900/50 dark:hover:bg-indigo-900/70 dark:border-indigo-800",
  Chemistry: "bg-violet-100 hover:bg-violet-200 border-violet-300 dark:bg-violet-900/50 dark:hover:bg-violet-900/70 dark:border-violet-800",
  Biology: "bg-lime-100 hover:bg-lime-200 border-lime-300 dark:bg-lime-900/50 dark:hover:bg-lime-900/70 dark:border-lime-800",
  Social: "bg-sky-100 hover:bg-sky-200 border-sky-300 dark:bg-sky-900/50 dark:hover:bg-sky-900/70 dark:border-sky-800",
  Lunch: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
}

// Fallback colors with hover effects for unknown subjects
const FALLBACK_COLORS = [
  'bg-red-100 hover:bg-red-200 border-red-300 dark:bg-red-900/50 dark:hover:bg-red-900/70 dark:border-red-800',
  'bg-orange-100 hover:bg-orange-200 border-orange-300 dark:bg-orange-900/50 dark:hover:bg-orange-900/70 dark:border-orange-800',
  'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900/50 dark:hover:bg-yellow-900/70 dark:border-yellow-800',
  'bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-900/50 dark:hover:bg-green-900/70 dark:border-green-800',
  'bg-blue-100 hover:bg-blue-200 border-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 dark:border-blue-800',
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
  onSlotClick?: (day: number, periodId: string, slot?: Slot) => void
  /** Highlight the current day column */
  highlightToday?: boolean
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
  onSlotClick,
  highlightToday = false
}: SimpleGridProps) {
  // Get current day for highlighting
  const today = highlightToday ? new Date().getDay() : -1

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
    <div className="overflow-x-auto rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 print:shadow-none print:rounded-none">
      <div className="min-w-full bg-white dark:bg-neutral-900">
        {/* Header */}
        <div className={cn("grid bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700", gridColsClass)}>
          <div className="py-3 px-2 sm:py-5 sm:px-8 text-neutral-500 dark:text-neutral-400 flex flex-col items-center justify-center border-r border-neutral-200 dark:border-neutral-700 print:py-3">
            <Clock className="w-4 h-4 print:w-5 print:h-5" />
          </div>
          {sortedDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                "text-sm sm:text-base py-2 sm:py-5 px-4 sm:px-8 font-medium text-center text-neutral-700 dark:text-neutral-300",
                index < sortedDays.length - 1 ? "border-r border-neutral-200 dark:border-neutral-700" : "",
                "print:text-base print:font-semibold print:py-3"
              )}
            >
              {DAY_LABELS[day]}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {teachingPeriods.map((period, periodIdx) => (
            <div key={period.id}>
              {/* Lunch Row (inserted after specified period) */}
              {lunchAfterPeriod && periodIdx + 1 === lunchAfterPeriod && (
                <div className={cn("grid", gridColsClass)}>
                  <div className="py-3 px-2 sm:py-5 sm:px-8 bg-neutral-100 dark:bg-neutral-800 flex flex-col justify-center items-center border-r border-neutral-200 dark:border-neutral-700">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Lunch</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">(12:20)</span>
                  </div>
                  <div
                    className={cn(
                      "py-3 px-2 sm:py-5 sm:px-8 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800/50",
                      lunchColSpan
                    )}
                  >
                    <span className="font-medium text-neutral-500 dark:text-neutral-400">Lunch Break</span>
                  </div>
                </div>
              )}

              {/* Regular Period Row */}
              <div className={cn("grid", gridColsClass)}>
                {/* Period Cell */}
                <div className="py-3 px-2 sm:py-5 sm:px-8 bg-neutral-100 dark:bg-neutral-800 flex flex-col justify-center items-center border-r border-neutral-200 dark:border-neutral-700 print:py-3">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300 text-sm sm:text-base print:text-sm">Period {period.name}</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
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
                        "min-h-14 sm:min-h-20 py-2 px-2 sm:py-4 sm:px-4 flex flex-col items-center justify-center transition-all duration-200",
                        slot && display?.primary
                          ? getSubjectColor(display.primary)
                          : "bg-neutral-50 dark:bg-neutral-800/30",
                        dayIdx < sortedDays.length - 1 ? "border-r border-neutral-200 dark:border-neutral-700" : "",
                        editable && "cursor-pointer hover:shadow-inner",
                        "print:min-h-12 print:py-2"
                      )}
                      onClick={() => editable && onSlotClick?.(day, period.id, slot)}
                    >
                      {slot && display ? (
                        <>
                          <span className="font-medium text-neutral-800 dark:text-neutral-100 text-center text-xs sm:text-sm print:text-xs">
                            {display.primary}
                          </span>
                          {display.secondary && (
                            <span className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 sm:mt-1 print:text-[10px]">
                              {display.secondary}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-neutral-400 dark:text-neutral-600">
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
