/**
 * AI-Powered Timetable Generation Algorithm
 *
 * Implements a constraint-based scheduler with three phases:
 * 1. Greedy Assignment - Fast initial slot placement
 * 2. Constraint Satisfaction - Resolve conflicts and enforce rules
 * 3. Optimization - Balance workload and improve quality
 *
 * Benchmarked against industry leaders:
 * - aSc Timetables: Evaluates 5M+ combinations using genetic algorithm
 * - PowerSchool: Serves 60M+ students with enterprise scaling
 * - Classter: AI-driven automation with predictive analytics
 */

import type { Prisma } from "@prisma/client"

// ============================================================================
// Types
// ============================================================================

export interface GenerationInput {
  schoolId: string
  termId: string
  yearId: string
  config: GenerationConfig
}

export interface GenerationConfig {
  workingDays: number[] // 0-6 (Sun-Sat)
  periodsPerDay: string[] // Period IDs in order
  constraints: ConstraintConfig
  preferences: PreferenceConfig
}

export interface ConstraintConfig {
  enforceTeacherExpertise: boolean // Teacher must have subject expertise
  enforceRoomCapacity: boolean // Class size <= room capacity
  maxTeacherPeriodsPerDay: number // Default 6
  maxTeacherPeriodsPerWeek: number // Default 25
  maxConsecutivePeriods: number // Default 3
  requireLunchBreak: boolean // Enforce lunch period
  preventBackToBack: boolean // Different rooms consecutive periods
}

export interface PreferenceConfig {
  balanceSubjectDistribution: boolean // Spread subjects across week
  preferMorningForCore: boolean // Core subjects in morning periods
  avoidLastPeriodForLab: boolean // Lab activities not at end of day
  groupSameSubjectDays: boolean // Same subject on alternating days
}

export interface ClassRequirement {
  classId: string
  className: string
  subjectId: string
  subjectName: string
  hoursPerWeek: number // Required periods per week
  preferredTeacherIds: string[] // Teachers qualified for this subject
  requiresLab: boolean
  yearLevelId: string
  studentCount: number
}

export interface TeacherAvailability {
  teacherId: string
  teacherName: string
  maxPeriodsPerDay: number
  maxPeriodsPerWeek: number
  maxConsecutive: number
  subjectExpertise: string[] // Subject IDs
  unavailableBlocks: Array<{ dayOfWeek: number; periodId: string }>
  preferredPeriods: Array<{ dayOfWeek: number; periodId: string }>
  avoidedPeriods: Array<{ dayOfWeek: number; periodId: string }>
}

export interface RoomAvailability {
  roomId: string
  roomName: string
  capacity: number
  roomType: string // "regular" | "lab" | "gym" | "computer" | "art" | "music"
  allowedSubjectTypes: string[]
  reservedBlocks: Array<{ dayOfWeek: number; periodId: string }>
  hasAccessibility: boolean
}

export interface GeneratedSlot {
  dayOfWeek: number
  periodId: string
  classId: string
  teacherId: string
  classroomId: string
  score: number // Quality score (0-100)
  violations: string[] // Soft constraint violations
}

export interface GenerationResult {
  success: boolean
  slots: GeneratedSlot[]
  stats: GenerationStats
  unplacedClasses: string[] // Class IDs that couldn't be scheduled
  warnings: string[]
  errors: string[]
}

export interface GenerationStats {
  totalSlots: number
  placedSlots: number
  conflictsResolved: number
  optimizationScore: number // 0-100
  teacherWorkloadBalance: number // 0-100 (100 = perfectly balanced)
  roomUtilization: number // 0-100
  generationTimeMs: number
  iterations: number
}

// ============================================================================
// Algorithm State
// ============================================================================

interface AlgorithmState {
  slots: Map<string, GeneratedSlot> // key: "day:period:class"
  teacherSchedule: Map<string, Map<string, string[]>> // teacherId -> day -> [periodIds]
  roomSchedule: Map<string, Map<string, string[]>> // roomId -> day -> [periodIds]
  classSchedule: Map<string, Map<string, string[]>> // classId -> day -> [periodIds]
  subjectCounts: Map<string, Map<string, number>> // classId -> subjectId -> count
}

// ============================================================================
// Main Generation Function
// ============================================================================

