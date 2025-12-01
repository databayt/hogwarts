/**
 * Comprehensive Timetable Seed Script
 *
 * Creates realistic timetable data for a school including:
 * - Multiple subjects with proper distribution
 * - Teachers assigned to specific subjects
 * - Room allocation avoiding conflicts
 * - Break periods and lunch schedules
 * - Full week coverage
 *
 * Run with: npx tsx prisma/seed-timetable.ts
 */

import { PrismaClient, Gender, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Subject definitions with weekly hour requirements
const SUBJECTS_CONFIG = [
  { name: 'Mathematics', code: 'MATH', hoursPerWeek: 5, color: '#3B82F6', isCore: true },
  { name: 'Arabic', code: 'ARAB', hoursPerWeek: 5, color: '#10B981', isCore: true },
  { name: 'English', code: 'ENG', hoursPerWeek: 5, color: '#F59E0B', isCore: true },
  { name: 'Science', code: 'SCI', hoursPerWeek: 4, color: '#8B5CF6', isCore: true },
  { name: 'Physics', code: 'PHY', hoursPerWeek: 3, color: '#06B6D4', isCore: true },
  { name: 'Chemistry', code: 'CHEM', hoursPerWeek: 3, color: '#EC4899', isCore: true },
  { name: 'Biology', code: 'BIO', hoursPerWeek: 3, color: '#84CC16', isCore: true },
  { name: 'History', code: 'HIST', hoursPerWeek: 2, color: '#D97706', isCore: false },
  { name: 'Geography', code: 'GEO', hoursPerWeek: 2, color: '#0891B2', isCore: false },
  { name: 'Islamic Studies', code: 'ISL', hoursPerWeek: 3, color: '#059669', isCore: true },
  { name: 'Computer Science', code: 'CS', hoursPerWeek: 2, color: '#7C3AED', isCore: false },
  { name: 'Physical Education', code: 'PE', hoursPerWeek: 2, color: '#EF4444', isCore: false },
  { name: 'Art', code: 'ART', hoursPerWeek: 1, color: '#F97316', isCore: false },
  { name: 'Music', code: 'MUS', hoursPerWeek: 1, color: '#14B8A6', isCore: false },
]

// Teachers per department
const TEACHERS_CONFIG = [
  { name: 'Ahmed Hassan', subject: 'Mathematics', gender: Gender.MALE },
  { name: 'Fatima Ibrahim', subject: 'Mathematics', gender: Gender.FEMALE },
  { name: 'Mohammed Ali', subject: 'Arabic', gender: Gender.MALE },
  { name: 'Sara Ahmed', subject: 'Arabic', gender: Gender.FEMALE },
  { name: 'Omar Khaled', subject: 'English', gender: Gender.MALE },
  { name: 'Aisha Mohamed', subject: 'English', gender: Gender.FEMALE },
  { name: 'Hassan Youssef', subject: 'Science', gender: Gender.MALE },
  { name: 'Mariam Saleh', subject: 'Physics', gender: Gender.FEMALE },
  { name: 'Ibrahim Nour', subject: 'Chemistry', gender: Gender.MALE },
  { name: 'Layla Hassan', subject: 'Biology', gender: Gender.FEMALE },
  { name: 'Khalid Omar', subject: 'History', gender: Gender.MALE },
  { name: 'Nour Ahmed', subject: 'Geography', gender: Gender.FEMALE },
  { name: 'Ali Mahmoud', subject: 'Islamic Studies', gender: Gender.MALE },
  { name: 'Zainab Ibrahim', subject: 'Computer Science', gender: Gender.FEMALE },
  { name: 'Youssef Kamal', subject: 'Physical Education', gender: Gender.MALE },
  { name: 'Amira Hassan', subject: 'Art', gender: Gender.FEMALE },
]

// Period schedule
const PERIODS_CONFIG = [
  { name: 'Period 1', start: '07:30', end: '08:15', order: 1, isBreak: false },
  { name: 'Period 2', start: '08:20', end: '09:05', order: 2, isBreak: false },
  { name: 'Period 3', start: '09:10', end: '09:55', order: 3, isBreak: false },
  { name: 'Break 1', start: '09:55', end: '10:15', order: 4, isBreak: true },
  { name: 'Period 4', start: '10:15', end: '11:00', order: 5, isBreak: false },
  { name: 'Period 5', start: '11:05', end: '11:50', order: 6, isBreak: false },
  { name: 'Period 6', start: '11:55', end: '12:40', order: 7, isBreak: false },
  { name: 'Lunch', start: '12:40', end: '13:30', order: 8, isBreak: true },
  { name: 'Period 7', start: '13:30', end: '14:15', order: 9, isBreak: false },
  { name: 'Period 8', start: '14:20', end: '15:05', order: 10, isBreak: false },
]

// Room types
const ROOMS_CONFIG = [
  { name: 'Room 101', type: 'regular', capacity: 30, building: 'Main', floor: '1' },
  { name: 'Room 102', type: 'regular', capacity: 30, building: 'Main', floor: '1' },
  { name: 'Room 103', type: 'regular', capacity: 30, building: 'Main', floor: '1' },
  { name: 'Room 201', type: 'regular', capacity: 30, building: 'Main', floor: '2' },
  { name: 'Room 202', type: 'regular', capacity: 30, building: 'Main', floor: '2' },
  { name: 'Room 203', type: 'regular', capacity: 30, building: 'Main', floor: '2' },
  { name: 'Science Lab A', type: 'lab', capacity: 25, building: 'Science', floor: '1' },
  { name: 'Science Lab B', type: 'lab', capacity: 25, building: 'Science', floor: '1' },
  { name: 'Computer Lab', type: 'computer', capacity: 30, building: 'Tech', floor: '1' },
  { name: 'Sports Hall', type: 'gym', capacity: 50, building: 'Sports', floor: '1' },
  { name: 'Art Room', type: 'art', capacity: 25, building: 'Arts', floor: '1' },
  { name: 'Music Room', type: 'music', capacity: 25, building: 'Arts', floor: '1' },
]

// Class sections
const CLASSES_CONFIG = [
  { grade: 7, sections: ['A', 'B'] },
  { grade: 8, sections: ['A', 'B'] },
  { grade: 9, sections: ['A', 'B'] },
  { grade: 10, sections: ['A', 'B'] },
  { grade: 11, sections: ['A'] },
  { grade: 12, sections: ['A'] },
]

// Working days (Sunday to Thursday in Sudan/Middle East)
const WORKING_DAYS = [0, 1, 2, 3, 4] // Sunday=0, Monday=1, ..., Thursday=4

async function main() {
  console.log('🎓 Starting Comprehensive Timetable Seed...\n')

  const passwordHash = await hash('password123', 10)

  // =========================================================================
  // 1. CREATE OR GET SCHOOL
  // =========================================================================
  console.log('📚 Setting up school...')

  const school = await prisma.school.upsert({
    where: { domain: 'portsudan' },
    update: {},
    create: {
      name: 'Port Sudan International School',
      domain: 'portsudan',
      phoneNumber: '+249-91-234-5678',
      email: 'info@portsudan.edu.sd',
      timezone: 'Africa/Khartoum',
      planType: 'premium',
      maxStudents: 500,
      maxTeachers: 50,
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

  await prisma.term.upsert({
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

  // Year Levels
  const yearLevels: { id: string; levelOrder: number }[] = []
  for (let i = 7; i <= 12; i++) {
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

  // Periods (exclude breaks from timetable slots)
  const periods: { id: string; name: string; order: number; isBreak: boolean }[] = []
  for (const pt of PERIODS_CONFIG) {
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
    periods.push({ ...period, order: pt.order, isBreak: pt.isBreak })
  }

  // Filter to only teaching periods (non-break)
  const teachingPeriods = periods.filter(p => !p.isBreak)

  console.log(`✅ Academic structure: ${yearLevels.length} grades, ${periods.length} periods (${teachingPeriods.length} teaching)\n`)

  // =========================================================================
  // 3. DEPARTMENTS & SUBJECTS
  // =========================================================================
  console.log('📖 Creating departments and subjects...')

  const departments = new Map<string, string>()
  const deptNames = ['Mathematics', 'Languages', 'Sciences', 'Social Studies', 'Arts & PE']

  for (const name of deptNames) {
    const dept = await prisma.department.upsert({
      where: { schoolId_departmentName: { schoolId: school.id, departmentName: name } },
      update: {},
      create: {
        schoolId: school.id,
        departmentName: name
      }
    })
    departments.set(name, dept.id)
  }

  // Create subjects
  const subjectMap = new Map<string, { id: string; hoursPerWeek: number }>()
  for (const subj of SUBJECTS_CONFIG) {
    let deptId: string
    if (subj.name === 'Mathematics') deptId = departments.get('Mathematics')!
    else if (['Arabic', 'English'].includes(subj.name)) deptId = departments.get('Languages')!
    else if (['Science', 'Physics', 'Chemistry', 'Biology'].includes(subj.name)) deptId = departments.get('Sciences')!
    else if (['History', 'Geography', 'Islamic Studies', 'Computer Science'].includes(subj.name)) deptId = departments.get('Social Studies')!
    else deptId = departments.get('Arts & PE')!

    const subject = await prisma.subject.upsert({
      where: {
        schoolId_departmentId_subjectName: {
          schoolId: school.id,
          departmentId: deptId,
          subjectName: subj.name
        }
      },
      update: {},
      create: {
        schoolId: school.id,
        subjectName: subj.name,
        departmentId: deptId
      }
    })
    subjectMap.set(subj.name, { id: subject.id, hoursPerWeek: subj.hoursPerWeek })
  }

  console.log(`✅ ${departments.size} departments, ${subjectMap.size} subjects\n`)

  // =========================================================================
  // 4. CLASSROOMS
  // =========================================================================
  console.log('🏫 Creating classrooms...')

  // Create classroom type
  const classroomType = await prisma.classroomType.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Standard' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Standard'
    }
  })

  const classrooms: { id: string; name: string; type: string }[] = []
  for (const room of ROOMS_CONFIG) {
    const classroom = await prisma.classroom.upsert({
      where: { schoolId_roomName: { schoolId: school.id, roomName: room.name } },
      update: {},
      create: {
        schoolId: school.id,
        roomName: room.name,
        capacity: room.capacity,
        typeId: classroomType.id
      }
    })
    classrooms.push({ id: classroom.id, name: room.name, type: room.type })
  }

  console.log(`✅ ${classrooms.length} classrooms\n`)

  // =========================================================================
  // 5. TEACHERS
  // =========================================================================
  console.log('👨‍🏫 Creating teachers...')

  const teacherMap = new Map<string, { id: string; teacherId: string }>()

  for (const tc of TEACHERS_CONFIG) {
    const [firstName, ...lastNameParts] = tc.name.split(' ')
    const lastName = lastNameParts.join(' ')
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@portsudan.edu.sd`

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

    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        schoolId: school.id,
        userId: user.id,
        givenName: firstName,
        surname: lastName,
        emailAddress: email,
        gender: tc.gender
      }
    })

    teacherMap.set(tc.subject, { id: user.id, teacherId: teacher.id })
  }

  console.log(`✅ ${teacherMap.size} teachers\n`)

  // =========================================================================
  // 6. CLASSES (Grade Sections)
  // =========================================================================
  console.log('📚 Creating classes...')

  const classMap = new Map<string, string>()

  for (const cfg of CLASSES_CONFIG) {
    for (const section of cfg.sections) {
      const className = `${cfg.grade}${section}`

      // Get a regular classroom for this class
      const regularRoom = classrooms.find(r => r.type === 'regular')
      const defaultSubject = subjectMap.get('Mathematics')!
      const defaultTeacher = teacherMap.get('Mathematics')!

      const cls = await prisma.class.upsert({
        where: { schoolId_name: { schoolId: school.id, name: className } },
        update: {},
        create: {
          schoolId: school.id,
          termId: term1.id,
          subjectId: defaultSubject.id,
          teacherId: defaultTeacher.teacherId,
          classroomId: regularRoom?.id,
          startPeriodId: teachingPeriods[0].id,
          endPeriodId: teachingPeriods[teachingPeriods.length - 1].id,
          name: className
        }
      })

      classMap.set(className, cls.id)
    }
  }

  console.log(`✅ ${classMap.size} classes\n`)

  // =========================================================================
  // 7. SCHEDULE CONFIG
  // =========================================================================
  console.log('⚙️ Creating schedule config...')

  await prisma.schoolWeekConfig.upsert({
    where: { schoolId_termId: { schoolId: school.id, termId: term1.id } },
    update: {
      workingDays: WORKING_DAYS,
      defaultLunchAfterPeriod: 6
    },
    create: {
      schoolId: school.id,
      termId: term1.id,
      workingDays: WORKING_DAYS,
      defaultLunchAfterPeriod: 6
    }
  })

  console.log(`✅ Week config: Sun-Thu, Lunch after Period 6\n`)

  // =========================================================================
  // 8. TIMETABLE GENERATION
  // =========================================================================
  console.log('📅 Generating comprehensive timetable...')

  // Clear existing timetable slots for this term
  await prisma.timetable.deleteMany({
    where: { schoolId: school.id, termId: term1.id }
  })

  // Subject schedule per class (simplified but realistic)
  const subjectSchedule = [
    'Mathematics', 'Arabic', 'English', 'Science', 'Islamic Studies', // Morning
    'Physics', 'Chemistry', 'History', 'Geography', // After break
    'Computer Science', 'Physical Education', 'Art', 'Music', 'Biology' // Afternoon
  ]

  let slotsCreated = 0
  const teacherSlots = new Map<string, Set<string>>() // Track teacher busy times
  const roomSlots = new Map<string, Set<string>>() // Track room busy times

  for (const [className, classId] of classMap) {
    let subjectIndex = 0

    for (const day of WORKING_DAYS) {
      for (const period of teachingPeriods) {
        // Rotate through subjects
        const subjectName = subjectSchedule[subjectIndex % subjectSchedule.length]
        const subject = subjectMap.get(subjectName)
        const teacherInfo = teacherMap.get(subjectName)

        if (!subject || !teacherInfo) {
          subjectIndex++
          continue
        }

        // Get appropriate room based on subject
        let room = classrooms.find(r => r.type === 'regular')
        if (['Physics', 'Chemistry', 'Biology', 'Science'].includes(subjectName)) {
          room = classrooms.find(r => r.type === 'lab') || room
        } else if (subjectName === 'Computer Science') {
          room = classrooms.find(r => r.type === 'computer') || room
        } else if (subjectName === 'Physical Education') {
          room = classrooms.find(r => r.type === 'gym') || room
        } else if (['Art', 'Music'].includes(subjectName)) {
          room = classrooms.find(r => r.type === 'art' || r.type === 'music') || room
        }

        if (!room) {
          subjectIndex++
          continue
        }

        // Check for conflicts and skip if teacher/room is busy
        const timeKey = `${day}-${period.id}`
        const teacherKey = teacherInfo.teacherId
        const roomKey = room.id

        // Initialize tracking sets
        if (!teacherSlots.has(teacherKey)) teacherSlots.set(teacherKey, new Set())
        if (!roomSlots.has(roomKey)) roomSlots.set(roomKey, new Set())

        // Skip if teacher already teaching or room already booked
        if (teacherSlots.get(teacherKey)!.has(timeKey) || roomSlots.get(roomKey)!.has(timeKey)) {
          // Try alternate teacher/room
          const altRoom = classrooms.find(r =>
            r.type === room!.type && !roomSlots.get(r.id)?.has(timeKey)
          )
          if (altRoom) {
            room = altRoom
            if (!roomSlots.has(altRoom.id)) roomSlots.set(altRoom.id, new Set())
          } else {
            subjectIndex++
            continue
          }
        }

        try {
          await prisma.timetable.create({
            data: {
              schoolId: school.id,
              termId: term1.id,
              dayOfWeek: day,
              periodId: period.id,
              classId: classId,
              teacherId: teacherInfo.teacherId,
              classroomId: room.id,
              weekOffset: 0
            }
          })

          // Mark as busy
          teacherSlots.get(teacherKey)!.add(timeKey)
          roomSlots.get(room.id)!.add(timeKey)

          slotsCreated++
        } catch {
          // Skip on unique constraint violation (conflict)
        }

        subjectIndex++
      }
    }
  }

  console.log(`✅ ${slotsCreated} timetable slots created\n`)

  // =========================================================================
  // 9. CREATE SAMPLE STUDENTS
  // =========================================================================
  console.log('👨‍🎓 Creating sample students...')

  const studentNames = [
    { first: 'Ahmad', last: 'Hassan', gender: Gender.MALE },
    { first: 'Fatima', last: 'Ali', gender: Gender.FEMALE },
    { first: 'Mohammed', last: 'Ibrahim', gender: Gender.MALE },
    { first: 'Sara', last: 'Ahmed', gender: Gender.FEMALE },
    { first: 'Omar', last: 'Khalid', gender: Gender.MALE },
    { first: 'Aisha', last: 'Mohamed', gender: Gender.FEMALE },
    { first: 'Youssef', last: 'Hassan', gender: Gender.MALE },
    { first: 'Mariam', last: 'Saleh', gender: Gender.FEMALE },
    { first: 'Hassan', last: 'Omar', gender: Gender.MALE },
    { first: 'Layla', last: 'Ibrahim', gender: Gender.FEMALE },
  ]

  let studentsCreated = 0
  const classArray = Array.from(classMap.entries())

  for (let i = 0; i < studentNames.length; i++) {
    const sn = studentNames[i]
    const email = `${sn.first.toLowerCase()}.${sn.last.toLowerCase()}${i}@student.portsudan.edu.sd`

    const user = await prisma.user.upsert({
      where: { email_schoolId: { email, schoolId: school.id } },
      update: {},
      create: {
        email,
        role: UserRole.STUDENT,
        password: passwordHash,
        emailVerified: new Date(),
        schoolId: school.id
      }
    })

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        schoolId: school.id,
        userId: user.id,
        givenName: sn.first,
        surname: sn.last,
        dateOfBirth: new Date(2008 + (i % 5), (i % 12), (i % 28) + 1),
        gender: sn.gender
      }
    })

    // Assign to a class
    const [className, classId] = classArray[i % classArray.length]
    await prisma.studentClass.upsert({
      where: {
        schoolId_studentId_classId: {
          schoolId: school.id,
          studentId: student.id,
          classId: classId
        }
      },
      update: {},
      create: {
        schoolId: school.id,
        studentId: student.id,
        classId: classId
      }
    })

    studentsCreated++
  }

  console.log(`✅ ${studentsCreated} students created and enrolled\n`)

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('═'.repeat(60))
  console.log('🎉 COMPREHENSIVE TIMETABLE SEED COMPLETE')
  console.log('═'.repeat(60))
  console.log(`📚 School: ${school.name}`)
  console.log(`🌐 Domain: ${school.domain}`)
  console.log(`📊 Year Levels: ${yearLevels.length}`)
  console.log(`📅 Periods: ${periods.length} (${teachingPeriods.length} teaching)`)
  console.log(`📖 Subjects: ${subjectMap.size}`)
  console.log(`👨‍🏫 Teachers: ${teacherMap.size}`)
  console.log(`🏫 Classrooms: ${classrooms.length}`)
  console.log(`📚 Classes: ${classMap.size}`)
  console.log(`📅 Timetable Slots: ${slotsCreated}`)
  console.log(`👨‍🎓 Students: ${studentsCreated}`)
  console.log('═'.repeat(60))
  console.log('\n✅ View at: http://portsudan.localhost:3000/en/timetable')
  console.log('🔑 Login: any teacher/student email with password: password123\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
