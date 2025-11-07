import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Find the demo school
  const school = await prisma.school.findUnique({
    where: { domain: "demo" },
    select: { id: true, name: true, domain: true }
  })
  
  console.log("School:", school)
  
  if (!school) {
    console.log("❌ Demo school not found!")
    return
  }
  
  // Find the admin user
  const user = await prisma.user.findUnique({
    where: {
      email_schoolId: {
        email: "admin@demo.databayt.org",
        schoolId: school.id
      }
    },
    select: {
      id: true,
      email: true,
      role: true,
      schoolId: true,
      password: true,
      emailVerified: true
    }
  })
  
  console.log("\nUser found:", user ? "✅ YES" : "❌ NO")
  
  if (user) {
    console.log("User details:", {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
      emailVerified: user.emailVerified
    })
    
    // Test password
    if (user.password) {
      const isMatch = await bcrypt.compare("1234", user.password)
      console.log("\nPassword '1234' matches:", isMatch ? "✅ YES" : "❌ NO")
    } else {
      console.log("\n❌ User has no password set!")
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
