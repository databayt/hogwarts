// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Section-Based Timetable Generation Algorithm
 *
 * Schedules by section (Grade 1-A, Grade 7-B) — each section gets a complete
 * weekly schedule with all its subjects distributed across periods.
 *
 * Three phases:
 * 1. Greedy Assignment - Fill each section's week with subjects
 * 2. Constraint Satisfaction - Resolve teacher/room conflicts
 * 3. Optimization - Balance workload and improve quality
 */

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
  enforceTeacherExpertise: boolean
  enforceRoomCapacity: boolean
  maxTeacherPeriodsPerDay: number
  maxTeacherPeriodsPerWeek: number
  maxConsecutivePeriods: number
  requireLunchBreak: boolean
  preventBackToBack: boolean
}

export interface PreferenceConfig {
  balanceSubjectDistribution: boolean
  preferMorningForCore: boolean
  avoidLastPeriodForLab: boolean
  groupSameSubjectDays: boolean
}

// --- Section-based types ---

export interface SectionRequirement {
  sectionId: string
  sectionName: string // "Grade 1-A"
  gradeId: string
  classroomId: string | null // Homeroom classroom
  studentCount: number
  subjects: SubjectAllocation[]
}

export interface SubjectAllocation {
  subjectId: string
  subjectName: string
  hoursPerWeek: number
  requiresLab: boolean
  preferredTeacherIds: string[] // Teachers qualified for this subject
}

// --- Legacy class-based types (kept for backward compat) ---

export interface ClassRequirement {
  classId: string
  className: string
  subjectId: string
  name: string
  hoursPerWeek: number
  preferredTeacherIds: string[]
  requiresLab: boolean
  yearLevelId: string
  studentCount: number
}

// --- Shared types ---

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
  sectionId: string // Section being scheduled
  subjectId: string // Subject taught
  classId: string // Legacy compat — empty for section-based
  teacherId: string | null // null = unassigned
  classroomId: string
  score: number // 0-100
  violations: string[]
}

export interface GenerationResult {
  success: boolean
  slots: GeneratedSlot[]
  stats: GenerationStats
  unplacedClasses: string[] // Section IDs with incomplete schedules
  warnings: string[]
  errors: string[]
}

export interface GenerationStats {
  totalSlots: number
  placedSlots: number
  conflictsResolved: number
  optimizationScore: number
  teacherWorkloadBalance: number
  roomUtilization: number
  generationTimeMs: number
  iterations: number
}

// ============================================================================
// Algorithm State
// ============================================================================

interface AlgorithmState {
  slots: Map<string, GeneratedSlot> // key: "day:period:section"
  teacherSchedule: Map<string, Map<string, string[]>> // teacherId -> day -> [periodIds]
  roomSchedule: Map<string, Map<string, string[]>> // roomId -> day -> [periodIds]
  sectionSchedule: Map<string, Map<string, string[]>> // sectionId -> day -> [periodIds]
  subjectCounts: Map<string, Map<string, number>> // sectionId -> subjectId -> placed count
}

// ============================================================================
// Main Generation Function (Section-Based)
// ============================================================================

