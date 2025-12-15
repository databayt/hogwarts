/**
 * Standalone script to seed ONLY the missing/empty tables
 * Run this separately when the main seed is complete but tables are empty
 *
 * Usage: npx tsx prisma/seeds/seed-missing-only.ts
 */

import { PrismaClient } from "@prisma/client";
import { seedMissingData } from "./missing";
import type { SeedPrisma } from "./types";

const prisma = new PrismaClient() as SeedPrisma;

async function main() {
  console.log("\n" + "=".repeat(50));
  console.log("  🔧 SEED MISSING DATA ONLY");
  console.log("=".repeat(50) + "\n");

  // Get the school
  const school = await prisma.school.findFirst({ where: { domain: "demo" } });
  if (!school) {
    console.error("❌ No demo school found. Run full seed first.");
    process.exit(1);
  }

  console.log(`📍 School: ${school.name}`);
  console.log(`🆔 ID: ${school.id}\n`);

  const startTime = Date.now();

  try {
    await seedMissingData(prisma, school.id);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("=".repeat(50));
    console.log(`  ✅ COMPLETED in ${elapsed}s`);
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("\n❌ SEED FAILED:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
