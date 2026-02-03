/**
 * Enhanced Timetable Seeding Utilities
 * Generates realistic timetable data with proper subject distribution,
 * teacher allocation, and intentional conflicts for testing
 */

// ============================================================================
// Subject Distribution Configuration
// ============================================================================

/**
 * Defines how many periods per week each subject should have
 */
export const SUBJECT_DISTRIBUTION = {
  // Core subjects (high frequency)
  Mathematics: 5,
  English: 5,
  Arabic: 4,
  Science: 4,

  // Secondary subjects (medium frequency)
  History: 3,
  Geography: 3,
  Physics: 3,
  Chemistry: 3,
  Biology: 3,

  // Specialized subjects (low frequency)
  "Physical Education": 2,
  Art: 2,
  Music: 2,
  "Computer Science": 2,
  "Religious Studies": 2,

  // Once-a-week subjects
  Library: 1,
  "Life Skills": 1,
  Assembly: 1,
} as const

/**
 * Teacher specializations - which subjects each teacher can teach
 */
export const TEACHER_SPECIALIZATIONS = {
  // Math/Science teachers
  mathTeacher: ["Mathematics", "Physics"],
  scienceTeacher: ["Science", "Chemistry", "Biology"],

  // Language teachers
  englishTeacher: ["English", "Library"],
  arabicTeacher: ["Arabic", "Religious Studies"],

  // Social studies teachers
  historyTeacher: ["History", "Geography", "Life Skills"],

  // Specialist teachers
  peTeacher: ["Physical Education"],
  artTeacher: ["Art", "Music"],
  computerTeacher: ["Computer Science"],
} as const

// ============================================================================
// Timetable Generation Functions
// ============================================================================

interface TimetableSlot {
  schoolId: string
  termId: string
  dayOfWeek: number
  periodId: string
  classId: string
  teacherId: string
  classroomId: string
  weekOffset: number
}

interface GenerateTimetableOptions {
  schoolId: string
  termId: string
  classes: Array<{
    id: string
    name: string
    teacherId: string
    classroomId: string
  }>
  periods: Array<{ id: string }>
  teachers: Array<{
    id: string
    specialization: keyof typeof TEACHER_SPECIALIZATIONS
  }>
  workingDays: number[]
  includeConflicts?: boolean
  includeNextWeek?: boolean
}

/**
 * Generates a realistic timetable with proper subject distribution
 */
export function generateRealisticTimetable(
  options: GenerateTimetableOptions
): TimetableSlot[] {
  const {
    schoolId,
    termId,
    classes,
    periods,
    teachers,
    workingDays,
    includeConflicts = false,
    includeNextWeek = false,
  } = options

  const timetableSlots: TimetableSlot[] = []
  const teacherSchedule = new Map<string, Set<string>>() // teacherId -> Set of "day:period"
  const roomSchedule = new Map<string, Set<string>>() // roomId -> Set of "day:period"

  // Track subject allocation per class
  const classSubjectCount = new Map<string, Map<string, number>>()

  // Initialize tracking
  classes.forEach((cls) => {
    classSubjectCount.set(cls.id, new Map())
  })

  teachers.forEach((teacher) => {
    teacherSchedule.set(teacher.id, new Set())
  })

  // Generate timetable for each class
  for (const cls of classes) {
    const subjectCount = classSubjectCount.get(cls.id)!

    // Distribute subjects across the week
    for (const day of workingDays) {
      for (const period of periods) {
        const slotKey = `${day}:${period.id}`

        // Select appropriate subject based on distribution
        const subject = selectSubjectForSlot(
          subjectCount,
          day,
          periods.indexOf(period)
        )

        // Find available teacher for this subject
        const teacher = findAvailableTeacher(
          teachers,
          subject,
          teacherSchedule,
          slotKey,
          includeConflicts
        )

        if (!teacher) continue // Skip if no teacher available

        // Check room availability (unless we want conflicts)
        const room = findAvailableRoom(
          cls.classroomId,
          roomSchedule,
          slotKey,
          includeConflicts
        )

        // Create timetable slot
        const slot: TimetableSlot = {
          schoolId,
          termId,
          dayOfWeek: day,
          periodId: period.id,
          classId: cls.id,
          teacherId: teacher.id,
          classroomId: room,
          weekOffset: 0,
        }

        timetableSlots.push(slot)

        // Update tracking
        subjectCount.set(subject, (subjectCount.get(subject) || 0) + 1)
        teacherSchedule.get(teacher.id)!.add(slotKey)
        roomSchedule.has(room)
          ? roomSchedule.get(room)!.add(slotKey)
          : roomSchedule.set(room, new Set([slotKey]))

        // Generate next week data if requested
        if (includeNextWeek) {
          timetableSlots.push({ ...slot, weekOffset: 1 })
        }
      }
    }
  }

  // Add intentional conflicts if requested (for testing)
  if (includeConflicts) {
    timetableSlots.push(...generateConflictSlots(options))
  }

  return timetableSlots
}

