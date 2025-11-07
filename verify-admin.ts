import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const school = await prisma.school.findUnique({
    where: { domain: "demo" },
    select: { id: true, name: true }
  })
  
  if (!school) {
    console.log("❌ School not found!")
    return
  }
  
  const user = await prisma.user.findUnique({
    where: {
      email_schoolId: {
        email: "admin@databayt.org",
        schoolId: school.id
      }
    },
    select: {
      id: true,
      email: true,
      role: true,
      schoolId: true,
      emailVerified: true
    }
  })
  
  console.log("\n✅ Admin user with simplified email:")
  console.log(user ? JSON.stringify(user, null, 2) : "❌ NOT FOUND")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
