/**
 * People Seed
 * Creates Teachers (100), Students (1000), and Guardians (2000)
 *
 * Phase 3: People
 */

import type { PrismaClient } from "@prisma/client"

import {
  getRandomName,
  getRandomNeighborhood,
  getRandomSurname,
  getStudentBirthDate,
  GUARDIAN_TYPES,
  TEACHER_DATA,
  YEAR_LEVELS,
} from "./constants"
import type {
  DepartmentRef,
  GuardianRef,
  SchoolYearRef,
  StudentRef,
  SubjectRef,
  TeacherRef,
  UserRef,
  YearLevelRef,
} from "./types"
import {
  generateEmployeeId,
  generateGrNumber,
  generatePersonalEmail,
  generatePhone,
  generateSchoolEmail,
  isUniqueConstraintError,
  logPhase,
  logSuccess,
  processBatch,
  randomElement,
  randomNumber,
} from "./utils"

// ============================================================================
// GUARDIAN TYPES SEEDING
// ============================================================================

/**
 * Seed guardian types (Father, Mother, Guardian, etc.)
 */
async function seedGuardianTypes(
  prisma: PrismaClient,
  schoolId: string
): Promise<Map<string, string>> {
  const typeMap = new Map<string, string>()

  for (const type of GUARDIAN_TYPES) {
    const guardianType = await prisma.guardianType.upsert({
      where: {
        schoolId_name: {
          schoolId,
          name: type.nameEn,
        },
      },
      update: {},
      create: {
        schoolId,
        name: type.nameEn,
      },
    })
    typeMap.set(type.nameEn, guardianType.id)
  }

  logSuccess(
    "Guardian Types",
    GUARDIAN_TYPES.length,
    GUARDIAN_TYPES.map((t) => t.nameEn).join(", ")
  )

  return typeMap
}

// ============================================================================
// TEACHERS SEEDING
// ============================================================================

/**
 * Seed teachers (100 total)
 * Links to existing user accounts and departments
 */
export async function seedTeachers(
  prisma: PrismaClient,
  schoolId: string,
  teacherUsers: UserRef[],
  departments: DepartmentRef[]
): Promise<TeacherRef[]> {
  logPhase(3, "PEOPLE", "الأشخاص")

  const teachers: TeacherRef[] = []
  const deptMap = new Map(departments.map((d) => [d.departmentName, d]))

  // Process in batches
  await processBatch(teacherUsers, 20, async (user, index) => {
    // Use predefined teacher data if available, otherwise generate
    const teacherData = TEACHER_DATA[index % TEACHER_DATA.length]
    const department = deptMap.get(teacherData.departmentEn)

    try {
      const teacher = await prisma.teacher.upsert({
        where: {
          schoolId_emailAddress: {
            schoolId,
            emailAddress: user.email,
          },
        },
        update: {
          givenName: teacherData.givenNameAr,
          surname: teacherData.surnameAr,
          gender: teacherData.gender,
          userId: user.id,
        },
        create: {
          schoolId,
          userId: user.id,
          emailAddress: user.email,
          employeeId: generateEmployeeId(index),
          givenName: teacherData.givenNameAr,
          surname: teacherData.surnameAr,
          gender: teacherData.gender,
          employmentStatus: "ACTIVE",
          employmentType: "FULL_TIME",
          joiningDate: new Date(),
        },
      })

      // Link to department if found
      if (department) {
        await prisma.teacherDepartment.upsert({
          where: {
            schoolId_teacherId_departmentId: {
              schoolId,
              teacherId: teacher.id,
              departmentId: department.id,
            },
          },
          update: {
            isPrimary: true,
          },
          create: {
            schoolId,
            teacherId: teacher.id,
            departmentId: department.id,
            isPrimary: true,
          },
        })
      }

      teachers.push({
        id: teacher.id,
        userId: user.id,
        emailAddress: teacher.emailAddress,
        givenName: teacher.givenName,
        surname: teacher.surname,
      })
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error
      }
      // Find existing teacher
      const existing = await prisma.teacher.findFirst({
        where: { schoolId, emailAddress: user.email },
      })
      if (existing) {
        teachers.push({
          id: existing.id,
          userId: user.id,
          emailAddress: existing.emailAddress,
          givenName: existing.givenName,
          surname: existing.surname,
        })
      }
    }
  })

  logSuccess("Teachers", teachers.length, "with department assignments")

  return teachers
}

