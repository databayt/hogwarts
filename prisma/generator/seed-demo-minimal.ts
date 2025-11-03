/**
 * Minimal seed for production - just creates demo school
 * Run with: DATABASE_URL=<production-url> tsx prisma/generator/seed-demo-minimal.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding demo school for production...");

  // Check if demo school already exists
  const existing = await prisma.school.findUnique({
    where: { domain: "demo" },
  });

  if (existing) {
    console.log("✅ Demo school already exists:", existing.name);
    return;
  }

  // Create demo school
  const school = await prisma.school.create({
    data: {
      name: "Demo International School",
      domain: "demo",
      email: "info@demo.school.sd",
      website: "https://demo.school.sd",
      timezone: "Africa/Khartoum",
      planType: "enterprise",
      maxStudents: 2500,
      maxTeachers: 240,
    },
  });

  console.log("✅ Created demo school:", school.name);
  console.log("   Domain:", school.domain);
  console.log("   ID:", school.id);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