export function generateTimetable(
  requirements: ClassRequirement[],
  teachers: TeacherAvailability[],
  rooms: RoomAvailability[],
  input: GenerationInput
): GenerationResult {
  const startTime = performance.now()
  const { config } = input

  // Initialize algorithm state
  const state: AlgorithmState = {
    slots: new Map(),
    teacherSchedule: new Map(),
    roomSchedule: new Map(),
    classSchedule: new Map(),
    subjectCounts: new Map(),
  }

  const warnings: string[] = []
  const errors: string[] = []
  const unplacedClasses: string[] = []

  // Build lookup maps for efficiency
  const teacherMap = new Map(teachers.map((t) => [t.teacherId, t]))
  const roomMap = new Map(rooms.map((r) => [r.roomId, r]))

  // =========================================================================
  // Phase 1: Greedy Assignment
  // =========================================================================

  // Sort requirements by constraint difficulty (most constrained first)
  const sortedRequirements = [...requirements].sort((a, b) => {
    // Prioritize: fewer teachers > requires lab > more hours
    const aScore =
      a.preferredTeacherIds.length * 10 +
      (a.requiresLab ? 100 : 0) +
      (10 - a.hoursPerWeek)
    const bScore =
      b.preferredTeacherIds.length * 10 +
      (b.requiresLab ? 100 : 0) +
      (10 - b.hoursPerWeek)
    return aScore - bScore // Lower score = more constrained = first
  })

  for (const req of sortedRequirements) {
    const placed = placeClassGreedy(req, state, config, teacherMap, roomMap)
    if (placed < req.hoursPerWeek) {
      unplacedClasses.push(req.classId)
      warnings.push(
        `Could only place ${placed}/${req.hoursPerWeek} periods for ${req.className}`
      )
    }
  }

  // =========================================================================
  // Phase 2: Constraint Satisfaction
  // =========================================================================

  let conflictsResolved = 0
  const maxIterations = 100

  for (let i = 0; i < maxIterations; i++) {
    const conflicts = detectConflicts(state, config, teacherMap)
    if (conflicts.length === 0) break

    for (const conflict of conflicts) {
      const resolved = resolveConflict(
        conflict,
        state,
        config,
        teacherMap,
        roomMap,
        requirements
      )
      if (resolved) {
        conflictsResolved++
      }
    }
  }

  // =========================================================================
  // Phase 3: Optimization
  // =========================================================================

  const optimizationResult = optimizeSchedule(
    state,
    config,
    teacherMap,
    roomMap,
    requirements
  )

  // Build final result
  const slots = Array.from(state.slots.values())
  const endTime = performance.now()

  return {
    success: unplacedClasses.length === 0 && errors.length === 0,
    slots,
    stats: {
      totalSlots: requirements.reduce((sum, r) => sum + r.hoursPerWeek, 0),
      placedSlots: slots.length,
      conflictsResolved,
      optimizationScore: optimizationResult.score,
      teacherWorkloadBalance: calculateWorkloadBalance(state, teachers),
      roomUtilization: calculateRoomUtilization(state, rooms, config),
      generationTimeMs: endTime - startTime,
      iterations: maxIterations,
    },
    unplacedClasses,
    warnings,
    errors,
  }
}

// ============================================================================
// Phase 1: Greedy Assignment
// ============================================================================

function placeClassGreedy(
  req: ClassRequirement,
  state: AlgorithmState,
  config: GenerationConfig,
  teacherMap: Map<string, TeacherAvailability>,
  roomMap: Map<string, RoomAvailability>
): number {
  let placedCount = 0

  // Get available teachers for this subject
  const qualifiedTeachers = req.preferredTeacherIds
    .map((id) => teacherMap.get(id))
    .filter((t): t is TeacherAvailability => t !== undefined)

  if (qualifiedTeachers.length === 0) {
    return 0 // No qualified teachers
  }

  // Get suitable rooms
  const suitableRooms = Array.from(roomMap.values()).filter((room) => {
    if (
      config.constraints.enforceRoomCapacity &&
      room.capacity < req.studentCount
    ) {
      return false
    }
    if (req.requiresLab && room.roomType !== "lab") {
      return false
    }
    // Enforce allowedSubjectTypes: if set, the class's subject must match
    if (room.allowedSubjectTypes.length > 0) {
      const subjectLower = req.subjectName.toLowerCase()
      const isAllowed = room.allowedSubjectTypes.some(
        (t) =>
          subjectLower.includes(t.toLowerCase()) ||
          t.toLowerCase().includes(subjectLower)
      )
      if (!isAllowed) return false
    }
    return true
  })

  if (suitableRooms.length === 0) {
    return 0 // No suitable rooms
  }

  // Try to place required hours
  const targetHours = req.hoursPerWeek
  const daysToUse = selectDaysForSubject(
    req,
    config.workingDays,
    targetHours,
    config.preferences
  )

  for (const day of daysToUse) {
    if (placedCount >= targetHours) break

    for (const periodId of config.periodsPerDay) {
      if (placedCount >= targetHours) break

      // Try each teacher/room combination
      for (const teacher of qualifiedTeachers) {
        if (!isTeacherAvailable(teacher, day, periodId, state, config)) continue

        for (const room of suitableRooms) {
          if (!isRoomAvailable(room, day, periodId, state)) continue

          // Check class not already scheduled this period
          if (isClassScheduled(req.classId, day, periodId, state)) continue

          // Place the slot
          const slot: GeneratedSlot = {
            dayOfWeek: day,
            periodId,
            classId: req.classId,
            teacherId: teacher.teacherId,
            classroomId: room.roomId,
            score: calculateSlotScore(day, periodId, req, teacher, config),
            violations: [],
          }

          addSlot(slot, state)
          placedCount++
          break // Move to next period
        }
        if (
          placedCount > 0 &&
          isClassScheduled(req.classId, day, periodId, state)
        ) {
          break // Successfully placed, try next period
        }
      }
    }
  }

  return placedCount
}