// ============================================================================
// TEACHER QUALIFICATIONS SEEDING
// ============================================================================

// Sample qualification data
const DEGREE_TYPES = [
  { name: "Bachelor of Education", major: "Education", type: "DEGREE" },
  { name: "Bachelor of Science", major: "Science Education", type: "DEGREE" },
  { name: "Bachelor of Arts", major: "English Literature", type: "DEGREE" },
  {
    name: "Master of Education",
    major: "Educational Leadership",
    type: "DEGREE",
  },
  { name: "Master of Science", major: "Mathematics", type: "DEGREE" },
  { name: "Master of Arts", major: "Arabic Studies", type: "DEGREE" },
  { name: "PhD in Education", major: "Curriculum Development", type: "DEGREE" },
  { name: "Diploma in Education", major: "Teaching Methods", type: "DEGREE" },
]

const CERTIFICATIONS = [
  {
    name: "TEFL Certificate",
    institution: "Cambridge University",
    type: "CERTIFICATION",
  },
  {
    name: "Teaching License",
    institution: "Ministry of Education",
    type: "LICENSE",
  },
  {
    name: "First Aid Certificate",
    institution: "Red Crescent Society",
    type: "CERTIFICATION",
  },
  {
    name: "Child Protection Training",
    institution: "UNICEF",
    type: "CERTIFICATION",
  },
  {
    name: "ICT in Education",
    institution: "Google for Education",
    type: "CERTIFICATION",
  },
  {
    name: "Special Needs Education",
    institution: "British Council",
    type: "CERTIFICATION",
  },
  {
    name: "Assessment & Evaluation",
    institution: "IB Organization",
    type: "CERTIFICATION",
  },
]

const UNIVERSITIES = [
  "University of Khartoum",
  "Sudan University of Science and Technology",
  "Omdurman Islamic University",
  "Al-Neelain University",
  "University of Gezira",
  "Red Sea University",
  "International University of Africa",
  "Ahfad University for Women",
]

/**
 * Seed teacher qualifications
 * Target: 100+ qualifications (1-2 per teacher)
 */
export async function seedTeacherQualifications(
  prisma: PrismaClient,
  schoolId: string,
  teachers: TeacherRef[]
): Promise<number> {
  let qualificationCount = 0

  for (const teacher of teachers) {
    // Each teacher gets 1-2 qualifications
    const numQualifications = randomNumber(1, 2)

    for (let i = 0; i < numQualifications; i++) {
      try {
        // First qualification is always a degree
        const qualData =
          i === 0
            ? randomElement(DEGREE_TYPES)
            : randomElement([...DEGREE_TYPES, ...CERTIFICATIONS])

        const institution =
          qualData.type === "DEGREE"
            ? randomElement(UNIVERSITIES)
            : qualData.type === "CERTIFICATION" || qualData.type === "LICENSE"
              ? CERTIFICATIONS.find((c) => c.name === qualData.name)
                  ?.institution || "Ministry of Education"
              : randomElement(UNIVERSITIES)

        const yearsAgo = randomNumber(3, 20)
        const dateObtained = new Date()
        dateObtained.setFullYear(dateObtained.getFullYear() - yearsAgo)

        const existing = await prisma.teacherQualification.findFirst({
          where: {
            schoolId,
            teacherId: teacher.id,
            qualificationType: qualData.type,
            name: qualData.name,
          },
        })

        if (!existing) {
          await prisma.teacherQualification.create({
            data: {
              schoolId,
              teacherId: teacher.id,
              qualificationType: qualData.type,
              name: qualData.name,
              institution,
              major: "major" in qualData ? qualData.major : null,
              dateObtained,
              expiryDate:
                qualData.type === "LICENSE"
                  ? new Date(
                      dateObtained.getTime() + 5 * 365 * 24 * 60 * 60 * 1000
                    )
                  : null,
              licenseNumber:
                qualData.type === "LICENSE"
                  ? `LIC-${String(randomNumber(10000, 99999))}`
                  : null,
            },
          })
          qualificationCount++
        }
      } catch {
        // Skip if creation fails
      }
    }
  }

  logSuccess(
    "Teacher Qualifications",
    qualificationCount,
    "degrees + certifications"
  )
  return qualificationCount
}

// ============================================================================
// TEACHER EXPERIENCE SEEDING
// ============================================================================

