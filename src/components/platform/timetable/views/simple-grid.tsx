'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Clock } from "lucide-react"

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

  // Get subject color based on hash
  const getSubjectColor = (subject: string) => {
    if (!subject) return 'bg-muted'
    const hash = subject.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const colors = [
      'bg-blue-100 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800',
      'bg-green-100 dark:bg-green-950/50 border-green-300 dark:border-green-800',
      'bg-yellow-100 dark:bg-yellow-950/50 border-yellow-300 dark:border-yellow-800',
      'bg-purple-100 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800',
      'bg-pink-100 dark:bg-pink-950/50 border-pink-300 dark:border-pink-800',
      'bg-indigo-100 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800',
      'bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800',
      'bg-teal-100 dark:bg-teal-950/50 border-teal-300 dark:border-teal-800',
    ]
    return colors[hash % colors.length]
  }

  // Sort working days for RTL
  const sortedDays = isRTL ? [...workingDays].reverse() : workingDays

  // ListFilter periods (teaching only, no breaks for lunch row)
  const teachingPeriods = periods.filter(p => !p.isBreak)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header Row */}
        <div
          className={cn(
            "grid gap-1 mb-1",
            isRTL && "direction-rtl"
          )}
          style={{ gridTemplateColumns: `80px repeat(${sortedDays.length}, 1fr)` }}
        >
          {/* Time Column Header */}
          <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Day Headers */}
          {sortedDays.map(day => (
            <div
              key={day}
              className={cn(
                "p-2 text-center font-medium rounded-lg",
                highlightToday && day === today
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {DAY_LABELS[day]}
            </div>
          ))}
        </div>

        {/* Period Rows */}
        {teachingPeriods.map((period, periodIdx) => (
          <div key={period.id}>
            {/* Lunch Row (inserted after specified period) */}
            {lunchAfterPeriod && periodIdx === lunchAfterPeriod - 1 && (
              <div
                className="grid gap-1 my-1"
                style={{ gridTemplateColumns: `80px repeat(${sortedDays.length}, 1fr)` }}
              >
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted/50 rounded-lg border border-dashed">
                  Lunch
                </div>
                <div
                  className="p-3 text-center text-muted-foreground bg-muted/50 rounded-lg border border-dashed"
                  style={{ gridColumn: `span ${sortedDays.length}` }}
                >
                  Lunch Break
                </div>
              </div>
            )}

            {/* Regular Period Row */}
            <div
              className="grid gap-1 mb-1"
              style={{ gridTemplateColumns: `80px repeat(${sortedDays.length}, 1fr)` }}
            >
              {/* Time Cell */}
              <div className="p-2 text-center bg-muted rounded-lg">
                <p className="text-xs font-medium">{period.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(period.startTime)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(period.endTime)}
                </p>
              </div>

              {/* Day Cells */}
              {sortedDays.map(day => {
                const slot = slotMap.get(`${day}-${period.id}`)
                const display = slot ? getSlotDisplay(slot) : null

                return (
                  <div
                    key={`${day}-${period.id}`}
                    className={cn(
                      "min-h-[80px] p-2 rounded-lg border transition-colors",
                      slot
                        ? getSubjectColor(display?.primary || '')
                        : "bg-background border-dashed border-muted-foreground/20",
                      editable && "cursor-pointer hover:border-primary",
                      highlightToday && day === today && "ring-2 ring-primary/20"
                    )}
                    onClick={() => editable && onSlotClick?.(day, period.id, slot)}
                  >
                    {slot && display ? (
                      <div className="h-full flex flex-col">
                        <p className="font-medium text-sm line-clamp-2">
                          {display.primary}
                        </p>
                        {display.secondary && (
                          <p className="text-xs text-muted-foreground mt-auto line-clamp-1">
                            {display.secondary}
                          </p>
                        )}
                        {slot.room && viewMode !== 'room' && (
                          <Badge variant="secondary" className="mt-1 text-xs w-fit">
                            {slot.room}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground/50">
                        {editable ? '+' : '-'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
