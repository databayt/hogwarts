/**
 * Timetable Seed Module
 * Creates school week config and comprehensive timetable entries
 * with proper conflict avoidance
 */

import type { SeedPrisma, PeriodRef, ClassRef } from "./types";
import { WORKING_DAYS } from "./constants";

interface ClassWithDetails {
  id: string;
  name: string;
  teacherId: string | null;
  classroomId: string | null;
  subjectId: string | null;
}

export async function seedTimetable(
  prisma: SeedPrisma,
  schoolId: string,
  termId: string,
  periods: PeriodRef[],
  classes: ClassRef[]
): Promise<void> {
  console.log("📅 Creating timetable...");

  // Create week config
  await prisma.schoolWeekConfig.create({
    data: {
      schoolId,
      termId,
      workingDays: WORKING_DAYS,
      defaultLunchAfterPeriod: 4, // Lunch after 4th period
    },
  });

  // Get classes with teacher, classroom, and subject info
  const classesWithDetails: ClassWithDetails[] = await prisma.class.findMany({
    where: { schoolId, termId },
    select: {
      id: true,
      name: true,
      teacherId: true,
      classroomId: true,
      subjectId: true,
    },
  });

  // Track conflicts
  const teacherSlots = new Map<string, Set<string>>(); // teacherId -> Set of "day-period"
  const roomSlots = new Map<string, Set<string>>(); // roomId -> Set of "day-period"
  const classSlots = new Map<string, Set<string>>(); // classId -> Set of "day-period"

  // Helper to check and reserve a slot
  const tryReserveSlot = (
    day: number,
    periodId: string,
    teacherId: string,
    roomId: string,
    classId: string
  ): boolean => {
    const slotKey = `${day}-${periodId}`;

    // Check teacher conflict
    if (!teacherSlots.has(teacherId)) teacherSlots.set(teacherId, new Set());
    if (teacherSlots.get(teacherId)!.has(slotKey)) return false;

    // Check room conflict
    if (!roomSlots.has(roomId)) roomSlots.set(roomId, new Set());
    if (roomSlots.get(roomId)!.has(slotKey)) return false;

    // Check class conflict (same class can't have two subjects at same time)
    if (!classSlots.has(classId)) classSlots.set(classId, new Set());
    if (classSlots.get(classId)!.has(slotKey)) return false;

    // Reserve slot
    teacherSlots.get(teacherId)!.add(slotKey);
    roomSlots.get(roomId)!.add(slotKey);
    classSlots.get(classId)!.add(slotKey);

    return true;
  };

  // Timetable entries
  const timetableRows: {
    schoolId: string;
    termId: string;
    dayOfWeek: number;
    periodId: string;
    classId: string;
    teacherId: string;
    classroomId: string;
    weekOffset: number;
  }[] = [];

  // Get subjects to determine weekly hours (based on subject type)
  const subjectHours: Record<string, number> = {
    // Core subjects: 5 periods/week
    "Arabic Language": 5,
    Mathematics: 5,
    "English Language": 5,
    // Sciences: 4 periods/week
    Physics: 4,
    Chemistry: 4,
    Biology: 4,
    // Humanities: 3 periods/week
    Geography: 3,
    History: 3,
    "Islamic Studies": 3,
    // Others: 2 periods/week
    "Computer Science": 2,
    Art: 2,
    Music: 2,
    "Physical Education": 2,
  };

  // Filter valid classes
  const validClasses = classesWithDetails.filter(
    (cls) => cls.teacherId && cls.classroomId
  );

  // Group classes by grade level (extract from name like "Mathematics Grade 10 A")
  const classesByGrade = new Map<string, ClassWithDetails[]>();
  for (const cls of validClasses) {
    const gradeMatch = cls.name.match(/Grade (\d+)/);
    const grade = gradeMatch ? gradeMatch[1] : "Other";
    if (!classesByGrade.has(grade)) classesByGrade.set(grade, []);
    classesByGrade.get(grade)!.push(cls);
  }

  // Schedule each grade's classes
  for (const [grade, gradeClasses] of classesByGrade) {
    console.log(`   📚 Scheduling Grade ${grade} (${gradeClasses.length} classes)...`);

    for (const cls of gradeClasses) {
      if (!cls.teacherId || !cls.classroomId) continue;

      // Determine weekly hours for this subject
      const subjectName = cls.name.split(" Grade")[0].trim();
      const targetHours = subjectHours[subjectName] || 3;

      // Try to schedule the required number of periods
      let scheduled = 0;
      let attempts = 0;
      const maxAttempts = WORKING_DAYS.length * periods.length;

      // Distribute evenly across the week
      const preferredDays = [...WORKING_DAYS].sort(() => Math.random() - 0.5);

      for (const day of preferredDays) {
        if (scheduled >= targetHours) break;

        // Try different periods
        const shuffledPeriods = [...periods].sort(() => Math.random() - 0.5);
        for (const period of shuffledPeriods) {
          if (scheduled >= targetHours) break;
          if (attempts++ > maxAttempts) break;

          if (
            tryReserveSlot(day, period.id, cls.teacherId, cls.classroomId, cls.id)
          ) {
            timetableRows.push({
              schoolId,
              termId,
              dayOfWeek: day,
              periodId: period.id,
              classId: cls.id,
              teacherId: cls.teacherId,
              classroomId: cls.classroomId,
              weekOffset: 0, // Current week
            });
            scheduled++;
          }
        }
      }
    }
  }

  // Batch insert timetable entries
  if (timetableRows.length > 0) {
    await prisma.timetable.createMany({
      data: timetableRows,
      skipDuplicates: true,
    });
  }

  // Also create next week entries (weekOffset: 1)
  const nextWeekRows = timetableRows.map((row) => ({
    ...row,
    weekOffset: 1,
  }));

  if (nextWeekRows.length > 0) {
    await prisma.timetable.createMany({
      data: nextWeekRows,
      skipDuplicates: true,
    });
  }

  // Summary statistics
  const totalSlots = timetableRows.length;
  const uniqueTeachers = new Set(timetableRows.map((r) => r.teacherId)).size;
  const uniqueRooms = new Set(timetableRows.map((r) => r.classroomId)).size;
  const uniqueClasses = new Set(timetableRows.map((r) => r.classId)).size;

  console.log(`   ✅ Created: ${totalSlots * 2} timetable entries (2 weeks)`);
  console.log(`      - ${uniqueTeachers} teachers scheduled`);
  console.log(`      - ${uniqueRooms} rooms utilized`);
  console.log(`      - ${uniqueClasses} classes scheduled\n`);
}
