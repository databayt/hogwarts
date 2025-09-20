import { TimetableSlot, TimetableConflict, TeacherInfo, Period, SubjectInfo } from './types'
import { SUBJECT_COLORS, WORKLOAD_LIMITS } from './constants'

export function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS.default
}

export function formatTime(time: string): string {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

export function formatPeriodTime(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

export function getDayName(dayIndex: number, short = false): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return short ? shortDays[dayIndex] : days[dayIndex]
}

export function detectConflicts(slots: TimetableSlot[]): TimetableConflict[] {
  const conflicts: TimetableConflict[] = []

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const slot1 = slots[i]
      const slot2 = slots[j]

      // Skip if different day or period
      if (slot1.dayOfWeek !== slot2.dayOfWeek || slot1.periodId !== slot2.periodId) {
        continue
      }

      // Teacher conflict
      if (slot1.teacherId && slot1.teacherId === slot2.teacherId) {
        conflicts.push({
          id: `${slot1.id}-${slot2.id}-teacher`,
          type: 'teacher',
          slot1,
          slot2,
          severity: 'error',
          message: `Teacher assigned to multiple classes at the same time`
        })
      }

      // Classroom conflict
      if (slot1.classroomId && slot1.classroomId === slot2.classroomId) {
        conflicts.push({
          id: `${slot1.id}-${slot2.id}-room`,
          type: 'classroom',
          slot1,
          slot2,
          severity: 'error',
          message: `Classroom double-booked at the same time`
        })
      }

      // Class conflict (same class scheduled twice)
      if (slot1.classId === slot2.classId) {
        conflicts.push({
          id: `${slot1.id}-${slot2.id}-class`,
          type: 'class',
          slot1,
          slot2,
          severity: 'error',
          message: `Class scheduled multiple times in the same period`
        })
      }
    }
  }

  return conflicts
}

export function calculateTeacherWorkload(
  teacherId: string,
  slots: TimetableSlot[],
  periods: Period[]
): { hoursPerDay: Record<number, number>; hoursPerWeek: number; violations: string[] } {
  const hoursPerDay: Record<number, number> = {}
  let hoursPerWeek = 0
  const violations: string[] = []

  const teacherSlots = slots.filter(s => s.teacherId === teacherId)

  for (const slot of teacherSlots) {
    const period = periods.find(p => p.id === slot.periodId)
    if (!period) continue

    const duration = calculatePeriodDuration(period.startTime, period.endTime)
    hoursPerDay[slot.dayOfWeek] = (hoursPerDay[slot.dayOfWeek] || 0) + duration
    hoursPerWeek += duration
  }

  // Check violations
  Object.entries(hoursPerDay).forEach(([day, hours]) => {
    if (hours > WORKLOAD_LIMITS.TEACHER_MAX_HOURS_PER_DAY) {
      violations.push(`Exceeds max hours on ${getDayName(parseInt(day))}`)
    }
  })

  if (hoursPerWeek > WORKLOAD_LIMITS.TEACHER_MAX_HOURS_PER_WEEK) {
    violations.push('Exceeds max weekly hours')
  }

  return { hoursPerDay, hoursPerWeek, violations }
}

export function calculatePeriodDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  return (endHour * 60 + endMin - startHour * 60 - startMin) / 60
}

export function findAvailableSlots(
  teacherId: string,
  slots: TimetableSlot[],
  periods: Period[],
  workingDays: number[]
): { day: number; periodId: string }[] {
  const availableSlots: { day: number; periodId: string }[] = []
  const occupiedSlots = slots.filter(s => s.teacherId === teacherId)

  for (const day of workingDays) {
    for (const period of periods) {
      const isOccupied = occupiedSlots.some(
        s => s.dayOfWeek === day && s.periodId === period.id
      )
      if (!isOccupied && !period.isBreak) {
        availableSlots.push({ day, periodId: period.id })
      }
    }
  }

  return availableSlots
}

export function generateTimetableGrid(
  slots: TimetableSlot[],
  periods: Period[],
  workingDays: number[],
  viewType: 'class' | 'teacher' | 'room',
  viewId: string
): (TimetableSlot | null)[][] {
  const grid: (TimetableSlot | null)[][] = []

  // Filter slots based on view type
  const filteredSlots = slots.filter(slot => {
    switch (viewType) {
      case 'class':
        return slot.classId === viewId
      case 'teacher':
        return slot.teacherId === viewId
      case 'room':
        return slot.classroomId === viewId
      default:
        return false
    }
  })

  // Build grid
  for (const period of periods) {
    const row: (TimetableSlot | null)[] = []
    for (const day of workingDays) {
      const slot = filteredSlots.find(
        s => s.periodId === period.id && s.dayOfWeek === day
      )
      row.push(slot || null)
    }
    grid.push(row)
  }

  return grid
}

