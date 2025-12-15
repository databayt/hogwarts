import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkSchools() {
  try {
    console.log("🔍 Checking schools in database...\n")

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`Found ${schools.length} school(s):\n`)

    schools.forEach((school, index) => {
      console.log(`${index + 1}. ${school.name}`)
      console.log(`   Domain: ${school.domain}`)
      console.log(`   Active: ${school.isActive ? "✅ Yes" : "❌ No"}`)
      console.log(`   Created: ${school.createdAt.toISOString()}`)
      console.log(`   ID: ${school.id}`)
      console.log("")
    })

    // Check specifically for demo school
    const demoSchool = schools.find((s) => s.domain === "demo")

    if (demoSchool) {
      console.log("✅ Demo school EXISTS")
      if (!demoSchool.isActive) {
        console.log("⚠️  WARNING: Demo school is INACTIVE!")
      }
    } else {
      console.log("❌ Demo school NOT FOUND")
      console.log('   Expected domain: "demo"')
      console.log("   This is likely the cause of the 404 error!")
    }

    // Check for portsudan school
    const portsudanSchool = schools.find((s) => s.domain === "portsudan")
    if (portsudanSchool) {
      console.log("✅ Port Sudan school EXISTS")
    } else {
      console.log("ℹ️  Port Sudan school not found")
    }
  } catch (error) {
    console.error("❌ Error querying database:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchools()