export function generateSectionTimetable(
  sections: SectionRequirement[],
  teachers: TeacherAvailability[],
  rooms: RoomAvailability[],
  input: GenerationInput
): GenerationResult {
  const startTime = performance.now()
  const { config } = input

  const state: AlgorithmState = {
    slots: new Map(),
    teacherSchedule: new Map(),
    roomSchedule: new Map(),
    sectionSchedule: new Map(),
    subjectCounts: new Map(),
  }

  const warnings: string[] = []
  const errors: string[] = []
  const unplacedSections: string[] = []

  const teacherMap = new Map(teachers.map((t) => [t.teacherId, t]))
  const roomMap = new Map(rooms.map((r) => [r.roomId, r]))

  // =========================================================================
  // Phase 1: Greedy Assignment — fill each section's week
  // =========================================================================

  // Sort sections: larger sections first (more constrained)
  const sortedSections = [...sections].sort(
    (a, b) => b.studentCount - a.studentCount
  )

  for (const section of sortedSections) {
    // Sort subjects: most constrained first (fewer teachers, more hours, lab)
    const sortedSubjects = [...section.subjects].sort((a, b) => {
      const aScore =
        a.preferredTeacherIds.length * 10 +
        (a.requiresLab ? 100 : 0) +
        (10 - a.hoursPerWeek)
      const bScore =
        b.preferredTeacherIds.length * 10 +
        (b.requiresLab ? 100 : 0) +
        (10 - b.hoursPerWeek)
      return aScore - bScore
    })

    let totalNeeded = 0
    let totalPlaced = 0

    for (const subject of sortedSubjects) {
      totalNeeded += subject.hoursPerWeek
      const placed = placeSectionSubject(
        section,
        subject,
        state,
        config,
        teacherMap,
        roomMap
      )
      totalPlaced += placed

      if (placed < subject.hoursPerWeek) {
        warnings.push(
          `${section.sectionName}: placed ${placed}/${subject.hoursPerWeek} for ${subject.subjectName}`
        )
      }
    }

    if (totalPlaced < totalNeeded) {
      unplacedSections.push(section.sectionId)
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
        sections
      )
      if (resolved) conflictsResolved++
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
    sections
  )

  const slots = Array.from(state.slots.values())
  const endTime = performance.now()

  return {
    success: unplacedSections.length === 0 && errors.length === 0,
    slots,
    stats: {
      totalSlots: sections.reduce(
        (sum, s) =>
          sum + s.subjects.reduce((ss, sub) => ss + sub.hoursPerWeek, 0),
        0
      ),
      placedSlots: slots.length,
      conflictsResolved,
      optimizationScore: optimizationResult.score,
      teacherWorkloadBalance: calculateWorkloadBalance(state, teachers),
      roomUtilization: calculateRoomUtilization(state, rooms, config),
      generationTimeMs: endTime - startTime,
      iterations: maxIterations,
    },
    unplacedClasses: unplacedSections,
    warnings,
    errors,
  }
}

// Legacy wrapper — converts ClassRequirement[] to SectionRequirement[] and calls section-based
export function generateTimetable(
  requirements: ClassRequirement[],
  teachers: TeacherAvailability[],
  rooms: RoomAvailability[],
  input: GenerationInput
): GenerationResult {
  // Group by classId → create one pseudo-section per class
  const sections: SectionRequirement[] = requirements.map((req) => ({
    sectionId: req.classId, // Use classId as sectionId for legacy
    sectionName: req.className,
    gradeId: req.yearLevelId,
    classroomId: null,
    studentCount: req.studentCount,
    subjects: [
      {
        subjectId: req.subjectId,
        subjectName: req.name,
        hoursPerWeek: req.hoursPerWeek,
        requiresLab: req.requiresLab,
        preferredTeacherIds: req.preferredTeacherIds,
      },
    ],
  }))

  return generateSectionTimetable(sections, teachers, rooms, input)
}

// ============================================================================
// Phase 1: Greedy Placement (Section + Subject)
// ============================================================================

function placeSectionSubject(
  section: SectionRequirement,
  subject: SubjectAllocation,
  state: AlgorithmState,
  config: GenerationConfig,
  teacherMap: Map<string, TeacherAvailability>,
  roomMap: Map<string, RoomAvailability>
): number {
  let placedCount = 0

  // Get qualified teachers
  const qualifiedTeachers = subject.preferredTeacherIds
    .map((id) => teacherMap.get(id))
    .filter((t): t is TeacherAvailability => t !== undefined)

  // Find suitable rooms: lab for lab subjects, homeroom for regular
  const suitableRooms = getSuitableRooms(section, subject, config, roomMap)

  if (suitableRooms.length === 0) return 0

  const targetHours = subject.hoursPerWeek
  const daysToUse = selectDaysForSubject(
    subject,
    config.workingDays,
    targetHours,
    config.preferences
  )

  // Per-day cap on a (section, subject) pair.
  // Without this the period loop happily filled Mon P1-P5 with the same
  // subject before moving to Tuesday, producing schedules where a section
  // had Math (or whatever) for 5 straight periods. A maxConsecutivePeriods
  // setting is exposed in the UI (config.constraints.maxConsecutivePeriods)
  // but was never enforced. We treat it as the per-day cap here, falling
  // back to ceil(hoursPerWeek / daysToUse) so distribution is roughly even
  // (e.g. 5 hours over 5 days → 1/day; 6 hours over 4 days → 2/day).
  const daysAvailable = Math.max(1, daysToUse.length)
  const evenSpread = Math.max(1, Math.ceil(targetHours / daysAvailable))
  const cap = config.constraints.maxConsecutivePeriods
    ? Math.max(
        evenSpread,
        Math.min(targetHours, config.constraints.maxConsecutivePeriods)
      )
    : Math.max(evenSpread, 2)

  for (const day of daysToUse) {
    if (placedCount >= targetHours) break
    let placedThisDay = 0

    for (const periodId of config.periodsPerDay) {
      if (placedCount >= targetHours) break
      if (placedThisDay >= cap) break

      // Section can't be double-booked
      if (isSectionScheduled(section.sectionId, day, periodId, state)) continue

      // Try to find a teacher
      let assignedTeacher: TeacherAvailability | null = null
      for (const teacher of qualifiedTeachers) {
        if (!isTeacherAvailable(teacher, day, periodId, state, config)) continue
        assignedTeacher = teacher
        break
      }

      // Find an available room
      let assignedRoom: RoomAvailability | null = null
      for (const room of suitableRooms) {
        if (!isRoomAvailable(room, day, periodId, state)) continue
        assignedRoom = room
        break
      }

      if (!assignedRoom) continue

      const slot: GeneratedSlot = {
        dayOfWeek: day,
        periodId,
        sectionId: section.sectionId,
        subjectId: subject.subjectId,
        classId: "", // Section-based, no legacy classId
        teacherId: assignedTeacher?.teacherId ?? null,
        classroomId: assignedRoom.roomId,
        score: assignedTeacher
          ? calculateSlotScore(day, periodId, subject, assignedTeacher, config)
          : 30,
        violations: assignedTeacher ? [] : ["unassigned_teacher"],
      }

      addSlot(slot, state)
      placedCount++
      placedThisDay++
    }
  }

  return placedCount
}