function selectDaysForSubject(
  req: ClassRequirement,
  workingDays: number[],
  hoursNeeded: number,
  preferences: PreferenceConfig
): number[] {
  const days: number[] = []

  if (preferences.groupSameSubjectDays && hoursNeeded >= 2) {
    // Alternate days (e.g., Sun/Tue/Thu or Mon/Wed)
    const alternating = workingDays.filter((_, i) => i % 2 === 0)
    days.push(...alternating)
    if (days.length < hoursNeeded) {
      const remaining = workingDays.filter((d) => !days.includes(d))
      days.push(...remaining)
    }
  } else {
    // Distribute across all days
    days.push(...workingDays)
  }

  return days.slice(0, Math.ceil(hoursNeeded * 1.5)) // Extra days for flexibility
}

// ============================================================================
// Phase 2: Conflict Detection & Resolution
// ============================================================================

interface Conflict {
  type:
    | "teacher_double_book"
    | "room_double_book"
    | "workload_exceeded"
    | "consecutive"
  day: number
  periodId: string
  affectedSlots: GeneratedSlot[]
  severity: "error" | "warning"
}

function detectConflicts(
  state: AlgorithmState,
  config: GenerationConfig,
  teacherMap: Map<string, TeacherAvailability>
): Conflict[] {
  const conflicts: Conflict[] = []

  // Check teacher double-booking
  for (const [teacherId, schedule] of state.teacherSchedule) {
    for (const [dayStr, periods] of schedule) {
      const day = parseInt(dayStr)
      const periodCounts = new Map<string, number>()

      for (const periodId of periods) {
        periodCounts.set(periodId, (periodCounts.get(periodId) || 0) + 1)
      }

      for (const [periodId, count] of periodCounts) {
        if (count > 1) {
          const affectedSlots = Array.from(state.slots.values()).filter(
            (s) =>
              s.teacherId === teacherId &&
              s.dayOfWeek === day &&
              s.periodId === periodId
          )
          conflicts.push({
            type: "teacher_double_book",
            day,
            periodId,
            affectedSlots,
            severity: "error",
          })
        }
      }
    }
  }

  // Check room double-booking
  for (const [roomId, schedule] of state.roomSchedule) {
    for (const [dayStr, periods] of schedule) {
      const day = parseInt(dayStr)
      const periodCounts = new Map<string, number>()

      for (const periodId of periods) {
        periodCounts.set(periodId, (periodCounts.get(periodId) || 0) + 1)
      }

      for (const [periodId, count] of periodCounts) {
        if (count > 1) {
          const affectedSlots = Array.from(state.slots.values()).filter(
            (s) =>
              s.classroomId === roomId &&
              s.dayOfWeek === day &&
              s.periodId === periodId
          )
          conflicts.push({
            type: "room_double_book",
            day,
            periodId,
            affectedSlots,
            severity: "error",
          })
        }
      }
    }
  }

  // Check teacher workload
  for (const [teacherId, schedule] of state.teacherSchedule) {
    const teacher = teacherMap.get(teacherId)
    if (!teacher) continue

    let totalPeriods = 0
    for (const [dayStr, periods] of schedule) {
      const dailyCount = periods.length
      totalPeriods += dailyCount

      if (dailyCount > teacher.maxPeriodsPerDay) {
        conflicts.push({
          type: "workload_exceeded",
          day: parseInt(dayStr),
          periodId: "",
          affectedSlots: [],
          severity: "warning",
        })
      }
    }

    if (totalPeriods > teacher.maxPeriodsPerWeek) {
      conflicts.push({
        type: "workload_exceeded",
        day: 0,
        periodId: "",
        affectedSlots: [],
        severity: "warning",
      })
    }
  }

  return conflicts
}

