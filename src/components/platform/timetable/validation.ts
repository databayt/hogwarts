import { z } from 'zod'

/**
 * Timetable Validation Schemas
 * Comprehensive input validation for all timetable operations
 */

// ============================================================================
// Base Schemas
// ============================================================================

export const dayOfWeekSchema = z
  .number()
  .int()
  .min(0, 'Day must be between 0 (Sunday) and 6 (Saturday)')
  .max(6, 'Day must be between 0 (Sunday) and 6 (Saturday)')

export const weekOffsetSchema = z
  .union([z.literal(0), z.literal(1)])
  .default(0)
  .describe('0 = current week, 1 = next week')

export const cuidSchema = z
  .string()
  .min(1, 'ID is required')
  .regex(/^c[a-z0-9]{24}$/, 'Invalid CUID format')

export const workingDaysSchema = z
  .array(dayOfWeekSchema)
  .min(1, 'At least one working day is required')
  .max(7, 'Cannot have more than 7 working days')
  .refine(
    (days) => new Set(days).size === days.length,
    'Working days must be unique'
  )

// ============================================================================
// Query Schemas
// ============================================================================

export const getWeeklyTimetableSchema = z.object({
  termId: cuidSchema,
  weekOffset: weekOffsetSchema.optional(),
  view: z
    .object({
      classId: cuidSchema.optional(),
      teacherId: cuidSchema.optional(),
    })
    .optional(),
})

export const getScheduleConfigSchema = z
  .object({
    termId: cuidSchema.optional(),
  })
  .optional()

export const detectTimetableConflictsSchema = z
  .object({
    termId: cuidSchema.optional(),
  })
  .optional()

export const suggestFreeSlotsSchema = z.object({
  termId: cuidSchema,
  classId: cuidSchema.optional(),
  teacherId: cuidSchema.optional(),
  preferredDays: z.array(dayOfWeekSchema).optional(),
  preferredPeriods: z.array(cuidSchema).optional(),
})

export const getClassesForSelectionSchema = z
  .object({
    termId: cuidSchema.optional(),
  })
  .optional()

export const getTeachersForSelectionSchema = z
  .object({
    termId: cuidSchema.optional(),
  })
  .optional()

// ============================================================================
// Mutation Schemas
// ============================================================================

export const upsertTimetableSlotSchema = z.object({
  termId: cuidSchema,
  dayOfWeek: dayOfWeekSchema,
  periodId: cuidSchema,
  classId: cuidSchema,
  teacherId: cuidSchema,
  classroomId: cuidSchema,
  weekOffset: weekOffsetSchema,
})

export const deleteTimetableSlotSchema = z.object({
  termId: cuidSchema,
  dayOfWeek: dayOfWeekSchema,
  periodId: cuidSchema,
  classId: cuidSchema,
  weekOffset: weekOffsetSchema,
})

export const upsertSchoolWeekConfigSchema = z.object({
  termId: cuidSchema.nullable(),
  workingDays: workingDaysSchema,
  defaultLunchAfterPeriod: z
    .number()
    .int()
    .min(1)
    .max(10, 'Lunch period cannot be after period 10')
    .nullable()
    .optional(),
  extraLunchRules: z
    .record(
      z.string(),
      z.object({
        afterPeriod: z.number().int().min(1).max(10),
        duration: z.number().int().min(15).max(60),
      })
    )
    .optional(),
})

export const bulkUpsertTimetableSlotsSchema = z.object({
  termId: cuidSchema,
  slots: z.array(
    z.object({
      dayOfWeek: dayOfWeekSchema,
      periodId: cuidSchema,
      classId: cuidSchema,
      teacherId: cuidSchema,
      classroomId: cuidSchema,
      weekOffset: weekOffsetSchema,
    })
  ),
  clearExisting: z.boolean().default(false),
})

// ============================================================================
// Import/Export Schemas
// ============================================================================

export const exportTimetableSchema = z.object({
  termId: cuidSchema,
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  includeMetadata: z.boolean().default(true),
  filters: z
    .object({
      classIds: z.array(cuidSchema).optional(),
      teacherIds: z.array(cuidSchema).optional(),
      dayOfWeek: dayOfWeekSchema.optional(),
      weekOffset: weekOffsetSchema.optional(),
    })
    .optional(),
})

export const importTimetableSchema = z.object({
  termId: cuidSchema,
  format: z.enum(['json', 'csv']),
  data: z.union([
    z.string(), // CSV string
    z.array(
      z.object({
        dayOfWeek: dayOfWeekSchema,
        periodId: cuidSchema,
        classId: cuidSchema,
        teacherId: cuidSchema,
        classroomId: cuidSchema,
        weekOffset: weekOffsetSchema,
      })
    ), // JSON array
  ]),
  mode: z.enum(['merge', 'replace']).default('merge'),
})

// ============================================================================
// Conflict Resolution Schemas
// ============================================================================

export const resolveConflictSchema = z.object({
  conflictId: cuidSchema,
  resolution: z.enum(['keep_first', 'keep_second', 'remove_both', 'reassign']),
  reassignTo: z
    .object({
      teacherId: cuidSchema.optional(),
      classroomId: cuidSchema.optional(),
      periodId: cuidSchema.optional(),
      dayOfWeek: dayOfWeekSchema.optional(),
    })
    .optional(),
})