const PREVIOUS_SCHOOLS = [
  "Khartoum International School",
  "Unity High School",
  "Al-Noor Academy",
  "Excellence Primary School",
  "Sunrise International School",
  "Modern Education Academy",
  "Al-Mashreq School",
  "Cambridge School Sudan",
  "Green Valley Academy",
  "Pioneer School",
]

const TEACHING_POSITIONS = [
  "Teacher",
  "Senior Teacher",
  "Head of Department",
  "Assistant Teacher",
  "Subject Coordinator",
  "Classroom Teacher",
  "Lead Teacher",
]

/**
 * Seed teacher experience records
 * Target: 100+ experience records (1-2 per teacher)
 */
export async function seedTeacherExperience(
  prisma: PrismaClient,
  schoolId: string,
  teachers: TeacherRef[]
): Promise<number> {
  let experienceCount = 0

  for (const teacher of teachers) {
    // Each teacher gets 1-2 previous experiences
    const numExperiences = randomNumber(1, 2)

    for (let i = 0; i < numExperiences; i++) {
      try {
        const institution = randomElement(PREVIOUS_SCHOOLS)
        const position = randomElement(TEACHING_POSITIONS)

        // Calculate dates - oldest experience first
        const yearsAgo = numExperiences - i + randomNumber(2, 10)
        const startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - yearsAgo)

        const endDate = new Date(startDate)
        endDate.setFullYear(endDate.getFullYear() + randomNumber(1, 3))

        const existing = await prisma.teacherExperience.findFirst({
          where: {
            schoolId,
            teacherId: teacher.id,
            institution,
            position,
          },
        })

        if (!existing) {
          await prisma.teacherExperience.create({
            data: {
              schoolId,
              teacherId: teacher.id,
              institution,
              position,
              startDate,
              endDate,
              isCurrent: false,
              description: `Taught ${randomElement(["Mathematics", "Science", "English", "Arabic", "Social Studies"])} to students in grades ${randomNumber(1, 6)}-${randomNumber(7, 12)}. Responsibilities included curriculum development, student assessment, and parent communication.`,
            },
          })
          experienceCount++
        }
      } catch {
        // Skip if creation fails
      }
    }
  }

  logSuccess("Teacher Experience", experienceCount, "previous positions")
  return experienceCount
}

// ============================================================================
// TEACHER SUBJECT EXPERTISE SEEDING
// ============================================================================

/**
 * Seed teacher subject expertise
 * Target: 100+ expertise records (1-2 per teacher)
 */
export async function seedTeacherSubjectExpertise(
  prisma: PrismaClient,
  schoolId: string,
  teachers: TeacherRef[],
  subjects: SubjectRef[]
): Promise<number> {
  let expertiseCount = 0

  if (subjects.length === 0) {
    logSuccess("Teacher Subject Expertise", 0, "no subjects available")
    return 0
  }

  for (const teacher of teachers) {
    // Each teacher gets 1-3 subject expertise areas
    const numSubjects = randomNumber(1, 3)
    const assignedSubjects = new Set<string>()

    for (let i = 0; i < numSubjects; i++) {
      try {
        const subject = randomElement(subjects)
        if (assignedSubjects.has(subject.id)) continue
        assignedSubjects.add(subject.id)

        const expertiseLevel =
          i === 0 ? "PRIMARY" : Math.random() < 0.5 ? "SECONDARY" : "CERTIFIED"

        const existing = await prisma.teacherSubjectExpertise.findFirst({
          where: {
            schoolId,
            teacherId: teacher.id,
            subjectId: subject.id,
          },
        })

        if (!existing) {
          await prisma.teacherSubjectExpertise.create({
            data: {
              schoolId,
              teacherId: teacher.id,
              subjectId: subject.id,
              expertiseLevel,
            },
          })
          expertiseCount++
        }
      } catch {
        // Skip if creation fails
      }
    }
  }

  logSuccess("Teacher Subject Expertise", expertiseCount, "subject assignments")
  return expertiseCount
}

// ============================================================================
// TEACHER PHONE NUMBERS SEEDING
// ============================================================================

/**
 * Seed teacher phone numbers
 * Target: 100+ phone numbers (1-2 per teacher)
 */