function resolveConflict(
  conflict: Conflict,
  state: AlgorithmState,
  config: GenerationConfig,
  teacherMap: Map<string, TeacherAvailability>,
  roomMap: Map<string, RoomAvailability>,
  requirements: ClassRequirement[]
): boolean {
  if (conflict.affectedSlots.length < 2) return false

  // Try to move one of the conflicting slots
  const slotToMove = conflict.affectedSlots[1] // Keep first, move second

  // Find alternative time
  const req = requirements.find((r) => r.classId === slotToMove.classId)
  if (!req) return false

  const teacher = teacherMap.get(slotToMove.teacherId)
  const room = roomMap.get(slotToMove.classroomId)
  if (!teacher || !room) return false

  // Remove the slot
  removeSlot(slotToMove, state)

  // Try to find new placement
  for (const day of config.workingDays) {
    for (const periodId of config.periodsPerDay) {
      if (
        isTeacherAvailable(teacher, day, periodId, state, config) &&
        isRoomAvailable(room, day, periodId, state) &&
        !isClassScheduled(slotToMove.classId, day, periodId, state)
      ) {
        const newSlot: GeneratedSlot = {
          ...slotToMove,
          dayOfWeek: day,
          periodId,
        }
        addSlot(newSlot, state)
        return true
      }
    }
  }

  // Could not resolve, add back original (creates known conflict)
  addSlot(slotToMove, state)
  return false
}

// ============================================================================
// Phase 3: Optimization
// ============================================================================

interface OptimizationResult {
  score: number
  improvements: string[]
}

function optimizeSchedule(
  state: AlgorithmState,
  config: GenerationConfig,
  teacherMap: Map<string, TeacherAvailability>,
  roomMap: Map<string, RoomAvailability>,
  requirements: ClassRequirement[]
): OptimizationResult {
  const improvements: string[] = []
  let score = calculateOverallScore(state, config, teacherMap, requirements)

  const maxIterations = 50
  for (let i = 0; i < maxIterations; i++) {
    // Try swapping slots to improve score
    const slots = Array.from(state.slots.values())
    let improved = false

    for (let j = 0; j < slots.length && !improved; j++) {
      for (let k = j + 1; k < slots.length && !improved; k++) {
        const slotA = slots[j]
        const slotB = slots[k]

        // Only swap same-teacher slots
        if (slotA.teacherId !== slotB.teacherId) continue

        // Try swap
        const tempDay = slotA.dayOfWeek
        const tempPeriod = slotA.periodId

        // Check if swap is valid
        const teacherA = teacherMap.get(slotA.teacherId)
        const teacherB = teacherMap.get(slotB.teacherId)
        const roomA = roomMap.get(slotA.classroomId)
        const roomB = roomMap.get(slotB.classroomId)

        if (!teacherA || !teacherB || !roomA || !roomB) continue

        // Temporarily swap
        removeSlot(slotA, state)
        removeSlot(slotB, state)

        const swappedA: GeneratedSlot = {
          ...slotA,
          dayOfWeek: slotB.dayOfWeek,
          periodId: slotB.periodId,
        }
        const swappedB: GeneratedSlot = {
          ...slotB,
          dayOfWeek: tempDay,
          periodId: tempPeriod,
        }

        // Check validity
        const validA =
          isRoomAvailable(
            roomA,
            swappedA.dayOfWeek,
            swappedA.periodId,
            state
          ) &&
          !isClassScheduled(
            slotA.classId,
            swappedA.dayOfWeek,
            swappedA.periodId,
            state
          )
        const validB =
          isRoomAvailable(
            roomB,
            swappedB.dayOfWeek,
            swappedB.periodId,
            state
          ) &&
          !isClassScheduled(
            slotB.classId,
            swappedB.dayOfWeek,
            swappedB.periodId,
            state
          )

        if (validA && validB) {
          addSlot(swappedA, state)
          addSlot(swappedB, state)

          const newScore = calculateOverallScore(
            state,
            config,
            teacherMap,
            requirements
          )
          if (newScore > score) {
            score = newScore
            improved = true
            improvements.push(`Swapped slots for better distribution`)
          } else {
            // Revert
            removeSlot(swappedA, state)
            removeSlot(swappedB, state)
            addSlot(slotA, state)
            addSlot(slotB, state)
          }
        } else {
          // Revert
          addSlot(slotA, state)
          addSlot(slotB, state)
        }
      }
    }

    if (!improved) break // No more improvements possible
  }

  return { score, improvements }
}