function getSuitableRooms(
  section: SectionRequirement,
  subject: SubjectAllocation,
  config: GenerationConfig,
  roomMap: Map<string, RoomAvailability>
): RoomAvailability[] {
  const rooms: RoomAvailability[] = []

  // For lab subjects, find lab rooms
  if (subject.requiresLab) {
    for (const room of roomMap.values()) {
      if (room.roomType !== "lab") continue
      if (
        config.constraints.enforceRoomCapacity &&
        room.capacity < section.studentCount
      )
        continue
      rooms.push(room)
    }
    return rooms
  }

  // For regular subjects, prefer the section's homeroom first
  if (section.classroomId) {
    const homeroom = roomMap.get(section.classroomId)
    if (homeroom) rooms.push(homeroom)
  }

  // Add other regular rooms as fallback
  for (const room of roomMap.values()) {
    if (room.roomId === section.classroomId) continue // Already added
    if (room.roomType === "lab") continue // Labs only for lab subjects
    if (
      config.constraints.enforceRoomCapacity &&
      room.capacity < section.studentCount
    )
      continue
    if (room.allowedSubjectTypes.length > 0) {
      const subjectLower = subject.subjectName.toLowerCase()
      const isAllowed = room.allowedSubjectTypes.some(
        (t) =>
          subjectLower.includes(t.toLowerCase()) ||
          t.toLowerCase().includes(subjectLower)
      )
      if (!isAllowed) continue
    }
    rooms.push(room)
  }

  return rooms
}

function selectDaysForSubject(
  subject: SubjectAllocation,
  workingDays: number[],
  hoursNeeded: number,
  preferences: PreferenceConfig
): number[] {
  const days: number[] = []

  if (preferences.groupSameSubjectDays && hoursNeeded >= 2) {
    const alternating = workingDays.filter((_, i) => i % 2 === 0)
    days.push(...alternating)
    if (days.length < hoursNeeded) {
      const remaining = workingDays.filter((d) => !days.includes(d))
      days.push(...remaining)
    }
  } else {
    days.push(...workingDays)
  }

  return days.slice(0, Math.ceil(hoursNeeded * 1.5))
}

// ============================================================================
// Phase 2: Conflict Detection & Resolution
// ============================================================================

interface Conflict {
  type:
    | "teacher_double_book"
    | "room_double_book"
    | "section_double_book"
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

  // Teacher double-booking
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

  // Room double-booking
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

