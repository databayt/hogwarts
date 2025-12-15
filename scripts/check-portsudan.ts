/**
 * Quick script to verify Port Sudan school exists in database
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Checking Port Sudan school in database...\n")

  const school = await prisma.school.findUnique({
    where: { domain: "portsudan" },
    select: {
      id: true,
      name: true,
      domain: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          students: true,
          teachers: true,
          yearLevels: true,
          classes: true,
        },
      },
    },
  })

  if (school) {
    console.log("✅ School found!")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`Name:      ${school.name}`)
    console.log(`Domain:    ${school.domain}`)
    console.log(`Active:    ${school.isActive}`)
    console.log(`Created:   ${school.createdAt.toISOString()}`)
    console.log(`ID:        ${school.id}`)
    console.log("\n📊 Data counts:")
    console.log(`  Students:    ${school._count.students}`)
    console.log(`  Teachers:    ${school._count.teachers}`)
    console.log(`  Year Levels: ${school._count.yearLevels}`)
    console.log(`  Classes:     ${school._count.classes}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    console.log("✅ Port Sudan school is properly configured in the database.")
    console.log("🌐 URL: https://portsudan.databayt.org")
  } else {
    console.log('❌ School not found with domain "portsudan"')
    console.log("Run: npx tsx prisma/seed-portsudan-complete.ts")
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
