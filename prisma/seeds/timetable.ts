/**
 * Timetable Seed Module
 * Creates school week config and timetable entries
 */

import type { SeedPrisma, PeriodRef, ClassRef } from "./types";
import { WORKING_DAYS } from "./constants";

export async function seedTimetable(
  prisma: SeedPrisma,
  schoolId: string,
  termId: string,
  periods: PeriodRef[],
  classes: ClassRef[]
): Promise<void> {
  console.log("📅 Creating timetable...");

  // Week config
  await prisma.schoolWeekConfig.create({
    data: {
      schoolId,
      termId,
      workingDays: WORKING_DAYS,
      defaultLunchAfterPeriod: 4,
    },
  });

  // Get classes with teacher and classroom info
  const classesWithDetails = await prisma.class.findMany({
    where: { schoolId, termId },
    select: { id: true, name: true, teacherId: true, classroomId: true },
    take: 20,
  });

  // Timetable entries
  const timetableRows: {
    schoolId: string;
    termId: string;
    dayOfWeek: number;
    periodId: string;
    classId: string;
    teacherId: string | null;
    classroomId: string | null;
    weekOffset: number;
  }[] = [];

  for (let d = 0; d < WORKING_DAYS.length; d++) {
    for (let p = 0; p < Math.min(6, periods.length); p++) {
      const cls = classesWithDetails[(d + p) % classesWithDetails.length];
      if (cls) {
        timetableRows.push({
          schoolId,
          termId,
          dayOfWeek: WORKING_DAYS[d],
          periodId: periods[p].id,
          classId: cls.id,
          teacherId: cls.teacherId,
          classroomId: cls.classroomId,
          weekOffset: 0,
        });
      }
    }
  }

  if (timetableRows.length > 0) {
    await prisma.timetable.createMany({ data: timetableRows, skipDuplicates: true });
  }

  console.log(`   ✅ Created: ${timetableRows.length} timetable entries\n`);
}