export async function seedTeacherPhoneNumbers(
  prisma: PrismaClient,
  schoolId: string,
  teachers: TeacherRef[]
): Promise<number> {
  let phoneCount = 0

  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i]

    // Each teacher gets 1-2 phone numbers
    const numPhones = randomNumber(1, 2)

    for (let j = 0; j < numPhones; j++) {
      try {
        const phoneNumber = generatePhone(i * 2 + j + 1000)
        const phoneType = j === 0 ? "mobile" : randomElement(["home", "work"])

        const existing = await prisma.teacherPhoneNumber.findFirst({
          where: {
            schoolId,
            teacherId: teacher.id,
            phoneNumber,
          },
        })

        if (!existing) {
          await prisma.teacherPhoneNumber.create({
            data: {
              schoolId,
              teacherId: teacher.id,
              phoneNumber,
              phoneType,
              isPrimary: j === 0,
            },
          })
          phoneCount++
        }
      } catch {
        // Skip if creation fails
      }
    }
  }

  logSuccess("Teacher Phone Numbers", phoneCount, "contact numbers")
  return phoneCount
}

// ============================================================================
// STUDENTS SEEDING
// ============================================================================

/**
 * Seed students (1000 total, distributed across K-12)
 * Links to existing user accounts and year levels
 */
export async function seedStudents(
  prisma: PrismaClient,
  schoolId: string,
  studentUsers: UserRef[],
  yearLevels: YearLevelRef[],
  schoolYear: SchoolYearRef
): Promise<StudentRef[]> {
  const students: StudentRef[] = []

  // Calculate distribution per level based on YEAR_LEVELS config
  const levelDistribution = YEAR_LEVELS.map((level) => ({
    level: yearLevels.find((yl) => yl.levelName === level.nameEn),
    count: level.studentsPerLevel,
    order: level.order,
  }))

  let studentIndex = 0

  for (const dist of levelDistribution) {
    if (!dist.level) continue

    const levelStudentCount = Math.min(
      dist.count,
      studentUsers.length - studentIndex
    )
    const levelStudents = studentUsers.slice(
      studentIndex,
      studentIndex + levelStudentCount
    )

    await processBatch(levelStudents, 10, async (user, batchIndex) => {
      const globalIndex = studentIndex + batchIndex
      const gender = globalIndex % 2 === 0 ? "M" : "F"
      const name = getRandomName(gender as "M" | "F", globalIndex)
      const surname = getRandomSurname(globalIndex)
      const neighborhood = getRandomNeighborhood(globalIndex)
      const birthDate = getStudentBirthDate(dist.order)

      try {
        const student = await prisma.student.upsert({
          where: {
            schoolId_grNumber: {
              schoolId,
              grNumber: generateGrNumber(globalIndex),
            },
          },
          update: {
            givenName: name.ar,
            surname: surname.ar,
            gender,
            userId: user.id,
          },
          create: {
            schoolId,
            userId: user.id,
            grNumber: generateGrNumber(globalIndex),
            givenName: name.ar,
            surname: surname.ar,
            gender,
            dateOfBirth: birthDate,
            nationality: "Sudan",
            currentAddress: neighborhood.ar,
            city: "الخرطوم",
            country: "Sudan",
            mobileNumber: generatePhone(globalIndex),
            email: generatePersonalEmail(name.en, surname.en, globalIndex),
            enrollmentDate: new Date(),
            status: "ACTIVE",
            studentType: "REGULAR",
          },
        })

        // Link student to year level
        await prisma.studentYearLevel.upsert({
          where: {
            schoolId_studentId_yearId: {
              schoolId,
              studentId: student.id,
              yearId: schoolYear.id,
            },
          },
          update: {
            levelId: dist.level!.id,
          },
          create: {
            schoolId,
            studentId: student.id,
            levelId: dist.level!.id,
            yearId: schoolYear.id,
          },
        })

        students.push({
          id: student.id,
          userId: user.id,
          grNumber: student.grNumber || "",
          givenName: student.givenName,
          surname: student.surname,
          yearLevelId: dist.level!.id,
        })
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error
        }
        // Find existing student
        const existing = await prisma.student.findFirst({
          where: { schoolId, grNumber: generateGrNumber(globalIndex) },
        })
        if (existing) {
          students.push({
            id: existing.id,
            userId: user.id,
            grNumber: existing.grNumber || "",
            givenName: existing.givenName,
            surname: existing.surname,
            yearLevelId: dist.level!.id,
          })
        }
      }
    })

    studentIndex += levelStudentCount
  }

  logSuccess("Students", students.length, "K-12 distribution")

  return students
}

// ============================================================================
// GUARDIANS SEEDING
// ============================================================================

