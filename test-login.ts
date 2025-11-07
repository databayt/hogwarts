import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function getUserByEmail(email: string) {
  try {
    const users = await prisma.user.findMany({ 
      where: { email },
      orderBy: { createdAt: 'desc' }
    });
    return users[0] || null;
  } catch {
    return null;
  }
}

async function testLogin(email: string, password: string) {
  console.log(`\nTesting login: ${email} / ${password}`)
  console.log("=".repeat(50))
  
  const user = await getUserByEmail(email)
  console.log("\n1. getUserByEmail result:", user ? "✅ User found" : "❌ User not found")
  
  if (!user) {
    console.log("   ❌ Login failed: User not found")
    return false
  }
  
  console.log("   User ID:", user.id)
  console.log("   Email:", user.email)
  console.log("   Role:", user.role)
  console.log("   SchoolID:", user.schoolId)
  console.log("   Has password:", !!user.password)
  
  if (!user.password) {
    console.log("\n2. Password check: ❌ User has no password")
    console.log("   ❌ Login failed: No password set")
    return false
  }
  
  console.log("\n2. Comparing password with bcrypt...")
  const passwordsMatch = await bcrypt.compare(password, user.password)
  console.log("   Password matches:", passwordsMatch ? "✅ YES" : "❌ NO")
  
  if (passwordsMatch) {
    console.log("\n✅✅✅ LOGIN SUCCESSFUL!")
    return true
  } else {
    console.log("\n❌ Login failed: Incorrect password")
    return false
  }
}

async function main() {
  await testLogin("admin@databayt.org", "1234")
}

main().catch(console.error).finally(() => prisma.$disconnect())