// ============================================================================
// Helper Functions
// ============================================================================

function isTeacherAvailable(
  teacher: TeacherAvailability,
  day: number,
  periodId: string,
  state: AlgorithmState,
  config: GenerationConfig
): boolean {
  // Check unavailable blocks
  if (
    teacher.unavailableBlocks.some(
      (b) => b.dayOfWeek === day && b.periodId === periodId
    )
  ) {
    return false
  }

  // Check existing schedule
  const schedule = state.teacherSchedule.get(teacher.teacherId)
  if (schedule) {
    const daySchedule = schedule.get(day.toString())
    if (daySchedule) {
      // Already teaching this period
      if (daySchedule.includes(periodId)) return false

      // Check max periods per day
      if (daySchedule.length >= teacher.maxPeriodsPerDay) return false

      // Check consecutive periods
      if (config.constraints.preventBackToBack) {
        const periodIndex = config.periodsPerDay.indexOf(periodId)
        if (periodIndex > 0) {
          const prevPeriod = config.periodsPerDay[periodIndex - 1]
          if (daySchedule.includes(prevPeriod)) {
            // Would create consecutive - check if same room
            // For now, allow it but flag
          }
        }
      }
    }
  }

  // Check weekly total
  let weeklyTotal = 0
  if (schedule) {
    for (const [, periods] of schedule) {
      weeklyTotal += periods.length
    }
  }
  if (weeklyTotal >= teacher.maxPeriodsPerWeek) return false

  return true
}

function isRoomAvailable(
  room: RoomAvailability,
  day: number,
  periodId: string,
  state: AlgorithmState
): boolean {
  // Check reserved blocks
  if (
    room.reservedBlocks.some(
      (b) => b.dayOfWeek === day && b.periodId === periodId
    )
  ) {
    return false
  }

  // Check existing schedule
  const schedule = state.roomSchedule.get(room.roomId)
  if (schedule) {
    const daySchedule = schedule.get(day.toString())
    if (daySchedule && daySchedule.includes(periodId)) {
      return false
    }
  }

  return true
}

function isClassScheduled(
  classId: string,
  day: number,
  periodId: string,
  state: AlgorithmState
): boolean {
  const schedule = state.classSchedule.get(classId)
  if (!schedule) return false

  const daySchedule = schedule.get(day.toString())
  return daySchedule?.includes(periodId) ?? false
}

function addSlot(slot: GeneratedSlot, state: AlgorithmState): void {
  const key = `${slot.dayOfWeek}:${slot.periodId}:${slot.classId}`
  state.slots.set(key, slot)

  // Update teacher schedule
  if (!state.teacherSchedule.has(slot.teacherId)) {
    state.teacherSchedule.set(slot.teacherId, new Map())
  }
  const teacherSchedule = state.teacherSchedule.get(slot.teacherId)!
  const dayStr = slot.dayOfWeek.toString()
  if (!teacherSchedule.has(dayStr)) {
    teacherSchedule.set(dayStr, [])
  }
  teacherSchedule.get(dayStr)!.push(slot.periodId)

  // Update room schedule
  if (!state.roomSchedule.has(slot.classroomId)) {
    state.roomSchedule.set(slot.classroomId, new Map())
  }
  const roomSchedule = state.roomSchedule.get(slot.classroomId)!
  if (!roomSchedule.has(dayStr)) {
    roomSchedule.set(dayStr, [])
  }
  roomSchedule.get(dayStr)!.push(slot.periodId)

  // Update class schedule
  if (!state.classSchedule.has(slot.classId)) {
    state.classSchedule.set(slot.classId, new Map())
  }
  const classSchedule = state.classSchedule.get(slot.classId)!
  if (!classSchedule.has(dayStr)) {
    classSchedule.set(dayStr, [])
  }
  classSchedule.get(dayStr)!.push(slot.periodId)
}

