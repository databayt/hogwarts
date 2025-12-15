import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkDemoUser() {
  console.log("\n🔍 Checking Demo School and User...\n")

  // Check if demo school exists
  const demoSchool = await prisma.school.findUnique({
    where: { domain: "demo" },
  })

  console.log(
    "📍 Demo School:",
    demoSchool
      ? {
          id: demoSchool.id,
          name: demoSchool.name,
          domain: demoSchool.domain,
          email: demoSchool.email,
        }
      : "NOT FOUND ❌"
  )

  if (demoSchool) {
    // Check admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        email: "admin@demo.databayt.org",
        schoolId: demoSchool.id,
      },
    })

    console.log(
      "\n👤 Admin User:",
      adminUser
        ? {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            schoolId: adminUser.schoolId,
            hasPassword: !!adminUser.password,
          }
        : "NOT FOUND ❌"
    )

    // Check all users for this school
    const allUsers = await prisma.user.findMany({
      where: { schoolId: demoSchool.id },
      select: { email: true, role: true, schoolId: true },
    })

    console.log("\n📋 All Demo School Users:")
    allUsers.forEach((u) => console.log(`  - ${u.email} (${u.role})`))
  }

  // Check if there's any user with this email but different schoolId
  const otherAdmins = await prisma.user.findMany({
    where: { email: "admin@demo.databayt.org" },
  })

  if (otherAdmins.length > 0) {
    console.log("\n⚠️  Found admin@demo.databayt.org with schoolId:")
    otherAdmins.forEach((u) =>
      console.log(`  - schoolId: ${u.schoolId || "NULL"}, role: ${u.role}`)
    )
  }

  await prisma.$disconnect()
}

checkDemoUser().catch(console.error)
