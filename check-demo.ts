import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log("🔍 Checking database for demo school...\n");

  try {
    // Test connection
    await prisma.$connect();
    console.log("✅ Database connected successfully!\n");

    // Check if demo school exists
    const demoSchool = await prisma.school.findUnique({
      where: { domain: "demo" },
    });

    if (demoSchool) {
      console.log(`✅ Demo school exists: ${demoSchool.name}`);
      console.log(`   ID: ${demoSchool.id}`);
      console.log(`   Domain: ${demoSchool.domain}`);
      console.log(`   Email: ${demoSchool.email}\n`);

      // Count existing data
      const studentCount = await prisma.student.count({ where: { schoolId: demoSchool.id } });
      const teacherCount = await prisma.teacher.count({ where: { schoolId: demoSchool.id } });
      const subjectCount = await prisma.subject.count({ where: { schoolId: demoSchool.id } });

      console.log(`📊 Existing Data:`);
      console.log(`   Students: ${studentCount}`);
      console.log(`   Teachers: ${teacherCount}`);
      console.log(`   Subjects: ${subjectCount}\n`);

      if (studentCount > 0 || teacherCount > 0) {
        console.log("⚠️  Demo school already has data. Seeding will add to existing data.");
      } else {
        console.log("✅ Demo school is empty and ready for seeding!");
      }
    } else {
      console.log("ℹ️  Demo school does not exist. It will be created during seeding.");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
