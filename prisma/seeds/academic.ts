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

  // School Year - Sudanese academic year (September - June)
  const schoolYear = await prisma.schoolYear.create({
    data: {
      schoolId,
      yearName: "2025-2026",
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
    },
  });

  // Periods - Sudanese school day (7:45 AM - 3:20 PM, Sun-Thu)
  for (const p of PERIODS) {
    await prisma.period.create({
      data: {
        schoolId,
        yearId: schoolYear.id,
        name: p.nameEn, // English for database storage
        startTime: timeAt(p.startHour, p.startMin),
        endTime: timeAt(p.endHour, p.endMin),
      },
    });
  }
  const periods = await prisma.period.findMany({
    where: { schoolId, yearId: schoolYear.id },
    orderBy: { name: "asc" },
  });

  // Terms - Sudanese school terms
  const term1 = await prisma.term.create({
    data: {
      schoolId,
      yearId: schoolYear.id,
      termNumber: 1,
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-01-15T00:00:00Z"),
    },
  });

  const term2 = await prisma.term.create({
    data: {
      schoolId,
      yearId: schoolYear.id,
      termNumber: 2,
      startDate: new Date("2026-01-16T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
    },
  });

  // Year Levels - Sudanese education system (bilingual AR/EN)
  for (const level of YEAR_LEVELS) {
    await prisma.yearLevel.create({
      data: {
        schoolId,
        levelName: level.en,
        levelNameAr: level.ar,  // Arabic name for bilingual support
        levelOrder: level.order,
      },
    });
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