/**
 * Seed guardians (2000 total - 2 per student)
 * Links to existing user accounts and students
 */
export async function seedGuardians(
  prisma: PrismaClient,
  schoolId: string,
  guardianUsers: UserRef[],
  students: StudentRef[]
): Promise<GuardianRef[]> {
  // First seed guardian types
  const guardianTypeMap = await seedGuardianTypes(prisma, schoolId)
  const guardians: GuardianRef[] = []

  // Each student gets 2 guardians (father + mother)
  await processBatch(students, 10, async (student, studentIndex) => {
    const guardianPairs = [
      { type: "Father", gender: "M" },
      { type: "Mother", gender: "F" },
    ]

    for (let i = 0; i < guardianPairs.length; i++) {
      const pair = guardianPairs[i]
      const guardianIndex = studentIndex * 2 + i

      if (guardianIndex >= guardianUsers.length) continue

      const user = guardianUsers[guardianIndex]
      const name = getRandomName(pair.gender as "M" | "F", guardianIndex)
      // Guardian shares student's surname (family name)
      const surname = { ar: student.surname, en: student.surname }
      const email = generateSchoolEmail("parent", guardianIndex)
      const guardianTypeId = guardianTypeMap.get(pair.type)

      if (!guardianTypeId) continue

      try {
        const guardian = await prisma.guardian.upsert({
          where: {
            schoolId_emailAddress: {
              schoolId,
              emailAddress: email,
            },
          },
          update: {
            givenName: name.ar,
            surname: surname.ar,
            userId: user.id,
          },
          create: {
            schoolId,
            userId: user.id,
            emailAddress: email,
            givenName: name.ar,
            surname: surname.ar,
          },
        })

        // Link guardian to student
        await prisma.studentGuardian.upsert({
          where: {
            schoolId_studentId_guardianId: {
              schoolId,
              studentId: student.id,
              guardianId: guardian.id,
            },
          },
          update: {
            guardianTypeId,
            isPrimary: i === 0, // Father is primary
          },
          create: {
            schoolId,
            studentId: student.id,
            guardianId: guardian.id,
            guardianTypeId,
            isPrimary: i === 0,
          },
        })

        // Add phone number
        await prisma.guardianPhoneNumber.upsert({
          where: {
            schoolId_guardianId_phoneNumber: {
              schoolId,
              guardianId: guardian.id,
              phoneNumber: generatePhone(guardianIndex),
            },
          },
          update: {},
          create: {
            schoolId,
            guardianId: guardian.id,
            phoneNumber: generatePhone(guardianIndex),
            phoneType: "mobile",
            isPrimary: true,
          },
        })

        if (i === 0) {
          // Only add to list once per pair
          guardians.push({
            id: guardian.id,
            givenName: guardian.givenName,
            surname: guardian.surname,
          })
        }
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error
        }
      }
    }
  })

  logSuccess(
    "Guardians",
    guardians.length * 2,
    "2 per student (Father + Mother)"
  )

  return guardians
}

// ============================================================================
// COMBINED PEOPLE SEEDING
// ============================================================================

/**
 * Seed all people (teachers, students, guardians)
 * Also seeds teacher qualifications, experience, and expertise
 */
export async function seedAllPeople(
  prisma: PrismaClient,
  schoolId: string,
  teacherUsers: UserRef[],
  studentUsers: UserRef[],
  guardianUsers: UserRef[],
  departments: DepartmentRef[],
  yearLevels: YearLevelRef[],
  schoolYear: SchoolYearRef,
  subjects?: SubjectRef[]
): Promise<{
  teachers: TeacherRef[]
  students: StudentRef[]
  guardians: GuardianRef[]
}> {
  const teachers = await seedTeachers(
    prisma,
    schoolId,
    teacherUsers,
    departments
  )

  // Seed teacher profile data
  await seedTeacherQualifications(prisma, schoolId, teachers)
  await seedTeacherExperience(prisma, schoolId, teachers)
  await seedTeacherPhoneNumbers(prisma, schoolId, teachers)
  if (subjects && subjects.length > 0) {
    await seedTeacherSubjectExpertise(prisma, schoolId, teachers, subjects)
  }

  const students = await seedStudents(
    prisma,
    schoolId,
    studentUsers,
    yearLevels,
    schoolYear
  )
  const guardians = await seedGuardians(
    prisma,
    schoolId,
    guardianUsers,
    students
  )

  return { teachers, students, guardians }
}
