/**
 * Enhanced Timetable Seeding Script
 * Generates comprehensive, realistic timetable data with:
 * - Proper subject distribution
 * - Multiple school configurations
 * - Teacher specializations
 * - Intentional conflicts for testing
 * - Multi-week data
 */

import { PrismaClient } from '@prisma/client'
import {
  generateRealisticTimetable,
  createSampleTeachers,
  createSampleClassrooms,
  createSamplePeriods,
  SCHOOL_CONFIGS,
  TEACHER_SPECIALIZATIONS,
} from '@/components/platform/timetable/seed-utils'

const prisma = new PrismaClient()

/**
 * Seeds enhanced timetable data for a school
 */
export async function seedEnhancedTimetable(
  schoolId: string,
  termId: string,
  yearId: string,
  options: {
    classCount?: number
    teacherCount?: number
    roomCount?: number
    periodCount?: number
    includeConflicts?: boolean
    includeNextWeek?: boolean
    configType?: keyof typeof SCHOOL_CONFIGS
  } = {}
) {
  const {
    classCount = 10,
    teacherCount = 15,
    roomCount = 12,
    periodCount = 8,
    includeConflicts = true,
    includeNextWeek = true,
    configType = 'arabicSchool',
  } = options

  console.log('🎯 Starting enhanced timetable seeding...')

  // Get school configuration
  const config = SCHOOL_CONFIGS[configType]

  try {
    // 1. Create or update SchoolWeekConfig
    console.log('📅 Setting up school week configuration...')
    await prisma.schoolWeekConfig.upsert({
      where: {
        schoolId_termId: {
          schoolId,
          termId,
        },
      },
      update: {
        workingDays: [...config.workingDays],
        defaultLunchAfterPeriod: config.defaultLunchAfterPeriod,
        extraLunchRules: {
          friday: {
            afterPeriod: 2,
            duration: 45,
          },
        },
      },
      create: {
        schoolId,
        termId,
        workingDays: [...config.workingDays],
        defaultLunchAfterPeriod: config.defaultLunchAfterPeriod,
        extraLunchRules: {
          friday: {
            afterPeriod: 2,
            duration: 45,
          },
        },
      },
    })

    // Note: School-wide default config (without termId) would require schema changes
    // Skipping school-wide default for now

    console.log('✅ School week configuration set')

    // 2. Ensure we have enough teachers with specializations
    console.log('👩‍🏫 Checking teachers...')
    const existingTeachers = await prisma.teacher.findMany({
      where: { schoolId },
      select: { id: true, givenName: true, surname: true },
    })

    const teachersToCreate = Math.max(0, teacherCount - existingTeachers.length)
    if (teachersToCreate > 0) {
      console.log(`Creating ${teachersToCreate} additional teachers...`)
      const specializations = Object.keys(TEACHER_SPECIALIZATIONS) as Array<
        keyof typeof TEACHER_SPECIALIZATIONS
      >

      for (let i = 0; i < teachersToCreate; i++) {
        const specialization = specializations[i % specializations.length]
        const teacherNum = existingTeachers.length + i + 1

        await prisma.teacher.create({
          data: {
            schoolId,
            givenName: `${specialization.replace('Teacher', '')}`,
            surname: `Teacher${teacherNum}`,
            emailAddress: `teacher${teacherNum}@${schoolId}.edu`,
            gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
            employmentStatus: 'ACTIVE',
            employmentType: 'FULL_TIME',
            birthDate: new Date(1980 + (i % 20), i % 12, (i % 28) + 1),
            joiningDate: new Date(),
            // Note: Specialization would be added via TeacherQualification relation
            // Skipping for seed simplicity
          },
        })
      }
    }

    const allTeachers = await prisma.teacher.findMany({
      where: { schoolId },
      select: { id: true },
    })

    console.log(`✅ ${allTeachers.length} teachers available`)

    // 3. Ensure we have enough classrooms
    console.log('🏫 Checking classrooms...')
    const existingRooms = await prisma.classroom.findMany({
      where: { schoolId },
      select: { id: true, roomName: true },
    })

    const roomsToCreate = Math.max(0, roomCount - existingRooms.length)
    if (roomsToCreate > 0) {
      console.log(`Creating ${roomsToCreate} additional classrooms...`)
      const roomTypes = ['STANDARD', 'LAB', 'COMPUTER', 'ART', 'MUSIC', 'GYM']

      // Create or get classroom types
      const classroomTypes = await Promise.all(
        roomTypes.map(async (typeName) =>
          prisma.classroomType.upsert({
            where: {
              schoolId_name: {
                schoolId,
                name: typeName,
              },
            },
            create: {
              schoolId,
              name: typeName,
            },
            update: {},
          })
        )
      )

      for (let i = 0; i < roomsToCreate; i++) {
        const roomNum = existingRooms.length + i + 1
        const classroomType = classroomTypes[i % classroomTypes.length]

        await prisma.classroom.create({
          data: {
            schoolId,
            roomName: `Room ${String(roomNum).padStart(3, '0')}`,
            typeId: classroomType.id,
            capacity: 30 + (i % 3) * 5,
          },
        })
      }
    }

    const allRooms = await prisma.classroom.findMany({
      where: { schoolId },
      select: { id: true },
    })

    console.log(`✅ ${allRooms.length} classrooms available`)

    // 4. Ensure we have periods
    console.log('⏰ Checking periods...')
    const existingPeriods = await prisma.period.findMany({
      where: { schoolId, yearId },
      orderBy: { startTime: 'asc' },
      select: { id: true, name: true },
    })

    if (existingPeriods.length < periodCount) {
      console.log(`Creating ${periodCount - existingPeriods.length} additional periods...`)
      const baseTime = new Date('2024-01-01T08:00:00')

      for (let i = existingPeriods.length; i < periodCount; i++) {
        const startTime = new Date(baseTime.getTime() + i * 50 * 60000) // 50 minutes per period
        const endTime = new Date(startTime.getTime() + 45 * 60000) // 45 minute periods

        await prisma.period.create({
          data: {
            schoolId,
            yearId,
            name: `Period ${i + 1}`,
            startTime,
            endTime,
          },
        })
      }
    }

    const allPeriods = await prisma.period.findMany({
      where: { schoolId, yearId },
      orderBy: { startTime: 'asc' },
      select: { id: true },
    })

    console.log(`✅ ${allPeriods.length} periods available`)

    // 5. Get existing classes
    console.log('📚 Getting classes...')
    const classes = await prisma.class.findMany({
      where: { schoolId, termId },
      select: {
        id: true,
        name: true,
        teacherId: true,
        classroomId: true,
      },
      take: classCount,
    })

    if (classes.length === 0) {
      console.log('⚠️ No classes found for this term. Creating sample classes...')

      // Get or create a default subject
      const defaultSubject = await prisma.subject.findFirst({
        where: { schoolId },
      })

      if (!defaultSubject) {
        console.log('⚠️ No subjects found. Skipping class creation.')
        return
      }

      // Create sample classes
      for (let i = 0; i < classCount; i++) {
        const grade = Math.floor(i / 2) + 1
        const section = i % 2 === 0 ? 'A' : 'B'
        const teacher = allTeachers[i % allTeachers.length]
        const room = allRooms[i % allRooms.length]

        const newClass = await prisma.class.create({
          data: {
            schoolId,
            termId,
            subjectId: defaultSubject.id,
            name: `Grade ${grade}-${section}`,
            teacherId: teacher.id,
            classroomId: room.id,
            maxCapacity: 30,
            startPeriodId: allPeriods[0].id,
            endPeriodId: allPeriods[allPeriods.length - 1].id,
          },
        })

        classes.push({
          id: newClass.id,
          name: newClass.name,
          teacherId: newClass.teacherId,
          classroomId: newClass.classroomId!,
        })
      }
    }

    console.log(`✅ ${classes.length} classes available`)

    // 6. ADDITIVE APPROACH: Skip deletion, use skipDuplicates instead
    // This preserves existing data and only adds missing slots
    console.log('📝 Using additive approach (preserving existing data)...')

    // 7. Generate realistic timetable
    console.log('📊 Generating realistic timetable...')
    const teachersWithSpec = allTeachers.map((t, i) => ({
      id: t.id,
      specialization: 'mathTeacher' as keyof typeof TEACHER_SPECIALIZATIONS,
    }))

    const timetableSlots = generateRealisticTimetable({
      schoolId,
      termId,
      classes: classes.filter(c => c.classroomId), // Only classes with rooms
      periods: allPeriods,
      teachers: teachersWithSpec,
      workingDays: [...config.workingDays],
      includeConflicts,
      includeNextWeek,
    })

    console.log(`📝 Generated ${timetableSlots.length} timetable slots`)

    // 8. Insert timetable data in batches
    console.log('💾 Saving timetable to database...')
    const batchSize = 100
    let inserted = 0

    for (let i = 0; i < timetableSlots.length; i += batchSize) {
      const batch = timetableSlots.slice(i, i + batchSize)
      await prisma.timetable.createMany({
        data: batch,
        skipDuplicates: true,
      })
      inserted += batch.length
      console.log(`  Inserted ${inserted}/${timetableSlots.length} slots...`)
    }

    console.log('✅ Timetable data saved successfully')

    // 9. Generate statistics
    console.log('\n📈 Timetable Statistics:')

    const stats = await prisma.timetable.groupBy({
      by: ['weekOffset'],
      where: { schoolId, termId },
      _count: true,
    })

    stats.forEach(stat => {
      console.log(
        `  Week ${stat.weekOffset === 0 ? 'Current' : 'Next'}: ${stat._count} slots`
      )
    })

    // Check for conflicts
    if (includeConflicts) {
      console.log('\n⚠️ Intentional Conflicts Created:')

      // Teacher conflicts
      const teacherConflicts = await prisma.timetable.groupBy({
        by: ['teacherId', 'dayOfWeek', 'periodId', 'weekOffset'],
        where: { schoolId, termId },
        _count: true,
        having: {
          dayOfWeek: {
            _count: {
              gt: 1,
            },
          },
        },
      })

      console.log(`  Teacher conflicts: ${teacherConflicts.length}`)

      // Room conflicts
      const roomConflicts = await prisma.timetable.groupBy({
        by: ['classroomId', 'dayOfWeek', 'periodId', 'weekOffset'],
        where: { schoolId, termId },
        _count: true,
        having: {
          dayOfWeek: {
            _count: {
              gt: 1,
            },
          },
        },
      })

      console.log(`  Room conflicts: ${roomConflicts.length}`)
    }

    console.log('\n✅✅✅ Enhanced timetable seeding completed successfully!')

    return {
      slotsCreated: timetableSlots.length,
      classCount: classes.length,
      teacherCount: allTeachers.length,
      roomCount: allRooms.length,
      periodCount: allPeriods.length,
    }
  } catch (error) {
    console.error('❌ Error seeding timetable:', error)
    throw error
  }
}

