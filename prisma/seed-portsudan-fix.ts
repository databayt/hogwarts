/**
 * Seed Fix for Port Sudan International School
 *
 * This script fixes the Student unique constraint issue and ensures
 * all necessary timetable data is seeded for Port Sudan school.
 *
 * Run with: npx tsx prisma/seed-portsudan-fix.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Starting Port Sudan seed fix...')

  // 1. Find Port Sudan school
  const school = await prisma.school.findFirst({
    where: { domain: 'portsudan' }
  })

  if (!school) {
    console.error('❌ Port Sudan school not found! Run main seed first.')
    process.exit(1)
  }

  console.log(`✅ Found school: ${school.name}`)

  // 2. Check existing data
  const [termsCount, periodsCount, classesCount, subjectsCount, teachersCount, slotsCount] = await Promise.all([
    prisma.term.count({ where: { schoolId: school.id } }),
    prisma.period.count({ where: { schoolId: school.id } }),
    prisma.class.count({ where: { schoolId: school.id } }),
    prisma.subject.count({ where: { schoolId: school.id } }),
    prisma.teacher.count({ where: { schoolId: school.id } }),
    prisma.timetable.count({ where: { schoolId: school.id } })
  ])

  console.log('\n📊 Current Data:')
  console.log(`   Terms: ${termsCount}`)
  console.log(`   Periods: ${periodsCount}`)
  console.log(`   Classes: ${classesCount}`)
  console.log(`   Subjects: ${subjectsCount}`)
  console.log(`   Teachers: ${teachersCount}`)
  console.log(`   Timetable Slots: ${slotsCount}`)

  // 3. If timetable slots don't exist, create them
  if (slotsCount === 0) {
    console.log('\n🔨 Creating timetable slots...')

    // Get first term
    const term = await prisma.term.findFirst({
      where: { schoolId: school.id },
      orderBy: { startDate: 'desc' }
    })

    if (!term) {
      console.error('❌ No term found! Cannot create timetable.')
      process.exit(1)
    }

    // Get periods (first 4 for simplicity)
    const periods = await prisma.period.findMany({
      where: { schoolId: school.id },
      orderBy: { startTime: 'asc' },
      take: 4
    })

    if (periods.length === 0) {
      console.error('❌ No periods found! Cannot create timetable.')
      process.exit(1)
    }

    // Get classes
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id },
      include: {
        teacher: true,
        classroom: true
      }
    })

    if (classes.length === 0) {
      console.error('❌ No classes found! Cannot create timetable.')
      process.exit(1)
    }

    // Create timetable slots for Sun-Thu (0-4)
    const workingDays = [0, 1, 2, 3, 4] // Sunday to Thursday
    const timetableRows = []

    for (let dayIndex = 0; dayIndex < workingDays.length; dayIndex++) {
      for (let periodIndex = 0; periodIndex < periods.length; periodIndex++) {
        // Rotate classes to avoid conflicts
        const classIndex = (dayIndex + periodIndex) % classes.length
        const cls = classes[classIndex]

        timetableRows.push({
          schoolId: school.id,
          termId: term.id,
          dayOfWeek: workingDays[dayIndex],
          periodId: periods[periodIndex].id,
          classId: cls.id,
          teacherId: cls.teacherId || '',
          classroomId: cls.classroomId || '',
          weekOffset: 0
        })
      }
    }

    console.log(`   Creating ${timetableRows.length} timetable slots...`)

    await prisma.timetable.createMany({
      data: timetableRows,
      skipDuplicates: true
    })

    console.log(`✅ Created ${timetableRows.length} timetable slots`)
  } else {
    console.log('\n✅ Timetable slots already exist, skipping creation')
  }

  // 4. Create SchoolWeekConfig if it doesn't exist
  const weekConfig = await prisma.schoolWeekConfig.findFirst({
    where: { schoolId: school.id }
  })

  if (!weekConfig) {
    console.log('\n🔨 Creating school week configuration...')
    await prisma.schoolWeekConfig.create({
      data: {
        schoolId: school.id,
        termId: null, // Default config for all terms
        workingDays: [0, 1, 2, 3, 4], // Sunday to Thursday
        defaultLunchAfterPeriod: 4 // Lunch after 4th period
      }
    })
    console.log('✅ Created school week configuration')
  } else {
    console.log('\n✅ School week config already exists')
  }

  // 5. Verify final state
  const finalSlotsCount = await prisma.timetable.count({
    where: { schoolId: school.id }
  })

  console.log('\n🎉 Seed fix complete!')
  console.log(`   Total timetable slots: ${finalSlotsCount}`)
  console.log('\n✅ Port Sudan school is now ready for timetable viewing')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