  // Teacher workload
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
  sections: SectionRequirement[]
): boolean {
  if (conflict.affectedSlots.length < 2) return false

  const slotToMove = conflict.affectedSlots[1]

  const teacher = slotToMove.teacherId
    ? teacherMap.get(slotToMove.teacherId)
    : null
  const room = roomMap.get(slotToMove.classroomId)
  if (!room) return false

  removeSlot(slotToMove, state)

  for (const day of config.workingDays) {
    for (const periodId of config.periodsPerDay) {
      if (isSectionScheduled(slotToMove.sectionId, day, periodId, state))
        continue
      if (teacher && !isTeacherAvailable(teacher, day, periodId, state, config))
        continue
      if (!teacher && slotToMove.teacherId) continue // Had a teacher, keep looking
      if (!isRoomAvailable(room, day, periodId, state)) continue

      const newSlot: GeneratedSlot = {
        ...slotToMove,
        dayOfWeek: day,
        periodId,
      }
      addSlot(newSlot, state)
      return true
    }
  }

  // Could not resolve — add back
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
  sections: SectionRequirement[]
): OptimizationResult {
  const improvements: string[] = []
  let score = calculateOverallScore(state, config, teacherMap, sections)

  const maxIterations = 50
  for (let i = 0; i < maxIterations; i++) {
    const slots = Array.from(state.slots.values())
    let improved = false

    for (let j = 0; j < slots.length && !improved; j++) {
      for (let k = j + 1; k < slots.length && !improved; k++) {
        const slotA = slots[j]
        const slotB = slots[k]

        // Only swap if same teacher and assigned
        if (!slotA.teacherId || !slotB.teacherId) continue
        if (slotA.teacherId !== slotB.teacherId) continue

        const tempDay = slotA.dayOfWeek
        const tempPeriod = slotA.periodId

        const roomA = roomMap.get(slotA.classroomId)
        const roomB = roomMap.get(slotB.classroomId)
        if (!roomA || !roomB) continue

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

        const validA =
          isRoomAvailable(
            roomA,
            swappedA.dayOfWeek,
            swappedA.periodId,
            state
          ) &&
          !isSectionScheduled(
            slotA.sectionId,
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
          !isSectionScheduled(
            slotB.sectionId,
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
            sections
          )
          if (newScore > score) {
            score = newScore
            improved = true
            improvements.push("Swapped slots for better distribution")
          } else {
            removeSlot(swappedA, state)
            removeSlot(swappedB, state)
            addSlot(slotA, state)
            addSlot(slotB, state)
          }
        } else {
          addSlot(slotA, state)
          addSlot(slotB, state)
        }
      }
    }

    if (!improved) break
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
  if (
    teacher.unavailableBlocks.some(
      (b) => b.dayOfWeek === day && b.periodId === periodId
    )
  ) {
    return false
  }

  const schedule = state.teacherSchedule.get(teacher.teacherId)
  if (schedule) {
    const daySchedule = schedule.get(day.toString())
    if (daySchedule) {
      if (daySchedule.includes(periodId)) return false
      if (daySchedule.length >= teacher.maxPeriodsPerDay) return false

      if (config.constraints.preventBackToBack) {
        const periodIndex = config.periodsPerDay.indexOf(periodId)
        if (periodIndex > 0) {
          const prevPeriod = config.periodsPerDay[periodIndex - 1]
          if (daySchedule.includes(prevPeriod)) return false
        }
      }
    }
  }

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
  if (
    room.reservedBlocks.some(
      (b) => b.dayOfWeek === day && b.periodId === periodId
    )
  ) {
    return false
  }

  const schedule = state.roomSchedule.get(room.roomId)
  if (schedule) {
    const daySchedule = schedule.get(day.toString())
    if (daySchedule && daySchedule.includes(periodId)) return false
  }

  return true
}

function isSectionScheduled(
  sectionId: string,
  day: number,
  periodId: string,
  state: AlgorithmState
): boolean {
  const schedule = state.sectionSchedule.get(sectionId)
  if (!schedule) return false
  const daySchedule = schedule.get(day.toString())
  return daySchedule?.includes(periodId) ?? false
}

// Legacy compat
function isClassScheduled(
  classId: string,
  day: number,
  periodId: string,
  state: AlgorithmState
): boolean {
  return isSectionScheduled(classId, day, periodId, state)
}

function addSlot(slot: GeneratedSlot, state: AlgorithmState): void {
  const key = `${slot.dayOfWeek}:${slot.periodId}:${slot.sectionId}`
  state.slots.set(key, slot)

  const dayStr = slot.dayOfWeek.toString()

  // Update teacher schedule
  if (slot.teacherId) {
    if (!state.teacherSchedule.has(slot.teacherId)) {
      state.teacherSchedule.set(slot.teacherId, new Map())
    }
    const teacherSchedule = state.teacherSchedule.get(slot.teacherId)!
    if (!teacherSchedule.has(dayStr)) {
      teacherSchedule.set(dayStr, [])
    }
    teacherSchedule.get(dayStr)!.push(slot.periodId)
  }

  // Update room schedule
  if (!state.roomSchedule.has(slot.classroomId)) {
    state.roomSchedule.set(slot.classroomId, new Map())
  }
  const roomSchedule = state.roomSchedule.get(slot.classroomId)!
  if (!roomSchedule.has(dayStr)) {
    roomSchedule.set(dayStr, [])
  }
  roomSchedule.get(dayStr)!.push(slot.periodId)

  // Update section schedule
  if (!state.sectionSchedule.has(slot.sectionId)) {
    state.sectionSchedule.set(slot.sectionId, new Map())
  }
  const sectionSchedule = state.sectionSchedule.get(slot.sectionId)!
  if (!sectionSchedule.has(dayStr)) {
    sectionSchedule.set(dayStr, [])
  }
  sectionSchedule.get(dayStr)!.push(slot.periodId)

  // Track subject counts per section
  if (!state.subjectCounts.has(slot.sectionId)) {
    state.subjectCounts.set(slot.sectionId, new Map())
  }
  const sectionSubjects = state.subjectCounts.get(slot.sectionId)!
  sectionSubjects.set(
    slot.subjectId,
    (sectionSubjects.get(slot.subjectId) || 0) + 1
  )
}

function removeSlot(slot: GeneratedSlot, state: AlgorithmState): void {
  const key = `${slot.dayOfWeek}:${slot.periodId}:${slot.sectionId}`
  state.slots.delete(key)

  const dayStr = slot.dayOfWeek.toString()

  if (slot.teacherId) {
    const teacherSchedule = state.teacherSchedule.get(slot.teacherId)
    if (teacherSchedule) {
      const daySchedule = teacherSchedule.get(dayStr)
      if (daySchedule) {
        const idx = daySchedule.indexOf(slot.periodId)
        if (idx !== -1) daySchedule.splice(idx, 1)
      }
    }
  }

  const roomSchedule = state.roomSchedule.get(slot.classroomId)
  if (roomSchedule) {
    const daySchedule = roomSchedule.get(dayStr)
    if (daySchedule) {
      const idx = daySchedule.indexOf(slot.periodId)
      if (idx !== -1) daySchedule.splice(idx, 1)
    }
  }

  const sectionSchedule = state.sectionSchedule.get(slot.sectionId)
  if (sectionSchedule) {
    const daySchedule = sectionSchedule.get(dayStr)
    if (daySchedule) {
      const idx = daySchedule.indexOf(slot.periodId)
      if (idx !== -1) daySchedule.splice(idx, 1)
    }
  }

  // Decrement subject count
  const sectionSubjects = state.subjectCounts.get(slot.sectionId)
  if (sectionSubjects) {
    const count = sectionSubjects.get(slot.subjectId) || 0
    if (count > 1) {
      sectionSubjects.set(slot.subjectId, count - 1)
    } else {
      sectionSubjects.delete(slot.subjectId)
    }
  }
}

function calculateSlotScore(
  day: number,
  periodId: string,
  subject: SubjectAllocation,
  teacher: TeacherAvailability,
  config: GenerationConfig
): number {
  let score = 50

  if (
    teacher.preferredPeriods.some(
      (p) => p.dayOfWeek === day && p.periodId === periodId
    )
  ) {
    score += 20
  }

  if (
    teacher.avoidedPeriods.some(
      (p) => p.dayOfWeek === day && p.periodId === periodId
    )
  ) {
    score -= 15
  }

  const periodIndex = config.periodsPerDay.indexOf(periodId)
  if (config.preferences.preferMorningForCore && periodIndex < 3) {
    score += 10
  }

  if (
    config.preferences.avoidLastPeriodForLab &&
    subject.requiresLab &&
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
  sections: SectionRequirement[]
): number {
  let score = 0
  let maxScore = 0

  for (const slot of state.slots.values()) {
    score += slot.score
    maxScore += 100
  }

  // Penalize sections with incomplete schedules
  for (const section of sections) {
    const totalNeeded = section.subjects.reduce(
      (s, sub) => s + sub.hoursPerWeek,
      0
    )
    const sectionSubjects = state.subjectCounts.get(section.sectionId)
    const totalPlaced = sectionSubjects
      ? Array.from(sectionSubjects.values()).reduce((s, c) => s + c, 0)
      : 0

    if (totalPlaced < totalNeeded) {
      score -= 50 * (totalNeeded - totalPlaced)
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
  isSectionScheduled,
  isClassScheduled,
  addSlot,
  removeSlot,
  detectConflicts,
  calculateSlotScore,
}