export const autoResolveConflictsSchema = z.object({
  termId: cuidSchema,
  strategy: z.enum([
    'prefer_senior_teacher',
    'prefer_larger_class',
    'prefer_core_subjects',
    'distribute_evenly',
  ]),
  dryRun: z.boolean().default(true),
})

// ============================================================================
// Analytics Schemas
// ============================================================================

export const getTimetableStatsSchema = z.object({
  termId: cuidSchema,
  groupBy: z.enum(['teacher', 'class', 'subject', 'room']).optional(),
  metrics: z
    .array(
      z.enum([
        'total_periods',
        'utilization_rate',
        'conflict_count',
        'free_periods',
        'back_to_back_classes',
      ])
    )
    .optional(),
})

// ============================================================================
// Type Exports
// ============================================================================

export type GetWeeklyTimetableInput = z.infer<typeof getWeeklyTimetableSchema>
export type UpsertTimetableSlotInput = z.infer<typeof upsertTimetableSlotSchema>
export type DeleteTimetableSlotInput = z.infer<typeof deleteTimetableSlotSchema>
export type UpsertSchoolWeekConfigInput = z.infer<typeof upsertSchoolWeekConfigSchema>
export type BulkUpsertTimetableSlotsInput = z.infer<typeof bulkUpsertTimetableSlotsSchema>
export type ExportTimetableInput = z.infer<typeof exportTimetableSchema>
export type ImportTimetableInput = z.infer<typeof importTimetableSchema>
export type ResolveConflictInput = z.infer<typeof resolveConflictSchema>
export type AutoResolveConflictsInput = z.infer<typeof autoResolveConflictsSchema>
export type GetTimetableStatsInput = z.infer<typeof getTimetableStatsSchema>
export type SuggestFreeSlotsInput = z.infer<typeof suggestFreeSlotsSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates that a time slot is within school hours
 */
export const validateTimeSlot = (
  dayOfWeek: number,
  periodId: string,
  workingDays: number[]
): boolean => {
  if (!workingDays.includes(dayOfWeek)) {
    throw new Error(`Day ${dayOfWeek} is not a working day`)
  }
  // Additional period validation can be added here
  return true
}

/**
 * Validates that there are no time conflicts for a teacher
 */
export const validateTeacherAvailability = (
  teacherId: string,
  dayOfWeek: number,
  periodId: string,
  existingSlots: Array<{ teacherId: string; dayOfWeek: number; periodId: string }>
): boolean => {
  const hasConflict = existingSlots.some(
    (slot) =>
      slot.teacherId === teacherId &&
      slot.dayOfWeek === dayOfWeek &&
      slot.periodId === periodId
  )
  if (hasConflict) {
    throw new Error(`Teacher ${teacherId} already has a class at this time`)
  }
  return true
}

/**
 * Validates that there are no room conflicts
 */
export const validateRoomAvailability = (
  classroomId: string,
  dayOfWeek: number,
  periodId: string,
  existingSlots: Array<{ classroomId: string; dayOfWeek: number; periodId: string }>
): boolean => {
  const hasConflict = existingSlots.some(
    (slot) =>
      slot.classroomId === classroomId &&
      slot.dayOfWeek === dayOfWeek &&
      slot.periodId === periodId
  )
  if (hasConflict) {
    throw new Error(`Classroom ${classroomId} is already booked at this time`)
  }
  return true
}

/**
 * Validates subject distribution for a class
 * Ensures balanced distribution of subjects throughout the week
 */
export const validateSubjectDistribution = (
  classId: string,
  subjectId: string,
  weeklySlots: Array<{ classId: string; subjectId: string }>
): { isValid: boolean; message?: string } => {
  const subjectCount = weeklySlots.filter(
    (slot) => slot.classId === classId && slot.subjectId === subjectId
  ).length

  const maxPeriodsPerWeek: Record<string, number> = {
    mathematics: 5,
    english: 5,
    science: 4,
    history: 3,
    geography: 3,
    physical_education: 2,
    art: 2,
    music: 2,
    computer_science: 2,
  }

  const subjectKey = subjectId.toLowerCase()
  const maxAllowed = maxPeriodsPerWeek[subjectKey] || 3

  if (subjectCount >= maxAllowed) {
    return {
      isValid: false,
      message: `Subject ${subjectId} already has ${subjectCount} periods (max: ${maxAllowed})`,
    }
  }

  return { isValid: true }
}

/**
 * Validates that a teacher doesn't have back-to-back classes
 * across different physical locations
 */
export const validateTeacherTravelTime = (
  teacherId: string,
  dayOfWeek: number,
  periodId: string,
  classroomId: string,
  existingSlots: Array<{
    teacherId: string
    dayOfWeek: number
    periodId: string
    classroomId: string
    periodOrder: number
  }>
): { isValid: boolean; message?: string } => {
  const teacherSlots = existingSlots
    .filter((slot) => slot.teacherId === teacherId && slot.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.periodOrder - b.periodOrder)

  // Check if this would create back-to-back classes in different rooms
  for (const slot of teacherSlots) {
    if (Math.abs(slot.periodOrder - parseInt(periodId)) === 1) {
      if (slot.classroomId !== classroomId) {
        // Check if rooms are in different buildings (you'd need building data)
        return {
          isValid: false,
          message: `Teacher has back-to-back classes in different rooms`,
        }
      }
    }
  }

  return { isValid: true }
}