export function validateSlotPlacement(
  slot: TimetableSlot,
  existingSlots: TimetableSlot[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for conflicts
  const conflicts = detectConflicts([...existingSlots, slot])
  if (conflicts.length > 0) {
    conflicts.forEach(c => errors.push(c.message))
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function suggestAlternativeSlots(
  originalSlot: TimetableSlot,
  allSlots: TimetableSlot[],
  periods: Period[],
  workingDays: number[]
): TimetableSlot[] {
  const suggestions: TimetableSlot[] = []

  if (originalSlot.teacherId) {
    const availableSlots = findAvailableSlots(
      originalSlot.teacherId,
      allSlots,
      periods,
      workingDays
    )

    for (const available of availableSlots.slice(0, 5)) {
      suggestions.push({
        ...originalSlot,
        dayOfWeek: available.day,
        periodId: available.periodId
      })
    }
  }

  return suggestions
}

export function groupSlotsByDay(slots: TimetableSlot[]): Record<number, TimetableSlot[]> {
  const grouped: Record<number, TimetableSlot[]> = {}

  for (const slot of slots) {
    if (!grouped[slot.dayOfWeek]) {
      grouped[slot.dayOfWeek] = []
    }
    grouped[slot.dayOfWeek].push(slot)
  }

  return grouped
}

export function sortSlotsByPeriod(slots: TimetableSlot[], periods: Period[]): TimetableSlot[] {
  const periodOrder = new Map(periods.map((p, i) => [p.id, i]))

  return slots.sort((a, b) => {
    const orderA = periodOrder.get(a.periodId) ?? 999
    const orderB = periodOrder.get(b.periodId) ?? 999
    return orderA - orderB
  })
}

export function calculateUtilizationRate(
  slots: TimetableSlot[],
  totalPossibleSlots: number
): number {
  if (totalPossibleSlots === 0) return 0
  return Math.round((slots.length / totalPossibleSlots) * 100)
}

export function exportToCSV(
  slots: TimetableSlot[],
  periods: Period[],
  workingDays: number[]
): string {
  const headers = ['Time', ...workingDays.map(d => getDayName(d))]
  const rows: string[][] = [headers]

  for (const period of periods) {
    const row = [formatPeriodTime(period.startTime, period.endTime)]

    for (const day of workingDays) {
      const slot = slots.find(s => s.periodId === period.id && s.dayOfWeek === day)
      row.push(slot?.subjectId || '')
    }

    rows.push(row)
  }

  return rows.map(row => row.join(',')).join('\n')
}

export function parseCSVImport(csvContent: string): {
  valid: boolean
  data?: any[]
  errors?: string[]
} {
  try {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) {
      return { valid: false, errors: ['CSV file is empty or invalid'] }
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim())
      if (values.length !== headers.length) {
        throw new Error(`Row ${index + 2} has incorrect number of columns`)
      }

      const row: any = {}
      headers.forEach((header, i) => {
        row[header] = values[i]
      })
      return row
    })

    return { valid: true, data }
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Failed to parse CSV']
    }
  }
}

export function generateICalEvent(slot: TimetableSlot, period: Period, date: Date): string {
  const startDateTime = new Date(date)
  const [startHour, startMin] = period.startTime.split(':').map(Number)
  startDateTime.setHours(startHour, startMin, 0, 0)

  const endDateTime = new Date(date)
  const [endHour, endMin] = period.endTime.split(':').map(Number)
  endDateTime.setHours(endHour, endMin, 0, 0)

  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  return `BEGIN:VEVENT
UID:${slot.id}@school.edu
DTSTART:${formatDate(startDateTime)}
DTEND:${formatDate(endDateTime)}
SUMMARY:${slot.subjectId || 'Class'}
LOCATION:${slot.classroomId || 'TBA'}
DESCRIPTION:Teacher: ${slot.teacherId || 'TBA'}
END:VEVENT`
}

export function isSlotEditable(
  slot: TimetableSlot,
  userRole: string,
  userId?: string
): boolean {
  switch (userRole) {
    case 'admin':
    case 'principal':
      return true
    case 'teacher':
      return slot.teacherId === userId
    default:
      return false
  }
}

export function getSlotDisplayInfo(
  slot: TimetableSlot,
  subjects: SubjectInfo[],
  teachers: TeacherInfo[]
): {
  subject: string
  teacher: string
  color: string
  isSubstitute: boolean
} {
  const subject = subjects.find(s => s.id === slot.subjectId)
  const teacher = teachers.find(t => t.id === (slot.substituteTeacherId || slot.teacherId))

  return {
    subject: subject?.name || 'Unknown',
    teacher: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'TBA',
    color: subject?.color || SUBJECT_COLORS.default,
    isSubstitute: !!slot.isSubstitute
  }
}

export function optimizeTimetable(
  slots: TimetableSlot[],
  constraints: {
    minimizeGaps: boolean
    balanceWorkload: boolean
    preferMorningForCore: boolean
  }
): TimetableSlot[] {
  // This is a simplified optimization - in production, you'd use more sophisticated algorithms
  let optimized = [...slots]

  if (constraints.minimizeGaps) {
    // Sort to minimize gaps between classes
    optimized = optimized.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
      return a.periodId.localeCompare(b.periodId)
    })
  }

  // Additional optimization logic would go here

  return optimized
}