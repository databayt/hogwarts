/**
 * Complete Seed for Port Sudan International School
 *
 * This script seeds FULL data for Port Sudan school ONLY.
 * It's fully idempotent - can be run multiple times safely.
 *
 * Run with: npx tsx prisma/seed-portsudan-complete.ts
 */

import { PrismaClient, UserRole, Gender } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Faker alternative - simple data generators
const firstNamesM = ['Ahmed', 'Mohammed', 'Omar', 'Ali', 'Hassan', 'Youssef', 'Ibrahim', 'Khalid']
const firstNamesF = ['Fatima', 'Aisha', 'Mariam', 'Sara', 'Zainab', 'Layla', 'Amira', 'Nour']
const surnames = ['Al-Hassan', 'Al-Ahmed', 'Ibrahim', 'Mohammed', 'Al-Sayed', 'Al-Sheikh']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomEmail(name: string, domain: string = 'portsudan.edu.sd'): string {
  return `${name.toLowerCase().replace(/\s+/g, '.')}@${domain}`
}

async function main() {
  console.log('🌱 Starting comprehensive seed for Port Sudan International School...\n')

  const passwordHash = await hash('password123', 10)

  // =========================================================================
  // 1. SCHOOL SETUP
  // =========================================================================
  console.log('📚 Setting up school...')

  const school = await prisma.school.upsert({
    where: { domain: 'portsudan' },
    update: {},
    create: {
      name: 'Port Sudan International School',
      domain: 'portsudan',
      phoneNumber: '+249-91-234-5678'
    }
  })
  console.log(`✅ School: ${school.name}\n`)

  // =========================================================================
  // 2. ACADEMIC STRUCTURE
  // =========================================================================
  console.log('📅 Creating academic structure...')

  // School Year
  const schoolYear = await prisma.schoolYear.upsert({
    where: { schoolId_yearName: { schoolId: school.id, yearName: '2024-2025' } },
    update: {},
    create: {
      schoolId: school.id,
      yearName: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30')
    }
  })

  // Terms
  const term1 = await prisma.term.upsert({
    where: {
      schoolId_yearId_termNumber: {
        schoolId: school.id,
        yearId: schoolYear.id,
        termNumber: 1
      }
    },
    update: {},
    create: {
      schoolId: school.id,
      yearId: schoolYear.id,
      termNumber: 1,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-12-20')
    }
  })

  const term2 = await prisma.term.upsert({
    where: {
      schoolId_yearId_termNumber: {
        schoolId: school.id,
        yearId: schoolYear.id,
        termNumber: 2
      }
    },
    update: {},
    create: {
      schoolId: school.id,
      yearId: schoolYear.id,
      termNumber: 2,
      startDate: new Date('2025-01-05'),
      endDate: new Date('2025-03-28')
    }
  })

  // Year Levels (Grades)
  const yearLevels = []
  for (let i = 1; i <= 12; i++) {
    const yl = await prisma.yearLevel.upsert({
      where: {
        schoolId_levelName: {
          schoolId: school.id,
          levelName: `Grade ${i}`
        }
      },
      update: {},
      create: {
        schoolId: school.id,
        levelName: `Grade ${i}`,
        levelOrder: i
      }
    })
    yearLevels.push(yl)
  }

  // Periods (Daily Schedule)
  const periodTimes = [
    { name: 'Period 1', start: '08:00', end: '08:45' },
    { name: 'Period 2', start: '08:50', end: '09:35' },
    { name: 'Period 3', start: '09:40', end: '10:25' },
    { name: 'Period 4', start: '10:30', end: '11:15' },
    { name: 'Period 5', start: '11:20', end: '12:05' },
    { name: 'Period 6', start: '12:10', end: '12:55' },
  ]

  const periods = []
  for (const pt of periodTimes) {
    const startTime = new Date(`2024-01-01T${pt.start}:00Z`)
    const endTime = new Date(`2024-01-01T${pt.end}:00Z`)

    const period = await prisma.period.upsert({
      where: {
        schoolId_yearId_name: {
          schoolId: school.id,
          yearId: schoolYear.id,
          name: pt.name
        }
      },
      update: {},
      create: {
        schoolId: school.id,
        yearId: schoolYear.id,
        name: pt.name,
        startTime,
        endTime
      }
    })
    periods.push(period)
  }

  console.log(`✅ Academic structure: ${yearLevels.length} grades, ${periods.length} periods, 2 terms\n`)

  // =========================================================================
  // 3. DEPARTMENTS & SUBJECTS
  // =========================================================================
  console.log('📖 Creating departments and subjects...')

  const deptData = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Sciences', code: 'SCI' },
    { name: 'Languages', code: 'LANG' },
    { name: 'Social Studies', code: 'SOC' },
    { name: 'Arts', code: 'ART' }
  ]

  const departments = []
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { schoolId_name: { schoolId: school.id, name: d.name } },
      update: {},
      create: {
        schoolId: school.id,
        name: d.name,
        code: d.code
      }
    })
    departments.push(dept)
  }

  // Subjects
  const subjectData = [
    { name: 'Mathematics', code: 'MATH101', deptIndex: 0 },
    { name: 'Algebra', code: 'MATH201', deptIndex: 0 },
    { name: 'Physics', code: 'SCI101', deptIndex: 1 },
    { name: 'Chemistry', code: 'SCI102', deptIndex: 1 },
    { name: 'Biology', code: 'SCI103', deptIndex: 1 },
    { name: 'Arabic', code: 'LANG101', deptIndex: 2 },
    { name: 'English', code: 'LANG102', deptIndex: 2 },
    { name: 'History', code: 'SOC101', deptIndex: 3 },
    { name: 'Geography', code: 'SOC102', deptIndex: 3 },
    { name: 'Islamic Studies', code: 'SOC103', deptIndex: 3 },
    { name: 'Art', code: 'ART101', deptIndex: 4 },
    { name: 'Music', code: 'ART102', deptIndex: 4 }
  ]

  const subjects = []
  for (const s of subjectData) {
    const subject = await prisma.subject.upsert({
      where: { schoolId_subjectCode: { schoolId: school.id, subjectCode: s.code } },
      update: {},
      create: {
        schoolId: school.id,
        subjectName: s.name,
        subjectCode: s.code,
        departmentId: departments[s.deptIndex].id
      }
    })
    subjects.push(subject)
  }

  console.log(`✅ ${departments.length} departments, ${subjects.length} subjects\n`)

  // =========================================================================
  // 4. CLASSROOMS
  // =========================================================================
  console.log('🏫 Creating classrooms...')

  const classroomType = await prisma.classroomType.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Standard' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Standard',
      description: 'Standard classroom'
    }
  })

  const classrooms = []
  for (let i = 1; i <= 20; i++) {
    const classroom = await prisma.classroom.upsert({
      where: { schoolId_roomName: { schoolId: school.id, roomName: `Room ${i}` } },
      update: {},
      create: {
        schoolId: school.id,
        roomName: `Room ${i}`,
        capacity: 30,
        typeId: classroomType.id
      }
    })
    classrooms.push(classroom)
  }

  console.log(`✅ ${classrooms.length} classrooms\n`)

  // =========================================================================
  // 5. TEACHERS & STAFF
  // =========================================================================
  console.log('👨‍🏫 Creating teachers...')

  const teachers = []
  for (let i = 0; i < 15; i++) {
    const gender = i % 2 === 0 ? Gender.MALE : Gender.FEMALE
    const firstName = gender === Gender.MALE ? randomItem(firstNamesM) : randomItem(firstNamesF)
    const surname = randomItem(surnames)
    const email = randomEmail(`${firstName}.${surname}.teacher${i}`)

    // Create user
    const user = await prisma.user.upsert({
      where: { email_schoolId: { email, schoolId: school.id } },
      update: {},
      create: {
        email,
        role: UserRole.TEACHER,
        password: passwordHash,
        emailVerified: new Date(),
        schoolId: school.id
      }
    })

    // Create teacher
    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        schoolId: school.id,
        userId: user.id,
        givenName: firstName,
        surname: surname,
        emailAddress: email,
        gender
      }
    })

    // Assign to department
    const dept = randomItem(departments)
    await prisma.teacherDepartment.upsert({
      where: {
        schoolId_teacherId_departmentId: {
          schoolId: school.id,
          teacherId: teacher.id,
          departmentId: dept.id
        }
      },
      update: {},
      create: {
        schoolId: school.id,
        teacherId: teacher.id,
        departmentId: dept.id
      }
    })

    teachers.push(teacher)
  }

  console.log(`✅ ${teachers.length} teachers\n`)

  // =========================================================================
  // 6. STUDENTS & GUARDIANS
  // =========================================================================
  console.log('👨‍🎓 Creating students and guardians...')

  // Guardian Types
  const gtFather = await prisma.guardianType.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Father' } },
    update: {},
    create: { schoolId: school.id, name: 'Father' }
  })

  const gtMother = await prisma.guardianType.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Mother' } },
    update: {},
    create: { schoolId: school.id, name: 'Mother' }
  })

  const students = []
  for (let i = 0; i < 50; i++) {
    const gender = i % 2 === 0 ? Gender.MALE : Gender.FEMALE
    const firstName = gender === Gender.MALE ? randomItem(firstNamesM) : randomItem(firstNamesF)
    const surname = randomItem(surnames)
    const studentEmail = randomEmail(`${firstName}.${surname}.student${i}`)

    // Father
    const fatherUser = await prisma.user.upsert({
      where: { email_schoolId: { email: randomEmail(`father${i}`), schoolId: school.id } },
      update: {},
      create: {
        email: randomEmail(`father${i}`),
        role: UserRole.GUARDIAN,
        password: passwordHash,
        emailVerified: new Date(),
        schoolId: school.id
      }
    })

    const father = await prisma.guardian.upsert({
      where: { userId: fatherUser.id },
      update: {},
      create: {
        schoolId: school.id,
        userId: fatherUser.id,
        givenName: randomItem(firstNamesM),
        surname: surname,
        emailAddress: fatherUser.email,
        gender: Gender.MALE
      }
    })

    // Mother
    const motherUser = await prisma.user.upsert({
      where: { email_schoolId: { email: randomEmail(`mother${i}`), schoolId: school.id } },
      update: {},
      create: {
        email: randomEmail(`mother${i}`),
        role: UserRole.GUARDIAN,
        password: passwordHash,
        emailVerified: new Date(),
        schoolId: school.id
      }
    })

    const mother = await prisma.guardian.upsert({
      where: { userId: motherUser.id },
      update: {},
      create: {
        schoolId: school.id,
        userId: motherUser.id,
        givenName: randomItem(firstNamesF),
        surname: surname,
        emailAddress: motherUser.email,
        gender: Gender.FEMALE
      }
    })

    // Student User
    const studentUser = await prisma.user.upsert({
      where: { email_schoolId: { email: studentEmail, schoolId: school.id } },
      update: {},
      create: {
        email: studentEmail,
        role: UserRole.STUDENT,
        password: passwordHash,
        emailVerified: new Date(),
        schoolId: school.id
      }
    })

    // Student
    const dob = new Date(2008 + (i % 5), i % 12, (i % 28) + 1)
    const student = await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: {
        schoolId: school.id,
        userId: studentUser.id,
        givenName: firstName,
        surname: surname,
        dateOfBirth: dob,
        gender
      }
    })

    // Link guardians
    await prisma.studentGuardian.upsert({
      where: {
        schoolId_studentId_guardianId: {
          schoolId: school.id,
          studentId: student.id,
          guardianId: father.id
        }
      },
      update: {},
      create: {
        schoolId: school.id,
        studentId: student.id,
        guardianId: father.id,
        guardianTypeId: gtFather.id,
        isPrimary: false
      }
    })

    await prisma.studentGuardian.upsert({
      where: {
        schoolId_studentId_guardianId: {
          schoolId: school.id,
          studentId: student.id,
          guardianId: mother.id
        }
      },
      update: {},
      create: {
        schoolId: school.id,
        studentId: student.id,
        guardianId: mother.id,
        guardianTypeId: gtMother.id,
        isPrimary: true
      }
    })

    students.push(student)
  }

  console.log(`✅ ${students.length} students with guardians\n`)

  // =========================================================================
  // 7. CLASSES (Grade Sections)
  // =========================================================================
  console.log('📚 Creating classes...')

  const classes = []
  for (let gradeLevel = 1; gradeLevel <= 6; gradeLevel++) {
    for (const section of ['A', 'B']) {
      const className = `Grade ${gradeLevel}${section}`
      const yearLevel = yearLevels.find(yl => yl.level === gradeLevel)
      const subject = randomItem(subjects)
      const teacher = randomItem(teachers)
      const classroom = randomItem(classrooms)

      const cls = await prisma.class.upsert({
        where: { schoolId_termId_className: { schoolId: school.id, termId: term1.id, className } },
        update: {},
        create: {
          schoolId: school.id,
          termId: term1.id,
          yearLevelId: yearLevel!.id,
          subjectId: subject.id,
          teacherId: teacher.id,
          classroomId: classroom.id,
          className,
          capacity: 30
        }
      })

      classes.push(cls)

      // Enroll students
      const studentsInGrade = students.slice(gradeLevel * 4, (gradeLevel + 1) * 4)
      for (const student of studentsInGrade) {
        await prisma.studentClass.upsert({
          where: {
            schoolId_termId_studentId_classId: {
              schoolId: school.id,
              termId: term1.id,
              studentId: student.id,
              classId: cls.id
            }
          },
          update: {},
          create: {
            schoolId: school.id,
            termId: term1.id,
            studentId: student.id,
            classId: cls.id
          }
        })
      }
    }
  }

  console.log(`✅ ${classes.length} classes with student enrollments\n`)

  // =========================================================================
  // 8. TIMETABLE
  // =========================================================================
  console.log('📅 Creating timetable...')

  // Week Config
  await prisma.schoolWeekConfig.upsert({
    where: { schoolId_termId: { schoolId: school.id, termId: null } },
    update: {},
    create: {
      schoolId: school.id,
      termId: null,
      workingDays: [0, 1, 2, 3, 4], // Sunday to Thursday
      defaultLunchAfterPeriod: 4
    }
  })

  // Timetable Slots
  const workingDays = [0, 1, 2, 3, 4] // Sunday to Thursday
  let slotsCreated = 0

  for (const cls of classes) {
    for (let dayIndex = 0; dayIndex < workingDays.length; dayIndex++) {
      for (let periodIndex = 0; periodIndex < Math.min(4, periods.length); periodIndex++) {
        await prisma.timetable.upsert({
          where: {
            schoolId_termId_dayOfWeek_periodId_classId_weekOffset: {
              schoolId: school.id,
              termId: term1.id,
              dayOfWeek: workingDays[dayIndex],
              periodId: periods[periodIndex].id,
              classId: cls.id,
              weekOffset: 0
            }
          },
          update: {},
          create: {
            schoolId: school.id,
            termId: term1.id,
            dayOfWeek: workingDays[dayIndex],
            periodId: periods[periodIndex].id,
            classId: cls.id,
            teacherId: cls.teacherId || teachers[0].id,
            classroomId: cls.classroomId || classrooms[0].id,
            weekOffset: 0
          }
        })
        slotsCreated++
      }
    }
  }

  console.log(`✅ ${slotsCreated} timetable slots\n`)

  // =========================================================================
  // FINAL SUMMARY
  // =========================================================================
  console.log('═'.repeat(60))
  console.log('🎉 SEED COMPLETE FOR PORT SUDAN INTERNATIONAL SCHOOL')
  console.log('═'.repeat(60))
  console.log(`📚 School: ${school.name}`)
  console.log(`🌐 Domain: ${school.domain}`)
  console.log(`📊 Year Levels: ${yearLevels.length}`)
  console.log(`📅 Periods: ${periods.length}`)
  console.log(`📖 Subjects: ${subjects.length}`)
  console.log(`👨‍🏫 Teachers: ${teachers.length}`)
  console.log(`👨‍🎓 Students: ${students.length}`)
  console.log(`🏫 Classrooms: ${classrooms.length}`)
  console.log(`📚 Classes: ${classes.length}`)
  console.log(`📅 Timetable Slots: ${slotsCreated}`)
  console.log('═'.repeat(60))
  console.log('\n✅ Ready to view timetable at: https://portsudan.databayt.org/en/timetable')
  console.log('🔑 Test login: Any teacher/student email with password: password123\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
