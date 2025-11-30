/**
 * Academic Seed Module
 * Creates academic structure: years, terms, levels, periods
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
  console.log("📚 Creating academic structure...");

  // School Year
  const schoolYear = await prisma.schoolYear.create({
    data: {
      schoolId,
      yearName: "2025-2026",
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
    },
  });

  // Periods
  for (const p of PERIODS) {
    await prisma.period.create({
      data: {
        schoolId,
        yearId: schoolYear.id,
        name: p.name,
        startTime: timeAt(p.startHour, p.startMin),
        endTime: timeAt(p.endHour, p.endMin),
      },
    });
  }
  const periods = await prisma.period.findMany({
    where: { schoolId, yearId: schoolYear.id },
    orderBy: { name: "asc" },
  });

  // Terms
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

  // Year Levels
  for (const [index, levelName] of YEAR_LEVELS.entries()) {
    await prisma.yearLevel.create({
      data: { schoolId, levelName, levelOrder: index + 1 },
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