/**
 * Main seeding function - can be called directly
 */
export async function main() {
  console.log('🚀 Starting enhanced timetable seeding process...')

  try {
    // Get first school (or create one for testing)
    let school = await prisma.school.findFirst()

    if (!school) {
      console.log('Creating test school...')
      school = await prisma.school.create({
        data: {
          name: 'Hogwarts International School',
          domain: 'hogwarts',
          address: 'Platform 9¾, London',
          phoneNumber: '+44-20-1234-5678',
          email: 'info@hogwarts.edu',
          website: 'https://hogwarts.edu',
          logoUrl: '/logo.png',
        },
      })
    }

    // Get or create school year
    let schoolYear = await prisma.schoolYear.findFirst({
      where: { schoolId: school.id },
    })

    if (!schoolYear) {
      console.log('Creating school year...')
      schoolYear = await prisma.schoolYear.create({
        data: {
          schoolId: school.id,
          yearName: '2024-2025',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-06-30'),
        },
      })
    }

    // Get or create term
    let term = await prisma.term.findFirst({
      where: { yearId: schoolYear.id },
    })

    if (!term) {
      console.log('Creating term...')
      term = await prisma.term.create({
        data: {
          schoolId: school.id,
          yearId: schoolYear.id,
          termNumber: 1,
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-12-20'),
        },
      })
    }

    // Seed enhanced timetable
    const results = await seedEnhancedTimetable(school.id, term.id, schoolYear.id, {
      classCount: 12,
      teacherCount: 20,
      roomCount: 15,
      periodCount: 8,
      includeConflicts: true, // Add test conflicts
      includeNextWeek: true, // Add next week data
      configType: 'arabicSchool', // Use Arabic school schedule
    })

    console.log('\n📊 Final Summary:')
    console.log(`  School: ${school.name}`)
    console.log(`  Term: Term ${term.termNumber}`)
    if (results) {
      console.log(`  Slots Created: ${results.slotsCreated}`)
      console.log(`  Classes: ${results.classCount}`)
      console.log(`  Teachers: ${results.teacherCount}`)
      console.log(`  Rooms: ${results.roomCount}`)
      console.log(`  Periods: ${results.periodCount}`)
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}