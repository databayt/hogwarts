/**
 * Attendance Seed Module - Sudanese K-12 School
 * Creates realistic attendance data for 30 days
 *
 * Features:
 * - Sudanese weekend (Friday/Saturday)
 * - Realistic distribution: 85% present, 5% late, 8% absent
 * - Student identifiers (barcode, RFID)
 * - QR code sessions for check-in
 */

import type { AttendanceStatus, AttendanceMethod, IdentifierType } from "@prisma/client";
import type { SeedPrisma, ClassRef, StudentRef } from "./types";

export async function seedAttendance(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[],
  students: StudentRef[]
): Promise<void> {
  console.log("📊 Creating attendance data (Sudanese K-12 School)...");

  // Get class enrollments to know which students are in which class
  const enrollments = await prisma.studentClass.findMany({
    where: { schoolId },
    select: { studentId: true, classId: true }
  });

  // Build a map of classId -> studentIds
  const classStudentMap = new Map<string, string[]>();
  for (const e of enrollments) {
    if (!classStudentMap.has(e.classId)) {
      classStudentMap.set(e.classId, []);
    }
    classStudentMap.get(e.classId)!.push(e.studentId);
  }

  // Generate 30 days of attendance data
  const today = new Date();
  const attendanceRecords: {
    schoolId: string;
    studentId: string;
    classId: string;
    date: Date;
    status: AttendanceStatus;
    method: AttendanceMethod;
    checkInTime: Date;
    checkOutTime: Date | null;
    markedAt: Date;
  }[] = [];

  let totalRecords = 0;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    // Skip weekends (Friday and Saturday for Sudan)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) continue;

    // Process each class
    for (const cls of classes) {
      const studentIds = classStudentMap.get(cls.id) || [];

      for (const studentId of studentIds) {
        // Realistic distribution: 85% present, 5% late, 8% absent, 2% excused/sick
        const rand = Math.random();
        let status: AttendanceStatus;
        let checkInHour: number;
        let checkInMinute: number;

        if (rand < 0.85) {
          status = 'PRESENT';
          checkInHour = 7;
          checkInMinute = Math.floor(Math.random() * 25) + 30; // 7:30-7:55
          presentCount++;
        } else if (rand < 0.90) {
          status = 'LATE';
          checkInHour = 8;
          checkInMinute = Math.floor(Math.random() * 30); // 8:00-8:30
          lateCount++;
        } else if (rand < 0.98) {
          status = 'ABSENT';
          checkInHour = 0;
          checkInMinute = 0;
          absentCount++;
        } else if (rand < 0.99) {
          status = 'EXCUSED';
          checkInHour = 0;
          checkInMinute = 0;
        } else {
          status = 'SICK';
          checkInHour = 0;
          checkInMinute = 0;
        }

        // Add some day-of-week variation (Monday blues, Thursday energy)
        if (dayOfWeek === 0 && Math.random() < 0.1) {
          // Sunday - slightly more late arrivals
          if (status === 'PRESENT') {
            status = 'LATE';
            checkInHour = 8;
            checkInMinute = Math.floor(Math.random() * 15);
            presentCount--;
            lateCount++;
          }
        }
        if (dayOfWeek === 3 && Math.random() < 0.05) {
          // Wednesday - slightly more absences
          if (status === 'PRESENT') {
            status = 'ABSENT';
            checkInHour = 0;
            checkInMinute = 0;
            presentCount--;
            absentCount++;
          }
        }

        // Create check-in time
        const checkInTime = new Date(date);
        if (checkInHour > 0) {
          checkInTime.setHours(checkInHour, checkInMinute, 0, 0);
        }

        // Create check-out time (3:00 PM with some variation)
        let checkOutTime: Date | null = null;
        if (status === 'PRESENT' || status === 'LATE') {
          checkOutTime = new Date(date);
          checkOutTime.setHours(15, Math.floor(Math.random() * 30), 0, 0);
        }

        // Select method based on status
        const methods: AttendanceMethod[] = ['MANUAL', 'QR_CODE', 'BARCODE', 'GEOFENCE'];
        const method = methods[Math.floor(Math.random() * methods.length)];

        attendanceRecords.push({
          schoolId,
          studentId,
          classId: cls.id,
          date,
          status,
          method,
          checkInTime: status !== 'ABSENT' && status !== 'EXCUSED' && status !== 'SICK' ? checkInTime : date,
          checkOutTime,
          markedAt: checkInTime,
        });

        totalRecords++;
      }
    }
  }

  // Batch insert attendance records
  if (attendanceRecords.length > 0) {
    // Use createMany for efficiency
    await prisma.attendance.createMany({
      data: attendanceRecords,
      skipDuplicates: true,
    });
  }

  // Create some student identifiers for barcode/QR scanning
  console.log("🏷️  Creating student identifiers...");
  const identifiers: {
    schoolId: string;
    studentId: string;
    type: IdentifierType;
    value: string;
    isActive: boolean;
    isPrimary: boolean;
    issuedAt: Date;
  }[] = [];

  for (const student of students.slice(0, 50)) { // First 50 students
    // Barcode identifier
    identifiers.push({
      schoolId,
      studentId: student.id,
      type: 'BARCODE',
      value: `STU${student.id.slice(-6).toUpperCase()}`,
      isActive: true,
      isPrimary: true,
      issuedAt: new Date(),
    });

    // RFID card for some students
    if (Math.random() < 0.5) {
      identifiers.push({
        schoolId,
        studentId: student.id,
        type: 'RFID_CARD',
        value: `RFID${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        isActive: true,
        isPrimary: false,
        issuedAt: new Date(),
      });
    }
  }

  if (identifiers.length > 0) {
    await prisma.studentIdentifier.createMany({
      data: identifiers,
      skipDuplicates: true,
    });
  }

  // Create some QR code sessions
  console.log("📱 Creating QR code sessions...");
  const sessions = [];

  // Get an admin user for generatedBy
  const adminUser = await prisma.user.findFirst({
    where: { schoolId, role: 'ADMIN' },
    select: { id: true }
  });

  if (adminUser) {
    for (const cls of classes.slice(0, 5)) {
      const sessionDate = new Date();
      sessionDate.setHours(8, 0, 0, 0);

      sessions.push({
        schoolId,
        classId: cls.id,
        code: `QR${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        payload: JSON.stringify({ classId: cls.id, className: cls.name }),
        generatedBy: adminUser.id,
        generatedAt: sessionDate,
        expiresAt: new Date(sessionDate.getTime() + 30 * 60 * 1000), // 30 minutes
        isActive: false,
        scanCount: Math.floor(Math.random() * 20) + 10,
        scannedBy: JSON.stringify([]),
      });
    }

    if (sessions.length > 0) {
      await prisma.qRCodeSession.createMany({
        data: sessions,
        skipDuplicates: true,
      });
    }
  }

  console.log(`   ✅ Created: ${totalRecords} attendance records`);
  console.log(`      - Present: ${presentCount} (${Math.round(presentCount / totalRecords * 100)}%)`);
  console.log(`      - Late: ${lateCount} (${Math.round(lateCount / totalRecords * 100)}%)`);
  console.log(`      - Absent: ${absentCount} (${Math.round(absentCount / totalRecords * 100)}%)`);
  console.log(`   ✅ Created: ${identifiers.length} student identifiers`);
  console.log(`   ✅ Created: ${sessions.length} QR code sessions\n`);
}