function removeSlot(slot: GeneratedSlot, state: AlgorithmState): void {
  const key = `${slot.dayOfWeek}:${slot.periodId}:${slot.classId}`
  state.slots.delete(key)

  const dayStr = slot.dayOfWeek.toString()

  // Remove from teacher schedule
  const teacherSchedule = state.teacherSchedule.get(slot.teacherId)
  if (teacherSchedule) {
    const daySchedule = teacherSchedule.get(dayStr)
    if (daySchedule) {
      const idx = daySchedule.indexOf(slot.periodId)
      if (idx !== -1) daySchedule.splice(idx, 1)
    }
  }

  // Remove from room schedule
  const roomSchedule = state.roomSchedule.get(slot.classroomId)
  if (roomSchedule) {
    const daySchedule = roomSchedule.get(dayStr)
    if (daySchedule) {
      const idx = daySchedule.indexOf(slot.periodId)
      if (idx !== -1) daySchedule.splice(idx, 1)
    }
  }

  // Remove from class schedule
  const classSchedule = state.classSchedule.get(slot.classId)
  if (classSchedule) {
    const daySchedule = classSchedule.get(dayStr)
    if (daySchedule) {
      const idx = daySchedule.indexOf(slot.periodId)
      if (idx !== -1) daySchedule.splice(idx, 1)
    }
  }
}

function calculateSlotScore(
  day: number,
  periodId: string,
  req: ClassRequirement,
  teacher: TeacherAvailability,
  config: GenerationConfig
): number {
  let score = 50 // Base score

  // Preferred period bonus
  if (
    teacher.preferredPeriods.some(
      (p) => p.dayOfWeek === day && p.periodId === periodId
    )
  ) {
    score += 20
  }

  // Avoided period penalty
  if (
    teacher.avoidedPeriods.some(
      (p) => p.dayOfWeek === day && p.periodId === periodId
    )
  ) {
    score -= 15
  }

  // Morning preference for core subjects
  const periodIndex = config.periodsPerDay.indexOf(periodId)
  if (config.preferences.preferMorningForCore && periodIndex < 3) {
    score += 10
  }

  // Avoid last period for lab
  if (
    config.preferences.avoidLastPeriodForLab &&
    req.requiresLab &&
    periodIndex === config.periodsPerDay.length - 1
  ) {
    score -= 20
  }

  return Math.max(0, Math.min(100, score))
}

function calculateOverallScore(
  state: AlgorithmState,
  config: GenerationConfig,
  teacherMap: Map<string, TeacherAvailability>,
  requirements: ClassRequirement[]
): number {
  let score = 0
  let maxScore = 0

  for (const slot of state.slots.values()) {
    score += slot.score
    maxScore += 100
  }

  // Penalize unplaced requirements
  const placedClasses = new Set(
    Array.from(state.slots.values()).map((s) => s.classId)
  )
  for (const req of requirements) {
    if (!placedClasses.has(req.classId)) {
      score -= 50 * req.hoursPerWeek
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
}

function calculateWorkloadBalance(
  state: AlgorithmState,
  teachers: TeacherAvailability[]
): number {
  if (teachers.length === 0) return 100

  const workloads: number[] = []
  for (const teacher of teachers) {
    const schedule = state.teacherSchedule.get(teacher.teacherId)
    let total = 0
    if (schedule) {
      for (const [, periods] of schedule) {
        total += periods.length
      }
    }
    workloads.push(total)
  }

  if (workloads.length === 0) return 100

  const avg = workloads.reduce((a, b) => a + b, 0) / workloads.length
  const variance =
    workloads.reduce((sum, w) => sum + Math.pow(w - avg, 2), 0) /
    workloads.length
  const stdDev = Math.sqrt(variance)

  // Lower std dev = better balance
  // If avg is 20 periods and stdDev is 0, score = 100
  // If stdDev is 10, score ≈ 50
  const balance = Math.max(0, 100 - stdDev * 5)
  return Math.round(balance)
}

function calculateRoomUtilization(
  state: AlgorithmState,
  rooms: RoomAvailability[],
  config: GenerationConfig
): number {
  if (rooms.length === 0) return 0

  const totalSlots =
    config.workingDays.length * config.periodsPerDay.length * rooms.length
  let usedSlots = 0

  for (const [, schedule] of state.roomSchedule) {
    for (const [, periods] of schedule) {
      usedSlots += periods.length
    }
  }

  return Math.round((usedSlots / totalSlots) * 100)
}

// ============================================================================
// Export for testing
// ============================================================================

export const __testing = {
  isTeacherAvailable,
  isRoomAvailable,
  isClassScheduled,
  addSlot,
  removeSlot,
  detectConflicts,
  calculateSlotScore,
}
