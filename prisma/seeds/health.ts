/**
 * Health Seed
 * Creates Health Records, Disciplinary Records, and Achievements
 *
 * Phase 16: Compliance (Student Wellness)
 *
 * Features:
 * - 50+ health records (vaccinations, checkups, incidents)
 * - 20+ disciplinary records
 * - 30+ achievements
 */

import type { PrismaClient } from "@prisma/client"

import type { StudentRef, TeacherRef, UserRef } from "./types"
import {
  logPhase,
  logSuccess,
  processBatch,
  randomElement,
  randomNumber,
} from "./utils"

// ============================================================================
// HEALTH RECORD DATA
// ============================================================================

const HEALTH_RECORD_TYPES = [
  {
    type: "Vaccination",
    titles: [
      "Annual Flu Vaccination",
      "COVID-19 Booster",
      "Hepatitis B Vaccination",
      "MMR Vaccination",
      "Tetanus Booster",
    ],
    descriptions: [
      "Routine vaccination administered at school health center",
      "Scheduled vaccination completed successfully",
      "Vaccination as per school health policy",
    ],
    severity: null,
    weight: 25,
  },
  {
    type: "Medical Check-up",
    titles: [
      "Annual Health Screening",
      "Vision Test",
      "Hearing Test",
      "Dental Check-up",
      "Physical Fitness Assessment",
    ],
    descriptions: [
      "Routine annual health examination completed",
      "Comprehensive health screening performed",
      "Standard medical check-up as per school requirements",
    ],
    severity: null,
    weight: 30,
  },
  {
    type: "Incident",
    titles: [
      "Playground Injury",
      "Sports Injury",
      "Minor Fall",
      "Classroom Accident",
      "Laboratory Incident",
    ],
    descriptions: [
      "Student treated at school clinic for minor injury",
      "First aid administered immediately after incident",
      "Incident occurred during school activities, treated on-school-marketing",
    ],
    severity: ["Low", "Medium"],
    weight: 15,
  },
  {
    type: "Illness",
    titles: [
      "Fever and Flu Symptoms",
      "Stomach Upset",
      "Headache",
      "Allergic Reaction",
      "Respiratory Infection",
    ],
    descriptions: [
      "Student reported symptoms, sent home for rest",
      "Treated at school clinic, parent notified",
      "Medication administered as per parental consent form",
    ],
    severity: ["Low", "Medium", "High"],
    weight: 20,
  },
  {
    type: "Allergy Update",
    titles: [
      "Food Allergy Documentation",
      "Medication Allergy Update",
      "Environmental Allergy Record",
      "Allergy Emergency Plan Update",
    ],
    descriptions: [
      "Allergy information updated in student health file",
      "New allergy documented per parent notification",
      "Emergency action plan revised for allergy management",
    ],
    severity: null,
    weight: 10,
  },
]

const DOCTORS = [
  "Dr. Ahmed Hassan",
  "Dr. Fatima Mohamed",
  "Dr. Omar Ali",
  "Dr. Amina Ibrahim",
  "Dr. Khalid Osman",
]

const HOSPITALS = [
  "Khartoum Teaching Hospital",
  "Soba University Hospital",
  "Ahmed Gasim Hospital",
  "Fedail Hospital",
  "Modern Medical Center",
]

// ============================================================================
// DISCIPLINARY RECORD DATA
// ============================================================================

const DISCIPLINARY_TYPES = [
  {
    type: "Warning",
    severity: "Minor",
    descriptions: [
      "Verbal warning issued for classroom disruption",
      "Written warning for late submission of assignments",
      "Warning for improper uniform compliance",
      "Caution issued for minor rule violation",
    ],
    actions: [
      "Verbal counseling provided",
      "Warning letter placed in student file",
      "Parent notified via message",
    ],
    weight: 40,
  },
  {
    type: "Detention",
    severity: "Minor",
    descriptions: [
      "Detention for repeated tardiness",
      "After-school detention for incomplete homework",
      "Lunch detention for classroom disturbance",
    ],
    actions: [
      "One hour after-school detention assigned",
      "Lunch detention for three days",
      "Weekend detention with supervised study",
    ],
    weight: 30,
  },
  {
    type: "Parent Conference",
    severity: "Major",
    descriptions: [
      "Conference required for academic concerns",
      "Parent meeting scheduled for behavioral issues",
      "Mandatory consultation regarding student conduct",
    ],
    actions: [
      "Parent conference scheduled and completed",
      "Behavior improvement plan established",
      "Academic support plan implemented",
    ],
    weight: 15,
  },
  {
    type: "Suspension",
    severity: "Severe",
    descriptions: [
      "Short suspension for physical altercation",
      "Suspension for serious rule violation",
      "Temporary removal for disruptive behavior",
    ],
    actions: [
      "Three-day suspension implemented",
      "One-week suspension with makeup work required",
      "Suspension with mandatory counseling upon return",
    ],
    weight: 10,
  },
  {
    type: "Community Service",
    severity: "Major",
    descriptions: [
      "Community service assigned for property damage",
      "Service hours for vandalism incident",
      "School community service for behavioral improvement",
    ],
    actions: [
      "Ten hours of school community service assigned",
      "Supervised service work within school grounds",
      "Community service with written reflection",
    ],
    weight: 5,
  },
]

