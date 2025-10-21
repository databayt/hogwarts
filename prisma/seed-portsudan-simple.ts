/**
 * Simple Port Sudan Timetable Seed
 *
 * Uses EXISTING data where possible, only creates timetable slots
 * Run with: npx tsx prisma/seed-portsudan-simple.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting timetable seed for Port Sudan...\n')

  // 1. Find school
  const school = await prisma.school.findFirst({
    where: { domain: 'portsudan' }
  })

  if (!school) {
    console.error('❌ Port Sudan school not found! Run main seed first.')
    process.exit(1)
  }

  console.log(`✅ School: ${school.name}`)

  // 2. Get existing academic structure
  const schoolYear = await prisma.schoolYear.findFirst({
    where: { schoolId: school.id },
    orderBy: { startDate: 'desc' }
  })

  if (!schoolYear) {
    console.error('❌ No school year found!')
    process.exit(1)
  }

  const term1 = await prisma.term.findFirst({
    where: { schoolId: school.id, yearId: schoolYear.id },
    orderBy: { startDate: 'asc' }
  })

  if (!term1) {
    console.error('❌ No term found!')
    process.exit(1)
  }

  const periods = await prisma.period.findMany({
    where: { schoolId: school.id, yearId: schoolYear.id },
    orderBy: { name: 'asc' },
    take: 4 // Just use first 4 periods
  })

  if (periods.length === 0) {
    console.error('❌ No periods found!')
    process.exit(1)
  }

  const classes = await prisma.class.findMany({
    where: { schoolId: school.id, termId: term1.id },
    include: {
      teacher: true,
      classroom: true
    }
  })

  if (classes.length === 0) {
    console.error('❌ No classes found!')
    process.exit(1)
  }

  console.log(`📊 Found: ${classes.length} classes, ${periods.length} periods`)

  // 3. Week config (optional, skip if exists)
  console.log(`✅ Using default week config: Sun-Thu`)

  // 4. Create timetable slots
  const workingDays = [0, 1, 2, 3, 4]
  let slotsCreated = 0
  let slotsSkipped = 0

  for (const cls of classes) {
    for (const dayIndex of workingDays) {
      for (const period of periods) {
        try {
          await prisma.timetable.upsert({
            where: {
              schoolId_termId_dayOfWeek_periodId_classId_weekOffset: {
                schoolId: school.id,
                termId: term1.id,
                dayOfWeek: dayIndex,
                periodId: period.id,
                classId: cls.id,
                weekOffset: 0
              }
            },
            update: {},
            create: {
              schoolId: school.id,
              termId: term1.id,
              dayOfWeek: dayIndex,
              periodId: period.id,
              classId: cls.id,
              teacherId: cls.teacherId || '',
              classroomId: cls.classroomId || '',
              weekOffset: 0
            }
          })
          slotsCreated++
        } catch (e) {
          slotsSkipped++
        }
      }
    }
  }

  console.log(`✅ Timetable slots: ${slotsCreated} created, ${slotsSkipped} already existed`)

  // 5. Final summary
  const totalSlots = await prisma.timetable.count({
    where: { schoolId: school.id }
  })

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('🎉 SEED COMPLETE!')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`📚 School: ${school.name}`)
  console.log(`📊 Classes: ${classes.length}`)
  console.log(`📅 Periods: ${periods.length}`)
  console.log(`📅 Total Timetable Slots: ${totalSlots}`)
  console.log('═══════════════════════════════════════════════════════')
  console.log('\n✅ Visit: https://portsudan.databayt.org/en/timetable\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
