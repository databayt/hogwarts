import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { email: "admin@databayt.org" },
    select: {
      id: true,
      email: true,
      role: true,
      schoolId: true,
      createdAt: true,
      password: true,
    },
    orderBy: { createdAt: "desc" },
  })

  console.log("Total users with admin@databayt.org:", users.length)
  console.log(
    JSON.stringify(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        schoolId: u.schoolId,
        createdAt: u.createdAt,
        hasPassword: !!u.password,
      })),
      null,
      2
    )
  )
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