// ============================================================================
// ACHIEVEMENT DATA
// ============================================================================

const ACHIEVEMENT_CATEGORIES = [
  {
    category: "Academic",
    titles: [
      "Honor Roll Achievement",
      "Academic Excellence Award",
      "Subject Topper - Mathematics",
      "Subject Topper - Science",
      "Most Improved Student",
      "Perfect Attendance Award",
    ],
    descriptions: [
      "Recognized for outstanding academic performance",
      "Achieved top marks in class assessments",
      "Demonstrated exceptional dedication to studies",
    ],
    levels: ["School", "District"],
    positions: ["1st Place", "2nd Place", "3rd Place", "Merit"],
    weight: 30,
  },
  {
    category: "Sports",
    titles: [
      "Football Tournament Champion",
      "Athletics Competition Winner",
      "Swimming Championship",
      "Basketball Tournament MVP",
      "Sports Day Overall Winner",
      "Best Athlete of the Year",
    ],
    descriptions: [
      "Exceptional performance in inter-school sports",
      "Led team to victory in championship",
      "Outstanding athletic achievement",
    ],
    levels: ["School", "District", "State"],
    positions: ["1st Place", "2nd Place", "3rd Place", "Participant"],
    weight: 25,
  },
  {
    category: "Arts",
    titles: [
      "Art Competition Winner",
      "Calligraphy Excellence Award",
      "Music Performance Award",
      "Drama Performance Recognition",
      "Creative Writing Award",
    ],
    descriptions: [
      "Recognized for artistic talent and creativity",
      "Outstanding contribution to school arts program",
      "Exceptional performance in arts competition",
    ],
    levels: ["School", "District"],
    positions: ["Winner", "Runner-up", "Honorable Mention"],
    weight: 15,
  },
  {
    category: "Leadership",
    titles: [
      "Student Council President",
      "Class Representative",
      "Prefect of the Year",
      "Team Captain Recognition",
      "Peer Mentor Award",
    ],
    descriptions: [
      "Demonstrated exceptional leadership qualities",
      "Successfully led student initiatives",
      "Recognized for outstanding leadership and service",
    ],
    levels: ["School"],
    positions: ["Elected", "Appointed", "Recognition"],
    weight: 15,
  },
  {
    category: "Community Service",
    titles: [
      "Community Service Excellence",
      "Volunteer of the Year",
      "Environmental Champion",
      "Charity Drive Leader",
      "School Ambassador",
    ],
    descriptions: [
      "Outstanding contribution to community projects",
      "Led successful community service initiatives",
      "Demonstrated commitment to social responsibility",
    ],
    levels: ["School", "District"],
    positions: ["Recognition", "Award"],
    weight: 15,
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a random health record type based on weights
 */
function getRandomHealthRecordType(): (typeof HEALTH_RECORD_TYPES)[0] {
  const totalWeight = HEALTH_RECORD_TYPES.reduce((sum, t) => sum + t.weight, 0)
  let random = Math.random() * totalWeight

  for (const type of HEALTH_RECORD_TYPES) {
    random -= type.weight
    if (random <= 0) return type
  }
  return HEALTH_RECORD_TYPES[0]
}

/**
 * Get a random disciplinary type based on weights
 */
function getRandomDisciplinaryType(): (typeof DISCIPLINARY_TYPES)[0] {
  const totalWeight = DISCIPLINARY_TYPES.reduce((sum, t) => sum + t.weight, 0)
  let random = Math.random() * totalWeight

  for (const type of DISCIPLINARY_TYPES) {
    random -= type.weight
    if (random <= 0) return type
  }
  return DISCIPLINARY_TYPES[0]
}

/**
 * Get a random achievement category based on weights
 */
function getRandomAchievementCategory(): (typeof ACHIEVEMENT_CATEGORIES)[0] {
  const totalWeight = ACHIEVEMENT_CATEGORIES.reduce(
    (sum, t) => sum + t.weight,
    0
  )
  let random = Math.random() * totalWeight

  for (const cat of ACHIEVEMENT_CATEGORIES) {
    random -= cat.weight
    if (random <= 0) return cat
  }
  return ACHIEVEMENT_CATEGORIES[0]
}

/**
 * Generate a random date within the last N days
 */
function getRandomPastDate(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - randomNumber(1, daysAgo))
  date.setHours(randomNumber(8, 16), randomNumber(0, 59), 0, 0)
  return date
}

// ============================================================================
// HEALTH RECORDS SEEDING
// ============================================================================

/**
 * Seed health records
 * Target: 50+ records
 */
export async function seedHealthRecords(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  adminUsers: UserRef[]
): Promise<number> {
  let healthCount = 0

  if (students.length === 0) {
    logSuccess("Health Records", 0, "no students available")
    return 0
  }

  const targetCount = 55
  const recordsToCreate: Array<{
    studentId: string
    type: (typeof HEALTH_RECORD_TYPES)[0]
    date: Date
  }> = []

  // Distribute health records across students
  for (let i = 0; i < targetCount; i++) {
    const student = randomElement(students)
    const recordType = getRandomHealthRecordType()

    recordsToCreate.push({
      studentId: student.id,
      type: recordType,
      date: getRandomPastDate(365), // Past year
    })
  }

  // Sort by date
  recordsToCreate.sort((a, b) => a.date.getTime() - b.date.getTime())

  const recordedBy = adminUsers[0]?.id || "system"

  await processBatch(recordsToCreate, 25, async (record) => {
    try {
      const title = randomElement(record.type.titles)
      const description = randomElement(record.type.descriptions)
      const severity = record.type.severity
        ? randomElement(record.type.severity as string[])
        : null

      await prisma.healthRecord.create({
        data: {
          schoolId,
          studentId: record.studentId,
          recordDate: record.date,
          recordType: record.type.type,
          title,
          description,
          severity,
          doctorName:
            record.type.type === "Medical Check-up" ||
            record.type.type === "Illness"
              ? randomElement(DOCTORS)
              : null,
          hospitalName:
            record.type.type === "Incident" && Math.random() < 0.3
              ? randomElement(HOSPITALS)
              : null,
          prescription:
            record.type.type === "Illness" && Math.random() < 0.6
              ? "Rest and hydration recommended. Follow-up if symptoms persist."
              : null,
          followUpDate:
            record.type.type === "Illness" || record.type.type === "Incident"
              ? new Date(
                  record.date.getTime() +
                    randomNumber(7, 14) * 24 * 60 * 60 * 1000
                )
              : null,
          recordedBy,
        },
      })
      healthCount++
    } catch {
      // Skip if creation fails
    }
  })

  logSuccess("Health Records", healthCount, "vaccinations, checkups, incidents")
  return healthCount
}

// ============================================================================
// DISCIPLINARY RECORDS SEEDING
// ============================================================================

/**
 * Seed disciplinary records
 * Target: 20+ records (realistic - not too many)
 */
export async function seedDisciplinaryRecords(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  teachers: TeacherRef[]
): Promise<number> {
  let disciplinaryCount = 0

  if (students.length === 0 || teachers.length === 0) {
    logSuccess("Disciplinary Records", 0, "missing data")
    return 0
  }

  const targetCount = 25
  const recordsToCreate: Array<{
    studentId: string
    type: (typeof DISCIPLINARY_TYPES)[0]
    reportedBy: string
    date: Date
  }> = []

  // Select a subset of students for disciplinary records (realistic)
  const studentsWithRecords = students.slice(0, Math.min(50, students.length))

  for (let i = 0; i < targetCount; i++) {
    const student = randomElement(studentsWithRecords)
    const disciplinaryType = getRandomDisciplinaryType()
    const teacher = randomElement(teachers)

    recordsToCreate.push({
      studentId: student.id,
      type: disciplinaryType,
      reportedBy: teacher.userId || teacher.id,
      date: getRandomPastDate(180), // Past 6 months
    })
  }

  // Sort by date
  recordsToCreate.sort((a, b) => a.date.getTime() - b.date.getTime())

  await processBatch(recordsToCreate, 10, async (record) => {
    try {
      const description = randomElement(record.type.descriptions)
      const action = randomElement(record.type.actions)

      await prisma.disciplinaryRecord.create({
        data: {
          schoolId,
          studentId: record.studentId,
          incidentDate: record.date,
          incidentType: record.type.type,
          severity: record.type.severity,
          description,
          action,
          reportedBy: record.reportedBy,
          parentNotified: Math.random() < 0.8, // 80% notified
          notifiedDate:
            Math.random() < 0.8
              ? new Date(
                  record.date.getTime() +
                    randomNumber(0, 2) * 24 * 60 * 60 * 1000
                )
              : null,
          followUpDate:
            record.type.severity !== "Minor" && Math.random() < 0.5
              ? new Date(
                  record.date.getTime() +
                    randomNumber(7, 30) * 24 * 60 * 60 * 1000
                )
              : null,
          resolution:
            Math.random() < 0.7
              ? "Issue resolved. Student behavior has improved."
              : null,
        },
      })
      disciplinaryCount++
    } catch {
      // Skip if creation fails
    }
  })

  logSuccess(
    "Disciplinary Records",
    disciplinaryCount,
    "warnings, detentions, conferences"
  )
  return disciplinaryCount
}

// ============================================================================
// ACHIEVEMENTS SEEDING
// ============================================================================

/**
 * Seed achievements
 * Target: 30+ records
 */
export async function seedAchievements(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[]
): Promise<number> {
  let achievementCount = 0

  if (students.length === 0) {
    logSuccess("Achievements", 0, "no students available")
    return 0
  }

  const targetCount = 35
  const achievementsToCreate: Array<{
    studentId: string
    category: (typeof ACHIEVEMENT_CATEGORIES)[0]
    date: Date
  }> = []

  for (let i = 0; i < targetCount; i++) {
    const student = randomElement(students)
    const category = getRandomAchievementCategory()

    achievementsToCreate.push({
      studentId: student.id,
      category,
      date: getRandomPastDate(365), // Past year
    })
  }

  // Sort by date
  achievementsToCreate.sort((a, b) => a.date.getTime() - b.date.getTime())

  await processBatch(achievementsToCreate, 15, async (achievement) => {
    try {
      const title = randomElement(achievement.category.titles)
      const description = randomElement(achievement.category.descriptions)
      const level = randomElement(achievement.category.levels)
      const position = randomElement(achievement.category.positions)

      await prisma.achievement.create({
        data: {
          schoolId,
          studentId: achievement.studentId,
          title,
          description,
          achievementDate: achievement.date,
          category: achievement.category.category,
          level,
          position,
          points:
            achievement.category.category === "Academic"
              ? randomNumber(70, 100)
              : null,
          issuedBy: "Hogwarts Academy",
        },
      })
      achievementCount++
    } catch {
      // Skip if creation fails
    }
  })

  logSuccess(
    "Achievements",
    achievementCount,
    "academic, sports, arts, leadership"
  )
  return achievementCount
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

/**
 * Seed all wellness data
 * - 50+ health records
 * - 20+ disciplinary records
 * - 30+ achievements
 */
export async function seedWellness(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  teachers: TeacherRef[],
  adminUsers: UserRef[]
): Promise<{
  healthCount: number
  disciplinaryCount: number
  achievementCount: number
}> {
  logPhase(16, "COMPLIANCE", "سجلات الطلاب والإنجازات")

  // 1. Seed health records
  const healthCount = await seedHealthRecords(
    prisma,
    schoolId,
    students,
    adminUsers
  )

  // 2. Seed disciplinary records
  const disciplinaryCount = await seedDisciplinaryRecords(
    prisma,
    schoolId,
    students,
    teachers
  )

  // 3. Seed achievements
  const achievementCount = await seedAchievements(prisma, schoolId, students)

  return {
    healthCount,
    disciplinaryCount,
    achievementCount,
  }
}