/**
 * Selects an appropriate subject for a time slot based on distribution rules
 */
function selectSubjectForSlot(
  subjectCount: Map<string, number>,
  day: number,
  periodIndex: number
): string {
  // Special handling for first period Monday (Assembly)
  if (day === 1 && periodIndex === 0) {
    return "Assembly"
  }

  // Find subjects that haven't reached their weekly limit
  const availableSubjects = Object.entries(SUBJECT_DISTRIBUTION)
    .filter(([subject, maxCount]) => {
      const currentCount = subjectCount.get(subject) || 0
      return currentCount < maxCount
    })
    .map(([subject]) => subject)

  if (availableSubjects.length === 0) {
    // All subjects at capacity, return a core subject
    return "Mathematics"
  }

  // Prioritize core subjects in morning periods
  if (periodIndex < 3) {
    const coreSubjects = availableSubjects.filter((s) =>
      ["Mathematics", "English", "Arabic", "Science"].includes(s)
    )
    if (coreSubjects.length > 0) {
      return coreSubjects[Math.floor(Math.random() * coreSubjects.length)]
    }
  }

  // PE typically after lunch
  if (periodIndex > 4 && availableSubjects.includes("Physical Education")) {
    return "Physical Education"
  }

  // Random selection from available subjects
  return availableSubjects[Math.floor(Math.random() * availableSubjects.length)]
}

/**
 * Finds an available teacher who can teach the subject
 */
function findAvailableTeacher(
  teachers: Array<{
    id: string
    specialization: keyof typeof TEACHER_SPECIALIZATIONS
  }>,
  subject: string,
  teacherSchedule: Map<string, Set<string>>,
  slotKey: string,
  allowConflicts: boolean
): { id: string; specialization: keyof typeof TEACHER_SPECIALIZATIONS } | null {
  // Find teachers who can teach this subject
  const qualifiedTeachers = teachers.filter((teacher) => {
    const specializations = TEACHER_SPECIALIZATIONS[teacher.specialization]
    return (specializations as readonly string[]).includes(subject)
  })

  if (qualifiedTeachers.length === 0) {
    // No qualified teacher, use any teacher (for flexibility)
    qualifiedTeachers.push(...teachers)
  }

  // Find available teacher
  for (const teacher of qualifiedTeachers) {
    const schedule = teacherSchedule.get(teacher.id)!
    if (!schedule.has(slotKey) || allowConflicts) {
      return teacher
    }
  }

  return null
}

/**
 * Finds an available room
 */
function findAvailableRoom(
  preferredRoom: string,
  roomSchedule: Map<string, Set<string>>,
  slotKey: string,
  allowConflicts: boolean
): string {
  const schedule = roomSchedule.get(preferredRoom)
  if (!schedule || !schedule.has(slotKey) || allowConflicts) {
    return preferredRoom
  }

  // Room is occupied, find alternative (in reality, would search other rooms)
  return `${preferredRoom}_alt`
}

/**
 * Generates intentional conflict slots for testing
 */
