/**
 * Academic Seed Module
 * Creates academic structure: years, terms, levels, periods
 * Aligned with Sudanese academic calendar (September - June)
 */

import type { SeedPrisma, SchoolYearRef, TermRef, YearLevelRef, PeriodRef } from "./types";
import { YEAR_LEVELS, PERIODS, timeAt } from "./constants";

export async function seedAcademic(
  prisma: SeedPrisma,
  schoolId: string
): Promise<{
  schoolYear: SchoolYearRef;
  term1: TermRef;
  term2: TermRef;
  yearLevels: YearLevelRef[];
  periods: PeriodRef[];
}> {
  console.log("📚 Creating academic structure (Sudanese Calendar)...");

  // School Year - Sudanese academic year (September - June) - upsert by yearName
  const schoolYear = await prisma.schoolYear.upsert({
    where: { schoolId_yearName: { schoolId, yearName: "2025-2026" } },
    update: {
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
    },
    create: {
      schoolId,
      yearName: "2025-2026",
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
    },
  });

  // Periods - Sudanese school day (7:45 AM - 3:20 PM, Sun-Thu) - upsert by name
  for (const p of PERIODS) {
    await prisma.period.upsert({
      where: { schoolId_yearId_name: { schoolId, yearId: schoolYear.id, name: p.nameEn } },
      update: {
        startTime: timeAt(p.startHour, p.startMin),
        endTime: timeAt(p.endHour, p.endMin),
      },
      create: {
        schoolId,
        yearId: schoolYear.id,
        name: p.nameEn,
        startTime: timeAt(p.startHour, p.startMin),
        endTime: timeAt(p.endHour, p.endMin),
      },
    });
  }
  const periods = await prisma.period.findMany({
    where: { schoolId, yearId: schoolYear.id },
    orderBy: { name: "asc" },
  });

  // Terms - Sudanese school terms - upsert by termNumber
  const term1 = await prisma.term.upsert({
    where: { schoolId_yearId_termNumber: { schoolId, yearId: schoolYear.id, termNumber: 1 } },
    update: {
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-01-15T00:00:00Z"),
    },
    create: {
      schoolId,
      yearId: schoolYear.id,
      termNumber: 1,
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-01-15T00:00:00Z"),
    },
  });

  const term2 = await prisma.term.upsert({
    where: { schoolId_yearId_termNumber: { schoolId, yearId: schoolYear.id, termNumber: 2 } },
    update: {
      startDate: new Date("2026-01-16T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
    },
    create: {
      schoolId,
      yearId: schoolYear.id,
      termNumber: 2,
      startDate: new Date("2026-01-16T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
    },
  });

  // Year Levels - Sudanese education system (bilingual AR/EN)
  // Check if existing year levels match expected pattern
  const existingLevels = await prisma.yearLevel.findMany({
    where: { schoolId },
    orderBy: { levelOrder: "asc" },
  });

  // Check for data mismatch (wrong order mappings from previous seeds)
  const hasDataMismatch = existingLevels.some((existing) => {
    const expected = YEAR_LEVELS.find((l) => l.en === existing.levelName);
    return expected && expected.order !== existing.levelOrder;
  });

  if (hasDataMismatch || existingLevels.length !== YEAR_LEVELS.length) {
    // Reset year levels if data is inconsistent (dev database cleanup)
    console.log("   🔄 Resetting year levels (data mismatch detected)...");

    // First, delete dependent records (StudentYearLevel) that reference old levels
    const levelIds = existingLevels.map((l) => l.id);
    if (levelIds.length > 0) {
      await prisma.studentYearLevel.deleteMany({
        where: { levelId: { in: levelIds } },
      });
    }

    // Now safe to delete year levels
    await prisma.yearLevel.deleteMany({ where: { schoolId } });

    // Create all year levels with correct order
    for (const level of YEAR_LEVELS) {
      await prisma.yearLevel.create({
        data: {
          schoolId,
          levelName: level.en,
          levelNameAr: level.ar,
          levelOrder: level.order,
        },
      });
    }
  } else {
    // Additive pattern: only add missing levels or update Arabic names
    for (const level of YEAR_LEVELS) {
      const existingByName = await prisma.yearLevel.findFirst({
        where: { schoolId, levelName: level.en },
      });

      if (!existingByName) {
        // Only create if order is also free
        const existingByOrder = await prisma.yearLevel.findFirst({
          where: { schoolId, levelOrder: level.order },
        });

        if (!existingByOrder) {
          await prisma.yearLevel.create({
            data: {
              schoolId,
              levelName: level.en,
              levelNameAr: level.ar,
              levelOrder: level.order,
            },
          });
        }
      } else if (!existingByName.levelNameAr) {
        // Only update Arabic name if missing
        await prisma.yearLevel.update({
          where: { id: existingByName.id },
          data: { levelNameAr: level.ar },
        });
      }
    }
  }
  const yearLevels = await prisma.yearLevel.findMany({
    where: { schoolId },
    orderBy: { levelOrder: "asc" },
  });

  console.log(`   ✅ Created: 1 school year, ${periods.length} periods, 2 terms, ${yearLevels.length} year levels\n`);

  return {
    schoolYear: { id: schoolYear.id },
    term1: { id: term1.id },
    term2: { id: term2.id },
    yearLevels: yearLevels.map(l => ({ id: l.id, levelName: l.levelName })),
    periods: periods.map(p => ({ id: p.id })),
  };
}
