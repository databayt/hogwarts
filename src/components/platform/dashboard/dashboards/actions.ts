"use server"

import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { subDays, startOfMonth, endOfMonth } from "date-fns";

/**
 * Dashboard Actions - Server-side data fetching for real-time lab metrics
 * Following the mirror-pattern and server-first architecture
 */

// ==================== ENROLLMENT METRICS ====================

export async function getEnrollmentMetrics() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const now = new Date();
  const firstOfMonth = startOfMonth(now);
  const lastOfMonth = endOfMonth(now);

  const [total, newThisMonth] = await Promise.all([
    // Total students
    db.student.count({ where: { schoolId } }),

    // New enrollments this month
    db.student.count({
      where: {
        schoolId,
        createdAt: { gte: firstOfMonth, lte: lastOfMonth },
      },
    }),
  ]);

  return {
    total,
    newThisMonth,
    active: total, // TODO: Implement when status field is added to Student model
    inactive: 0, // TODO: Implement when status field is added to Student model
    graduated: 0, // TODO: Implement when status field is added to Student model
    transferIn: 0, // TODO: Implement when transfer tracking is added
    transferOut: 0, // TODO: Implement when transfer tracking is added
  };
}

// ==================== ATTENDANCE METRICS ====================

export async function getAttendanceMetrics() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's attendance
  const [todayAttendance, totalStudents] = await Promise.all([
    db.attendance.groupBy({
      by: ["status"],
      where: {
        schoolId,
        date: today,
      },
      _count: true,
    }),
    db.student.count({ where: { schoolId } }),
  ]);

  const presentCount = todayAttendance.find((a) => a.status === "PRESENT")?._count || 0;
  const absentCount = todayAttendance.find((a) => a.status === "ABSENT")?._count || 0;
  const lateCount = todayAttendance.find((a) => a.status === "LATE")?._count || 0;

  const attendanceRate = totalStudents > 0
    ? ((presentCount + lateCount) / totalStudents * 100).toFixed(1)
    : "0.0";

  return {
    attendanceRate: parseFloat(attendanceRate),
    present: presentCount,
    absent: absentCount,
    late: lateCount,
    total: totalStudents,
  };
}

// ==================== STAFF METRICS ====================

export async function getStaffMetrics() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const [totalTeachers, departments] = await Promise.all([
    db.teacher.count({ where: { schoolId } }),
    db.department.count({ where: { schoolId } }),
  ]);

  // TODO: Implement staff attendance when TeacherAttendance model is added
  const staffPresenceRate = 0; // Placeholder

  return {
    total: totalTeachers,
    departments,
    presenceRate: staffPresenceRate,
  };
}

// ==================== ACADEMIC PERFORMANCE METRICS ====================

export async function getAcademicPerformanceMetrics() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // TODO: Implement when ExamResult and GPA models are added
  // For now, return calculated mock data or nulls

  const totalExams = await db.exam.count({ where: { schoolId } });
  const totalAssignments = await db.assignment.count({ where: { schoolId } });

  return {
    averageGPA: null, // TODO: Calculate from StudentGPA model
    passRate: null, // TODO: Calculate from ExamResult model
    improvement: null, // TODO: Compare with previous term
    topPerformers: null, // TODO: Count students with GPA > 3.5
    totalExams,
    totalAssignments,
  };
}

// ==================== ANNOUNCEMENTS METRICS ====================

export async function getAnnouncementsMetrics() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const [total, published, unpublished, recentCount] = await Promise.all([
    db.announcement.count({ where: { schoolId } }),
    db.announcement.count({ where: { schoolId, published: true } }),
    db.announcement.count({ where: { schoolId, published: false } }),
    db.announcement.count({
      where: {
        schoolId,
        createdAt: { gte: subDays(new Date(), 7) },
      },
    }),
  ]);

  return {
    total,
    published,
    unpublished,
    recentCount,
  };
}

// ==================== CLASSES METRICS ====================

export async function getClassesMetrics() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const [totalClasses, activeClasses, students, teachers] = await Promise.all([
    db.class.count({ where: { schoolId } }),
    db.class.count({ where: { schoolId } }), // TODO: Add status field to filter active
    db.student.count({ where: { schoolId } }),
    db.teacher.count({ where: { schoolId } }),
  ]);

  const studentTeacherRatio = teachers > 0 ? (students / teachers).toFixed(1) : "0";

  return {
    total: totalClasses,
    active: activeClasses,
    studentTeacherRatio: parseFloat(studentTeacherRatio),
  };
}

// ==================== RECENT ACTIVITIES ====================

export async function getRecentActivities() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const [recentStudents, recentAnnouncements, recentExams, recentAssignments] = await Promise.all([
    db.student.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        givenName: true,
        surname: true,
        createdAt: true,
      },
    }),
    db.announcement.findMany({
      where: { schoolId, published: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        titleEn: true,
        titleAr: true,
        createdAt: true,
      },
    }),
    db.exam.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        examDate: true,
        createdAt: true,
      },
    }),
    db.assignment.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        dueDate: true,
        createdAt: true,
      },
    }),
  ]);

  // Combine and sort all activities
  const activities = [
    ...recentStudents.map((s) => ({
      type: "enrollment" as const,
      action: `New student enrolled: ${s.givenName} ${s.surname}`,
      timestamp: s.createdAt,
      user: "Admin",
    })),
    ...recentAnnouncements.map((a) => ({
      type: "announcement" as const,
      action: `New announcement: ${a.titleEn || a.titleAr}`,
      timestamp: a.createdAt,
      user: "Admin",
    })),
    ...recentExams.map((e) => ({
      type: "exam" as const,
      action: `Exam scheduled: ${e.title}`,
      timestamp: e.examDate || e.createdAt,
      user: "Admin",
    })),
    ...recentAssignments.map((a) => ({
      type: "assignment" as const,
      action: `Assignment created: ${a.title}`,
      timestamp: a.createdAt,
      user: "Teacher",
    })),
  ]
    .filter((activity) => activity.timestamp != null) // Filter out null/undefined timestamps
    .sort((a, b) => {
      // Safe date comparison with fallback
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 10);

  return activities;
}

// ==================== DASHBOARD SUMMARY ====================

/**
 * Aggregate function to fetch all lab data in one call
 * Optimized to reduce round-trips to database
 */
export async function getDashboardSummary() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const [
    enrollment,
    attendance,
    staff,
    academicPerformance,
    announcements,
    classes,
    activities,
  ] = await Promise.all([
    getEnrollmentMetrics(),
    getAttendanceMetrics(),
    getStaffMetrics(),
    getAcademicPerformanceMetrics(),
    getAnnouncementsMetrics(),
    getClassesMetrics(),
    getRecentActivities(),
  ]);

  return {
    enrollment,
    attendance,
    staff,
    academicPerformance,
    announcements,
    classes,
    activities,
  };
}