function generateConflictSlots(
  options: GenerateTimetableOptions
): TimetableSlot[] {
  const { schoolId, termId, classes, periods, teachers, workingDays } = options
  const conflicts: TimetableSlot[] = []

  if (classes.length < 2 || teachers.length < 1 || periods.length < 1) {
    return conflicts
  }

  // Teacher conflict: Same teacher, same time, different classes
  const teacher = teachers[0]
  const day = workingDays[0]
  const period = periods[0]

  conflicts.push({
    schoolId,
    termId,
    dayOfWeek: day,
    periodId: period.id,
    classId: classes[0].id,
    teacherId: teacher.id,
    classroomId: classes[0].classroomId,
    weekOffset: 0,
  })

  conflicts.push({
    schoolId,
    termId,
    dayOfWeek: day,
    periodId: period.id,
    classId: classes[1].id,
    teacherId: teacher.id, // CONFLICT: Same teacher
    classroomId: classes[1].classroomId,
    weekOffset: 0,
  })

  // Room conflict: Same room, same time, different classes
  if (periods.length > 1) {
    const period2 = periods[1]
    const room = classes[0].classroomId

    conflicts.push({
      schoolId,
      termId,
      dayOfWeek: day,
      periodId: period2.id,
      classId: classes[0].id,
      teacherId: classes[0].teacherId,
      classroomId: room,
      weekOffset: 0,
    })

    conflicts.push({
      schoolId,
      termId,
      dayOfWeek: day,
      periodId: period2.id,
      classId: classes[1].id,
      teacherId: classes[1].teacherId,
      classroomId: room, // CONFLICT: Same room
      weekOffset: 0,
    })
  }

  return conflicts
}

// ============================================================================
// School Configuration Variations
// ============================================================================

/**
 * Different school configurations for testing
 */
export const SCHOOL_CONFIGS = {
  arabicSchool: {
    workingDays: [0, 1, 2, 3, 4], // Sunday to Thursday
    defaultLunchAfterPeriod: 4,
    startTime: "08:00",
    endTime: "14:00",
  },
  westernSchool: {
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    defaultLunchAfterPeriod: 3,
    startTime: "08:30",
    endTime: "15:30",
  },
  saturdaySchool: {
    workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    defaultLunchAfterPeriod: 4,
    startTime: "07:30",
    endTime: "13:30",
  },
} as const

// ============================================================================
// Seed Data Helpers
// ============================================================================

/**
 * Creates sample teacher data with specializations
 */
export function createSampleTeachers(schoolId: string, count: number = 10) {
  const specializations = Object.keys(TEACHER_SPECIALIZATIONS) as Array<
    keyof typeof TEACHER_SPECIALIZATIONS
  >
  const teachers = []

  for (let i = 0; i < count; i++) {
    const specialization = specializations[i % specializations.length]
    teachers.push({
      id: `teacher_${i + 1}`,
      schoolId,
      givenName: `Teacher`,
      surname: `${i + 1}`,
      email: `teacher${i + 1}@school.edu`,
      specialization,
    })
  }

  return teachers
}

/**
 * Creates sample classroom data
 */
export function createSampleClassrooms(schoolId: string, count: number = 15) {
  const classrooms = []
  const types = ["Regular", "Lab", "Computer", "Art", "Music", "Gym"]

  for (let i = 0; i < count; i++) {
    classrooms.push({
      id: `room_${i + 1}`,
      schoolId,
      roomName: `Room ${i + 1}`,
      roomType: types[i % types.length],
      capacity: 30 + Math.floor(Math.random() * 20),
    })
  }

  return classrooms
}

/**
 * Creates sample period data for a school day
 */
export function createSamplePeriods(
  schoolId: string,
  yearId: string,
  startTime: string = "08:00",
  periodDuration: number = 45,
  periodCount: number = 8
) {
  const periods = []
  let currentTime = new Date(`2024-01-01T${startTime}:00`)

  for (let i = 0; i < periodCount; i++) {
    const startPeriod = new Date(currentTime)
    const endPeriod = new Date(currentTime.getTime() + periodDuration * 60000)

    periods.push({
      id: `period_${i + 1}`,
      schoolId,
      yearId,
      name: `Period ${i + 1}`,
      startTime: startPeriod.toISOString(),
      endTime: endPeriod.toISOString(),
    })

    // Add break after certain periods
    if (i === 2) {
      // Morning break
      currentTime = new Date(endPeriod.getTime() + 15 * 60000)
    } else if (i === 4) {
      // Lunch break
      currentTime = new Date(endPeriod.getTime() + 30 * 60000)
    } else {
      // Regular transition
      currentTime = new Date(endPeriod.getTime() + 5 * 60000)
    }
  }

  return periods
}
