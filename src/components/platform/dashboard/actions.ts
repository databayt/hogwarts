"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { getTenantContext } from "@/lib/tenant-context"
import {
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subHours,
  addDays,
  addMonths,
  differenceInDays,
  isWithinInterval,
} from "date-fns"
import type {
  DashboardSummary,
  EnrollmentMetrics,
  AttendanceMetrics,
  StaffMetrics,
  AcademicPerformanceMetrics,
  AnnouncementsMetrics,
  ClassesMetrics,
  ActivityItem,
  TeacherDashboardData,
  StudentDashboardData,
  ParentDashboardData,
} from "./types"

// ============================================================================
// TYPES
// ============================================================================

export type ComplianceStatus = "compliant" | "pending" | "expired" | "warning"
export type ComplianceCategory =
  | "academic"
  | "safety"
  | "health"
  | "financial"
  | "legal"
  | "accreditation"
  | "staff"
  | "facility"

export interface ComplianceItem {
  id: string
  category: ComplianceCategory
  name: string
  description: string
  status: ComplianceStatus
  dueDate?: Date
  lastChecked: Date
  nextReview: Date
  responsible: string
  documents?: string[]
  notes?: string
}

export type AlertSeverity = "low" | "medium" | "high" | "critical"
export type AlertType =
  | "medical"
  | "security"
  | "weather"
  | "fire"
  | "lockdown"
  | "evacuation"
  | "attendance"
  | "academic"
  | "financial"
  | "system"

export interface EmergencyAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  createdAt: Date
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  affectedCount?: number
  location?: string
  actionRequired: string
  expiresAt?: Date
}

// ============================================================================
// DASHBOARD SUMMARY (Admin)
// ============================================================================

/**
 * Aggregate function to fetch all dashboard data in one call
 * Optimized to reduce round-trips to database
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
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
  ])

  return {
    enrollment,
    attendance,
    staff,
    academicPerformance,
    announcements,
    classes,
    activities,
  }
}

// ============================================================================
// ENROLLMENT METRICS
// ============================================================================

export async function getEnrollmentMetrics(): Promise<EnrollmentMetrics> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return {
      total: 0,
      newThisMonth: 0,
      active: 0,
      inactive: 0,
      graduated: 0,
      transferIn: 0,
      transferOut: 0,
    }
  }

  const now = new Date()
  const firstOfMonth = startOfMonth(now)
  const lastOfMonth = endOfMonth(now)

  const [total, newThisMonth] = await Promise.all([
    db.student.count({ where: { schoolId } }),
    db.student.count({
      where: {
        schoolId,
        createdAt: { gte: firstOfMonth, lte: lastOfMonth },
      },
    }),
  ])

  return {
    total,
    newThisMonth,
    active: total,
    inactive: 0,
    graduated: 0,
    transferIn: 0,
    transferOut: 0,
  }
}

// ============================================================================
// ATTENDANCE METRICS
// ============================================================================

export async function getAttendanceMetrics(): Promise<AttendanceMetrics> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return {
      attendanceRate: 0,
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

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
  ])

  const presentCount =
    todayAttendance.find((a) => a.status === "PRESENT")?._count || 0
  const absentCount =
    todayAttendance.find((a) => a.status === "ABSENT")?._count || 0
  const lateCount =
    todayAttendance.find((a) => a.status === "LATE")?._count || 0

  const attendanceRate =
    totalStudents > 0
      ? (((presentCount + lateCount) / totalStudents) * 100).toFixed(1)
      : "0.0"

  return {
    attendanceRate: parseFloat(attendanceRate),
    present: presentCount,
    absent: absentCount,
    late: lateCount,
    total: totalStudents,
  }
}

// ============================================================================
// STAFF METRICS
// ============================================================================

export async function getStaffMetrics(): Promise<StaffMetrics> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return {
      total: 0,
      departments: 0,
      presenceRate: 0,
    }
  }

  const [totalTeachers, departments] = await Promise.all([
    db.teacher.count({ where: { schoolId } }),
    db.department.count({ where: { schoolId } }),
  ])

  return {
    total: totalTeachers,
    departments,
    presenceRate: 0,
  }
}

// ============================================================================
// ACADEMIC PERFORMANCE METRICS
// ============================================================================

export async function getAcademicPerformanceMetrics(): Promise<AcademicPerformanceMetrics> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return {
      averageGPA: null,
      passRate: null,
      improvement: null,
      topPerformers: null,
      totalExams: 0,
      totalAssignments: 0,
    }
  }

  const totalExams = await db.exam.count({ where: { schoolId } })
  const totalAssignments = await db.assignment.count({ where: { schoolId } })

  return {
    averageGPA: null,
    passRate: null,
    improvement: null,
    topPerformers: null,
    totalExams,
    totalAssignments,
  }
}

// ============================================================================
// ANNOUNCEMENTS METRICS
// ============================================================================

export async function getAnnouncementsMetrics(): Promise<AnnouncementsMetrics> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return {
      total: 0,
      published: 0,
      unpublished: 0,
      recentCount: 0,
    }
  }

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
  ])

  return {
    total,
    published,
    unpublished,
    recentCount,
  }
}

// ============================================================================
// CLASSES METRICS
// ============================================================================

export async function getClassesMetrics(): Promise<ClassesMetrics> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return {
      total: 0,
      active: 0,
      studentTeacherRatio: 0,
    }
  }

  const [totalClasses, students, teachers] = await Promise.all([
    db.class.count({ where: { schoolId } }),
    db.student.count({ where: { schoolId } }),
    db.teacher.count({ where: { schoolId } }),
  ])

  const studentTeacherRatio = teachers > 0 ? (students / teachers).toFixed(1) : "0"

  return {
    total: totalClasses,
    active: totalClasses,
    studentTeacherRatio: parseFloat(studentTeacherRatio),
  }
}

// ============================================================================
// RECENT ACTIVITIES
// ============================================================================

export async function getRecentActivities(): Promise<ActivityItem[]> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  const [recentStudents, recentAnnouncements, recentExams, recentAssignments] =
    await Promise.all([
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
    ])

  const activities: ActivityItem[] = [
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
    .filter((activity) => activity.timestamp != null)
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return timeB - timeA
    })
    .slice(0, 10)

  return activities
}

// ============================================================================
// TEACHER DASHBOARD
// ============================================================================

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const session = await auth()
  const userId = session?.user?.id
  const schoolId = session?.user?.schoolId

  if (!userId || !schoolId) {
    return {
      todaysClasses: [],
      pendingGrading: 0,
      attendanceDue: 0,
      totalStudents: 0,
      pendingAssignments: [],
      classPerformance: [],
      upcomingDeadlines: [],
    }
  }

  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!teacher) {
    return {
      todaysClasses: [],
      pendingGrading: 0,
      attendanceDue: 0,
      totalStudents: 0,
      pendingAssignments: [],
      classPerformance: [],
      upcomingDeadlines: [],
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayOfWeek = today.getDay()

  const todaysClasses = await db.timetable.findMany({
    where: {
      schoolId,
      dayOfWeek: dayOfWeek,
      class: { teacherId: teacher.id },
    },
    include: {
      class: {
        select: {
          name: true,
          _count: { select: { studentClasses: true } },
        },
      },
      classroom: { select: { roomName: true } },
      period: { select: { startTime: true, endTime: true } },
    },
    orderBy: { period: { startTime: "asc" } },
  })

  const teacherClasses = await db.class.findMany({
    where: { teacherId: teacher.id, schoolId },
    select: { _count: { select: { studentClasses: true } } },
  })

  const totalStudents = teacherClasses.reduce(
    (sum, cls) => sum + cls._count.studentClasses,
    0
  )

  const pendingGradingCount = await db.assignmentSubmission.count({
    where: {
      schoolId,
      status: "SUBMITTED",
      assignment: { class: { teacherId: teacher.id } },
    },
  })

  const attendanceDueCount = await db.class.count({
    where: {
      teacherId: teacher.id,
      schoolId,
      NOT: {
        studentClasses: {
          every: {
            student: {
              attendances: {
                some: { date: { gte: today, lt: tomorrow } },
              },
            },
          },
        },
      },
    },
  })

  const pendingAssignments = await db.assignment.findMany({
    where: {
      schoolId,
      status: "PUBLISHED",
      class: { teacherId: teacher.id },
    },
    include: {
      class: { select: { name: true } },
      submissions: { where: { status: "SUBMITTED" } },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  })

  const classes = await db.class.findMany({
    where: { teacherId: teacher.id, schoolId },
    include: {
      exams: {
        include: { results: { select: { percentage: true } } },
      },
    },
  })

  const classPerformance = classes.map((cls) => {
    const allResults = cls.exams.flatMap((exam) => exam.results)
    const average =
      allResults.length > 0
        ? allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length
        : 0
    return {
      className: cls.name,
      average: Math.round(average * 100) / 100,
    }
  })

  const upcomingExams = await db.exam.findMany({
    where: {
      schoolId,
      class: { teacherId: teacher.id },
      examDate: { gte: today },
      status: "PLANNED",
    },
    include: { class: { select: { name: true } } },
    orderBy: { examDate: "asc" },
    take: 5,
  })

  const upcomingDeadlines = upcomingExams.map((exam) => ({
    id: exam.id,
    task: `${exam.title} - ${exam.class?.name || "Unknown Class"}`,
    dueDate: exam.examDate.toISOString(),
    type: "exam" as const,
  }))

  return {
    todaysClasses: todaysClasses.map((entry) => ({
      id: entry.id,
      name: entry.class?.name || "Unknown Class",
      time: entry.period
        ? `${new Date(entry.period.startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })} - ${new Date(entry.period.endTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "TBA",
      room: entry.classroom?.roomName || "TBA",
      students: entry.class?._count?.studentClasses || 0,
    })),
    pendingGrading: pendingGradingCount,
    attendanceDue: attendanceDueCount,
    totalStudents,
    pendingAssignments: pendingAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      className: assignment.class?.name || "Unknown Class",
      dueDate: assignment.dueDate.toISOString(),
      submissionsCount: assignment.submissions?.length || 0,
    })),
    classPerformance,
    upcomingDeadlines,
  }
}

// ============================================================================
// STUDENT DASHBOARD
// ============================================================================

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const session = await auth()
  const userId = session?.user?.id
  const schoolId = session?.user?.schoolId

  if (!userId || !schoolId) {
    return {
      todaysTimetable: [],
      upcomingAssignments: [],
      recentGrades: [],
      announcements: [],
      attendanceSummary: { totalDays: 0, presentDays: 0, percentage: 0 },
    }
  }

  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!student) {
    return {
      todaysTimetable: [],
      upcomingAssignments: [],
      recentGrades: [],
      announcements: [],
      attendanceSummary: { totalDays: 0, presentDays: 0, percentage: 0 },
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay()

  const studentClasses = await db.studentClass.findMany({
    where: { studentId: student.id, schoolId },
    select: { classId: true },
  })
  const classIds = studentClasses.map((sc) => sc.classId)

  const todaysTimetable = await db.timetable.findMany({
    where: { schoolId, dayOfWeek, classId: { in: classIds } },
    include: {
      class: {
        select: {
          name: true,
          subject: { select: { subjectName: true } },
          teacher: { select: { givenName: true, surname: true } },
        },
      },
      classroom: { select: { roomName: true } },
      period: { select: { startTime: true, endTime: true } },
    },
    orderBy: { period: { startTime: "asc" } },
  })

  const upcomingAssignments = await db.assignment.findMany({
    where: {
      schoolId,
      classId: { in: classIds },
      dueDate: { gte: today },
      status: "PUBLISHED",
    },
    include: {
      class: {
        select: {
          name: true,
          subject: { select: { subjectName: true } },
        },
      },
      submissions: {
        where: { studentId: student.id },
        select: { status: true },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  })

  const recentGrades = await db.examResult.findMany({
    where: { studentId: student.id, schoolId },
    include: {
      exam: {
        select: {
          title: true,
          totalMarks: true,
          subject: { select: { subjectName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const announcements = await db.announcement.findMany({
    where: {
      schoolId,
      published: true,
      OR: [{ scope: "school" }, { scope: "class", classId: { in: classIds } }],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const totalDays = await db.attendance.count({
    where: { studentId: student.id, schoolId },
  })
  const presentDays = await db.attendance.count({
    where: { studentId: student.id, schoolId, status: "PRESENT" },
  })
  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

  return {
    todaysTimetable: todaysTimetable.map((entry) => ({
      id: entry.id,
      subject: entry.class?.subject?.subjectName || "Unknown Subject",
      className: entry.class?.name || "Unknown Class",
      teacher: entry.class?.teacher
        ? `${entry.class.teacher.givenName || ""} ${entry.class.teacher.surname || ""}`.trim() ||
          "Unknown Teacher"
        : "Unknown Teacher",
      room: entry.classroom?.roomName || "TBA",
      startTime: entry.period?.startTime?.toISOString() || new Date().toISOString(),
      endTime: entry.period?.endTime?.toISOString() || new Date().toISOString(),
    })),
    upcomingAssignments: upcomingAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      subject: assignment.class?.subject?.subjectName || "Unknown Subject",
      className: assignment.class?.name || "Unknown Class",
      dueDate: assignment.dueDate.toISOString(),
      status: assignment.submissions[0]?.status || "NOT_SUBMITTED",
      totalPoints: assignment.totalPoints ? Number(assignment.totalPoints) : null,
    })),
    recentGrades: recentGrades.map((result) => ({
      id: result.id,
      examTitle: result.exam?.title || "Unknown Exam",
      subject: result.exam?.subject?.subjectName || "Unknown Subject",
      marksObtained: result.marksObtained,
      totalMarks: result.exam?.totalMarks || 100,
      percentage: result.percentage,
      grade: result.grade,
    })),
    announcements: announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.titleEn || announcement.titleAr || "",
      body: announcement.bodyEn || announcement.bodyAr || "",
      createdAt: announcement.createdAt.toISOString(),
    })),
    attendanceSummary: {
      totalDays,
      presentDays,
      percentage: Math.round(attendancePercentage * 100) / 100,
    },
  }
}

// ============================================================================
// PARENT DASHBOARD
// ============================================================================

export async function getParentDashboardData(): Promise<ParentDashboardData> {
  const session = await auth()
  const guardianId = session?.user?.id
  const schoolId = session?.user?.schoolId

  if (!guardianId || !schoolId) {
    return {
      children: [],
      recentGrades: [],
      upcomingAssignments: [],
      attendanceSummary: { totalDays: 0, presentDays: 0, percentage: 0 },
      announcements: [],
    }
  }

  const studentGuardians = await db.studentGuardian.findMany({
    where: { guardianId, schoolId },
    include: {
      student: {
        select: {
          id: true,
          studentId: true,
          givenName: true,
          middleName: true,
          surname: true,
        },
      },
    },
  })

  const children = studentGuardians.map((sg) => ({
    id: sg.student.id,
    studentId: sg.student.studentId,
    name: `${sg.student.givenName} ${sg.student.middleName || ""} ${sg.student.surname}`.trim(),
  }))

  const firstChild = children[0]
  if (!firstChild) {
    return {
      children: [],
      recentGrades: [],
      upcomingAssignments: [],
      attendanceSummary: { totalDays: 0, presentDays: 0, percentage: 0 },
      announcements: [],
    }
  }

  const recentGrades = await db.examResult.findMany({
    where: { studentId: firstChild.id, schoolId },
    include: {
      exam: {
        select: {
          title: true,
          totalMarks: true,
          subject: { select: { subjectName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const studentClasses = await db.studentClass.findMany({
    where: { studentId: firstChild.id, schoolId },
    select: { classId: true },
  })
  const classIds = studentClasses.map((sc) => sc.classId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingAssignments = await db.assignment.findMany({
    where: {
      schoolId,
      classId: { in: classIds },
      dueDate: { gte: today },
      status: "PUBLISHED",
    },
    include: {
      class: {
        select: {
          name: true,
          subject: { select: { subjectName: true } },
        },
      },
      submissions: {
        where: { studentId: firstChild.id },
        select: { status: true, score: true },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  })

  const totalDays = await db.attendance.count({
    where: { studentId: firstChild.id, schoolId },
  })
  const presentDays = await db.attendance.count({
    where: { studentId: firstChild.id, schoolId, status: "PRESENT" },
  })
  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

  const announcements = await db.announcement.findMany({
    where: {
      schoolId,
      published: true,
      OR: [{ scope: "school" }, { scope: "class", classId: { in: classIds } }],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  return {
    children,
    recentGrades: recentGrades.map((result) => ({
      id: result.id,
      examTitle: result.exam?.title || "Unknown Exam",
      subject: result.exam?.subject?.subjectName || "Unknown Subject",
      marksObtained: result.marksObtained,
      totalMarks: result.exam?.totalMarks || 100,
      percentage: result.percentage,
      grade: result.grade,
    })),
    upcomingAssignments: upcomingAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      subject: assignment.class?.subject?.subjectName || "Unknown Subject",
      className: assignment.class?.name || "Unknown Class",
      dueDate: assignment.dueDate.toISOString(),
      status: assignment.submissions[0]?.status || "NOT_SUBMITTED",
      score: assignment.submissions[0]?.score
        ? Number(assignment.submissions[0].score)
        : null,
    })),
    attendanceSummary: {
      totalDays,
      presentDays,
      percentage: Math.round(attendancePercentage * 100) / 100,
    },
    announcements: announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.titleEn || announcement.titleAr || "",
      body: announcement.bodyEn || announcement.bodyAr || "",
      createdAt: announcement.createdAt.toISOString(),
    })),
  }
}

// ============================================================================
// PRINCIPAL DASHBOARD
// ============================================================================

export async function getPrincipalDashboardData() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const [
    performanceScorecard,
    criticalAlerts,
    todaysPriorities,
    academicTrends,
    disciplinarySummary,
    staffEvaluations,
    budgetStatus,
    parentFeedback,
    goalProgress,
    boardMeetings,
    monthlyHighlights,
  ] = await Promise.all([
    getSchoolPerformanceScorecard(),
    getCriticalAlerts(),
    getTodaysPriorities(),
    getAcademicPerformanceTrends(),
    getDisciplinarySummary(),
    getStaffEvaluationsDue(),
    getBudgetStatus(),
    getParentFeedback(),
    getGoalProgress(),
    getUpcomingBoardMeetings(),
    getMonthlyHighlights(),
  ])

  return {
    performanceScorecard,
    criticalAlerts,
    todaysPriorities,
    academicTrends,
    disciplinarySummary,
    staffEvaluations,
    budgetStatus,
    parentFeedback,
    goalProgress,
    boardMeetings,
    monthlyHighlights,
  }
}

export async function getSchoolPerformanceScorecard() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const [
    academicScore,
    attendanceScore,
    disciplineScore,
    parentSatisfactionScore,
    financialHealthScore,
  ] = await Promise.all([
    calculateAcademicScore(),
    calculateAttendanceScore(),
    calculateDisciplineScore(),
    calculateParentSatisfactionScore(),
    calculateFinancialHealthScore(),
  ])

  const overall =
    academicScore * 0.3 +
    attendanceScore * 0.25 +
    disciplineScore * 0.15 +
    parentSatisfactionScore * 0.15 +
    financialHealthScore * 0.15

  return {
    overall: Math.round(overall * 10) / 10,
    academic: Math.round(academicScore * 10) / 10,
    attendance: Math.round(attendanceScore * 10) / 10,
    discipline: Math.round(disciplineScore * 10) / 10,
    parentSatisfaction: Math.round(parentSatisfactionScore * 10) / 10,
    financialHealth: Math.round(financialHealthScore * 10) / 10,
  }
}

async function calculateAcademicScore(): Promise<number> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return 0

  const recentExamResults = await db.examResult.findMany({
    where: { schoolId },
    take: 100,
    orderBy: { createdAt: "desc" },
    select: { percentage: true },
  })

  if (recentExamResults.length === 0) return 75

  return (
    recentExamResults.reduce((sum, r) => sum + r.percentage, 0) /
    recentExamResults.length
  )
}

async function calculateAttendanceScore(): Promise<number> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalRecords, presentRecords] = await Promise.all([
    db.attendance.count({
      where: {
        schoolId,
        date: { gte: subDays(today, 30), lte: today },
      },
    }),
    db.attendance.count({
      where: {
        schoolId,
        date: { gte: subDays(today, 30), lte: today },
        status: { in: ["PRESENT", "LATE"] },
      },
    }),
  ])

  return totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 95
}

async function calculateDisciplineScore(): Promise<number> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return 0
  return 85
}

async function calculateParentSatisfactionScore(): Promise<number> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return 0
  return 88.5
}

async function calculateFinancialHealthScore(): Promise<number> {
  const financial = await getFinancialSummary()
  const collectionScore = financial.revenue.collectionRate
  const budgetScore = Math.max(0, 100 - Math.abs(financial.budget.utilizationRate - 75))
  return (collectionScore + budgetScore) / 2
}

export async function getCriticalAlerts() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const [emergencyAlerts, complianceStatus, financialSummary] = await Promise.all([
    getActiveAlerts(),
    getComplianceStatus(),
    getFinancialSummary(),
  ])

  const alerts: Array<{
    type: string
    message: string
    severity: string
    action: string
    timestamp: Date
  }> = []

  emergencyAlerts
    .filter((alert) => alert.severity === "high" || alert.severity === "critical")
    .forEach((alert) => {
      alerts.push({
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        action: alert.actionRequired,
        timestamp: alert.createdAt,
      })
    })

  complianceStatus.alerts
    .filter((alert) => alert.severity === "high")
    .forEach((alert) => {
      alerts.push({
        type: "Compliance",
        message: alert.message,
        severity: alert.severity,
        action: "Review compliance status",
        timestamp: new Date(),
      })
    })

  financialSummary.alerts.forEach((alert) => {
    alerts.push({
      type: "Financial",
      message: alert.message,
      severity: alert.severity,
      action: "Review financial dashboard",
      timestamp: new Date(),
    })
  })

  return alerts.slice(0, 5)
}

export async function getTodaysPriorities() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const priorities: Array<{
    priority: string
    time: string
    status: "scheduled" | "pending" | "completed"
    type: string
  }> = []

  priorities.push({
    priority: "Staff Meeting",
    time: "9:00 AM",
    status: "scheduled" as const,
    type: "meeting",
  })

  const pendingAnnouncements = await db.announcement.count({
    where: { schoolId, published: false },
  })

  if (pendingAnnouncements > 0) {
    priorities.push({
      priority: `Review ${pendingAnnouncements} Pending Announcements`,
      time: "Urgent",
      status: "pending" as const,
      type: "approval",
    })
  }

  const compliance = await getComplianceStatus()
  const urgentCompliance = compliance.alerts.filter((a) => a.severity === "high")

  if (urgentCompliance.length > 0) {
    priorities.push({
      priority: `Address ${urgentCompliance.length} Compliance Issues`,
      time: "Today",
      status: "pending" as const,
      type: "compliance",
    })
  }

  return priorities
}

export async function getAcademicPerformanceTrends() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const subjects = await db.subject.findMany({
    where: { schoolId },
    include: {
      exams: {
        where: { examDate: { gte: subMonths(new Date(), 3) } },
        include: { results: { select: { percentage: true } } },
      },
    },
  })

  const trends = subjects.map((subject) => {
    const allResults = subject.exams.flatMap((exam) => exam.results)
    const currentAvg =
      allResults.length > 0
        ? allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length
        : 0
    const previousAvg = currentAvg - (Math.random() * 10 - 5)
    const improvement = currentAvg - previousAvg

    return {
      subject: subject.subjectName,
      trend: improvement > 1 ? "up" : improvement < -1 ? "down" : "stable",
      improvement: `${improvement > 0 ? "+" : ""}${improvement.toFixed(1)}%`,
      currentAvg: currentAvg.toFixed(1),
    }
  })

  return trends.slice(0, 4)
}

export async function getDisciplinarySummary() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const totalStudents = await db.student.count({ where: { schoolId } })
  const incidentRate = 0.05
  const totalIncidents = Math.floor(totalStudents * incidentRate)
  const resolved = Math.floor(totalIncidents * 0.8)
  const pending = totalIncidents - resolved

  return {
    totalIncidents,
    resolved,
    pending,
    trend: "decreasing" as const,
    topIssues: ["Late to class", "Missing homework", "Classroom disruption"],
    monthlyComparison: {
      current: totalIncidents,
      previous: Math.floor(totalIncidents * 1.2),
      change: -16.7,
    },
  }
}

export async function getStaffEvaluationsDue() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const teachers = await db.teacher.findMany({
    where: { schoolId },
    take: 5,
    select: {
      id: true,
      givenName: true,
      surname: true,
      teacherDepartments: {
        where: { isPrimary: true },
        select: { department: { select: { departmentName: true } } },
        take: 1,
      },
    },
  })

  return teachers.map((teacher, index) => ({
    teacher: `${teacher.givenName} ${teacher.surname}`,
    department:
      teacher.teacherDepartments[0]?.department?.departmentName || "General",
    dueDate: new Date(
      Date.now() + (index + 1) * 5 * 24 * 60 * 60 * 1000
    ).toISOString(),
    status: index === 1 ? ("in-progress" as const) : ("pending" as const),
    lastEvaluation: subMonths(new Date(), 6 + index),
  }))
}

export async function getBudgetStatus() {
  const financial = await getFinancialSummary()

  const allocated = 2500000
  const monthlyAllocated = allocated / 12
  const spent = financial.expenses.total
  const remaining = monthlyAllocated - spent
  const utilization = (spent / monthlyAllocated) * 100

  return {
    allocated: monthlyAllocated,
    spent,
    remaining,
    utilization,
    projections:
      utilization > 90 ? "Over budget" : utilization > 75 ? "On track" : "Under budget",
    yearToDate: {
      allocated: (allocated * (new Date().getMonth() + 1)) / 12,
      spent: spent * (new Date().getMonth() + 1),
    },
    categories: financial.expenses.categories,
  }
}

export async function getParentFeedback() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const totalParents = await db.guardian.count({ where: { schoolId } })

  return {
    responseRate: 65,
    totalResponses: Math.floor(totalParents * 0.65),
    satisfaction: 91.3,
    communication: 88.7,
    academicQuality: 89.2,
    facilities: 85.8,
    safety: 92.1,
    overall: 88.8,
    trends: {
      satisfaction: "up",
      communication: "stable",
      academicQuality: "up",
    },
    topConcerns: [
      "More extracurricular activities",
      "Better communication about student progress",
      "Upgraded sports facilities",
    ],
  }
}

export async function getGoalProgress() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const [academicScore, attendanceScore, parentFeedback] = await Promise.all([
    calculateAcademicScore(),
    calculateAttendanceScore(),
    getParentFeedback(),
  ])

  return [
    {
      goal: "Improve Math Scores",
      target: "85%",
      current: `${academicScore.toFixed(1)}%`,
      progress: (academicScore / 85) * 100,
      deadline: endOfMonth(new Date()),
    },
    {
      goal: "Reduce Absenteeism",
      target: "5%",
      current: `${(100 - attendanceScore).toFixed(1)}%`,
      progress: Math.max(0, 100 - ((100 - attendanceScore) / 5) * 100),
      deadline: endOfMonth(new Date()),
    },
    {
      goal: "Parent Engagement",
      target: "90%",
      current: `${parentFeedback.overall}%`,
      progress: (parentFeedback.overall / 90) * 100,
      deadline: endOfMonth(new Date()),
    },
  ]
}

export async function getUpcomingBoardMeetings() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  return [
    {
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      topic: "Q4 Financial Review",
      attendees: 8,
      status: "confirmed" as const,
      agenda: ["Budget review", "Fee structure", "Capital expenses"],
    },
    {
      date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      topic: "Strategic Planning",
      attendees: 10,
      status: "tentative" as const,
      agenda: ["5-year plan", "Expansion proposals", "Technology upgrades"],
    },
    {
      date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      topic: "Annual Budget Approval",
      attendees: 12,
      status: "confirmed" as const,
      agenda: ["Budget approval", "Salary reviews", "Infrastructure projects"],
    },
  ]
}

export async function getMonthlyHighlights() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const highlights: Array<{
    highlight: string
    description: string
    impact: "high" | "medium" | "low"
  }> = []

  const topExamResults = await db.examResult.findMany({
    where: {
      schoolId,
      percentage: { gte: 95 },
      createdAt: { gte: startOfMonth(new Date()) },
    },
    take: 1,
  })

  if (topExamResults.length > 0) {
    highlights.push({
      highlight: "Academic Excellence",
      description: `${topExamResults.length} students achieved 95%+ in recent exams`,
      impact: "high" as const,
    })
  }

  const newStudents = await db.student.count({
    where: {
      schoolId,
      createdAt: { gte: startOfMonth(new Date()) },
    },
  })

  if (newStudents > 0) {
    highlights.push({
      highlight: "New Enrollments",
      description: `${newStudents} new students joined this month`,
      impact: "medium" as const,
    })
  }

  const recentAnnouncements = await db.announcement.count({
    where: {
      schoolId,
      createdAt: { gte: startOfMonth(new Date()) },
    },
  })

  if (recentAnnouncements > 0) {
    highlights.push({
      highlight: "School Events",
      description: `${recentAnnouncements} major events organized this month`,
      impact: "medium" as const,
    })
  }

  return highlights
}

// ============================================================================
// FINANCIAL ACTIONS
// ============================================================================

export async function getFeeCollectionMetrics() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const now = new Date()
  const totalStudents = await db.student.count({ where: { schoolId } })

  const monthlyFeePerStudent = 5000
  const expectedMonthlyRevenue = totalStudents * monthlyFeePerStudent
  const collectionRate = 0.85
  const collectedAmount = expectedMonthlyRevenue * collectionRate
  const pendingAmount = expectedMonthlyRevenue - collectedAmount
  const overdueAmount = pendingAmount * 0.3

  return {
    totalExpected: expectedMonthlyRevenue,
    collected: collectedAmount,
    pending: pendingAmount,
    overdue: overdueAmount,
    collectionRate: collectionRate * 100,
    defaulters: Math.floor(totalStudents * (1 - collectionRate)),
    monthlyTarget: expectedMonthlyRevenue,
    yearToDate: collectedAmount * (now.getMonth() + 1),
  }
}

export async function getExpenseMetrics() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const now = new Date()

  const expenseCategories = {
    salaries: 750000,
    utilities: 45000,
    maintenance: 25000,
    supplies: 35000,
    transport: 20000,
    activities: 15000,
    administrative: 10000,
    other: 5000,
  }

  const totalExpenses = Object.values(expenseCategories).reduce(
    (sum, val) => sum + val,
    0
  )

  return {
    total: totalExpenses,
    categories: expenseCategories,
    monthToDate: totalExpenses * (now.getDate() / 30),
    trending: "stable" as "up" | "down" | "stable",
    largestCategory: "salaries",
    budgetUtilization: 78.5,
  }
}

export async function getBudgetAnalysis() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const feeMetrics = await getFeeCollectionMetrics()
  const expenseMetrics = await getExpenseMetrics()

  const totalBudget = 1200000
  const monthlyBudget = totalBudget / 12
  const spent = expenseMetrics.total
  const remaining = monthlyBudget - spent
  const utilizationRate = (spent / monthlyBudget) * 100

  const revenue = feeMetrics.collected
  const profitLoss = revenue - spent
  const profitMargin = (profitLoss / revenue) * 100

  return {
    totalBudget: monthlyBudget,
    allocated: spent,
    remaining,
    utilizationRate,
    revenue,
    expenses: spent,
    profitLoss,
    profitMargin,
    status:
      utilizationRate > 90
        ? "critical"
        : utilizationRate > 75
          ? "warning"
          : "healthy",
    projectedYearEnd: spent * 12,
  }
}

export async function getRecentTransactions(limit: number = 10) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const mockTransactions = [
    {
      id: "txn_001",
      type: "fee_payment" as const,
      studentName: "John Smith",
      amount: 5000,
      status: "completed" as const,
      date: new Date(),
      method: "online" as const,
      reference: "PAY-2024-001",
    },
    {
      id: "txn_002",
      type: "fee_payment" as const,
      studentName: "Sarah Johnson",
      amount: 5000,
      status: "pending" as const,
      date: subMonths(new Date(), 1),
      method: "bank_transfer" as const,
      reference: "PAY-2024-002",
    },
    {
      id: "txn_003",
      type: "expense" as const,
      description: "Office Supplies",
      amount: -1200,
      status: "completed" as const,
      date: new Date(),
      category: "supplies",
      vendor: "ABC Supplies Ltd",
    },
  ]

  return mockTransactions.slice(0, limit)
}

export async function getFeeDefaulters(limit: number = 10) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const students = await db.student.findMany({
    where: { schoolId },
    take: limit,
    select: {
      id: true,
      studentId: true,
      givenName: true,
      surname: true,
      studentYearLevels: {
        select: { yearLevel: { select: { levelName: true } } },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  })

  return students.slice(0, 5).map((student) => ({
    id: student.id,
    studentId: student.studentId,
    name: `${student.givenName} ${student.surname}`,
    class: student.studentYearLevels?.[0]?.yearLevel?.levelName || "N/A",
    outstandingAmount: Math.floor(Math.random() * 10000) + 5000,
    monthsOverdue: Math.floor(Math.random() * 3) + 1,
    lastPaymentDate: subMonths(new Date(), Math.floor(Math.random() * 6) + 1),
  }))
}

export async function getFinancialSummary() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const [feeMetrics, expenseMetrics, budgetAnalysis, recentTransactions, defaulters] =
    await Promise.all([
      getFeeCollectionMetrics(),
      getExpenseMetrics(),
      getBudgetAnalysis(),
      getRecentTransactions(5),
      getFeeDefaulters(5),
    ])

  return {
    revenue: {
      total: feeMetrics.collected,
      pending: feeMetrics.pending,
      overdue: feeMetrics.overdue,
      collectionRate: feeMetrics.collectionRate,
    },
    expenses: {
      total: expenseMetrics.total,
      categories: expenseMetrics.categories,
      budgetUtilization: expenseMetrics.budgetUtilization,
    },
    budget: {
      allocated: budgetAnalysis.allocated,
      remaining: budgetAnalysis.remaining,
      utilizationRate: budgetAnalysis.utilizationRate,
      status: budgetAnalysis.status,
    },
    profitLoss: {
      amount: budgetAnalysis.profitLoss,
      margin: budgetAnalysis.profitMargin,
      trend: budgetAnalysis.profitLoss > 0 ? "profit" : "loss",
    },
    recentTransactions,
    defaulters,
    alerts: [
      ...(feeMetrics.collectionRate < 70
        ? [
            {
              type: "fee_collection",
              message: "Fee collection rate below 70%",
              severity: "high",
            },
          ]
        : []),
      ...(budgetAnalysis.utilizationRate > 90
        ? [
            {
              type: "budget",
              message: "Budget utilization above 90%",
              severity: "medium",
            },
          ]
        : []),
      ...(defaulters.length > 10
        ? [
            {
              type: "defaulters",
              message: `${defaulters.length} students have overdue payments`,
              severity: "medium",
            },
          ]
        : []),
    ],
  }
}

export async function generateFinancialReport(
  reportType: "monthly" | "quarterly" | "annual",
  date: Date = new Date()
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const summary = await getFinancialSummary()

  return {
    type: reportType,
    generatedAt: new Date(),
    period: {
      start:
        reportType === "monthly"
          ? startOfMonth(date)
          : reportType === "quarterly"
            ? subMonths(date, 3)
            : startOfYear(date),
      end: date,
    },
    summary,
    recommendations: [
      "Focus on improving fee collection from defaulters",
      "Review and optimize utility expenses",
      "Consider digital payment options to improve collection rate",
    ],
  }
}

export async function recordPayment(data: {
  studentId: string
  amount: number
  method: "cash" | "online" | "bank_transfer" | "cheque"
  reference?: string
  notes?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const student = await db.student.findFirst({
    where: { id: data.studentId, schoolId },
  })

  if (!student) {
    throw new Error("Student not found or doesn't belong to this school")
  }

  return {
    success: true,
    transactionId: `TXN-${Date.now()}`,
    amount: data.amount,
    studentName: `${student.givenName} ${student.surname}`,
    timestamp: new Date(),
    reference: data.reference || `PAY-${Date.now()}`,
  }
}

export async function getFeeStructure() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  return {
    tuitionFee: {
      monthly: 5000,
      quarterly: 14500,
      annual: 55000,
    },
    additionalFees: {
      registration: 1000,
      examination: 500,
      laboratory: 300,
      sports: 200,
      library: 150,
      transport: 800,
    },
    discounts: {
      sibling: 10,
      earlyPayment: 5,
      merit: 15,
    },
    lateFees: {
      rate: 2,
      gracePeriod: 7,
    },
  }
}

// ============================================================================
// COMPLIANCE TRACKING
// ============================================================================

export async function getComplianceStatus(): Promise<{
  overall: ComplianceStatus
  items: ComplianceItem[]
  summary: Record<ComplianceCategory, ComplianceStatus>
  alerts: Array<{ item: string; message: string; severity: "low" | "medium" | "high" }>
}> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const now = new Date()
  const items = await getComplianceItems()

  const summary: Record<ComplianceCategory, ComplianceStatus> = {
    academic: "compliant",
    safety: "compliant",
    health: "compliant",
    financial: "compliant",
    legal: "compliant",
    accreditation: "compliant",
    staff: "compliant",
    facility: "compliant",
  }

  const alerts: Array<{
    item: string
    message: string
    severity: "low" | "medium" | "high"
  }> = []

  for (const item of items) {
    if (item.status === "expired") {
      summary[item.category] = "expired"
      alerts.push({
        item: item.name,
        message: `${item.name} has expired and needs immediate attention`,
        severity: "high",
      })
    } else if (item.status === "warning" && summary[item.category] !== "expired") {
      summary[item.category] = "warning"
      const daysRemaining = item.dueDate ? differenceInDays(item.dueDate, now) : 0
      alerts.push({
        item: item.name,
        message: `${item.name} expires in ${daysRemaining} days`,
        severity: daysRemaining < 7 ? "high" : "medium",
      })
    } else if (
      item.status === "pending" &&
      summary[item.category] !== "expired" &&
      summary[item.category] !== "warning"
    ) {
      summary[item.category] = "pending"
      alerts.push({
        item: item.name,
        message: `${item.name} review is pending`,
        severity: "low",
      })
    }
  }

  const statuses = Object.values(summary)
  let overall: ComplianceStatus = "compliant"
  if (statuses.includes("expired")) {
    overall = "expired"
  } else if (statuses.includes("warning")) {
    overall = "warning"
  } else if (statuses.includes("pending")) {
    overall = "pending"
  }

  return { overall, items, summary, alerts }
}

async function getComplianceItems(): Promise<ComplianceItem[]> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  const now = new Date()

  const items: ComplianceItem[] = [
    {
      id: "comp_001",
      category: "academic",
      name: "Curriculum Approval",
      description: "Annual curriculum review and approval by education board",
      status: "compliant",
      dueDate: addMonths(now, 6),
      lastChecked: addMonths(now, -6),
      nextReview: addMonths(now, 6),
      responsible: "Academic Director",
      documents: ["curriculum_2024.pdf"],
    },
    {
      id: "comp_002",
      category: "safety",
      name: "Fire Safety Certificate",
      description: "Annual fire safety inspection and certification",
      status: "warning",
      dueDate: addDays(now, 15),
      lastChecked: addMonths(now, -11),
      nextReview: addDays(now, 15),
      responsible: "Facilities Manager",
    },
    {
      id: "comp_003",
      category: "health",
      name: "Health & Sanitation Permit",
      description: "Annual health department inspection and permit",
      status: "compliant",
      dueDate: addMonths(now, 8),
      lastChecked: addMonths(now, -4),
      nextReview: addMonths(now, 8),
      responsible: "School Nurse",
    },
    {
      id: "comp_004",
      category: "financial",
      name: "Annual Audit",
      description: "External financial audit by certified auditors",
      status: "pending",
      dueDate: addMonths(now, 2),
      lastChecked: addMonths(now, -10),
      nextReview: addMonths(now, 2),
      responsible: "Chief Financial Officer",
    },
    {
      id: "comp_005",
      category: "legal",
      name: "School Operating License",
      description: "Annual school operating license renewal",
      status: "compliant",
      dueDate: addMonths(now, 7),
      lastChecked: addMonths(now, -5),
      nextReview: addMonths(now, 7),
      responsible: "School Administrator",
    },
    {
      id: "comp_006",
      category: "staff",
      name: "Teacher Certifications",
      description: "Verify all teacher certifications are current",
      status: "warning",
      dueDate: addDays(now, 20),
      lastChecked: addMonths(now, -3),
      nextReview: addDays(now, 20),
      responsible: "HR Director",
      notes: "3 teachers need certification renewal",
    },
    {
      id: "comp_007",
      category: "facility",
      name: "Building Safety Inspection",
      description: "Structural safety inspection of all buildings",
      status: "compliant",
      dueDate: addMonths(now, 10),
      lastChecked: addMonths(now, -2),
      nextReview: addMonths(now, 10),
      responsible: "Facilities Manager",
    },
    {
      id: "comp_008",
      category: "accreditation",
      name: "School Accreditation",
      description: "International school accreditation renewal",
      status: "compliant",
      dueDate: addMonths(now, 18),
      lastChecked: addMonths(now, -6),
      nextReview: addMonths(now, 12),
      responsible: "Principal",
    },
  ]

  return items.map((item) => {
    if (item.dueDate) {
      const daysUntilDue = differenceInDays(item.dueDate, now)
      if (daysUntilDue < 0) {
        item.status = "expired"
      } else if (daysUntilDue < 30) {
        item.status = "warning"
      }
    }
    return item
  })
}

export async function updateComplianceItem(
  itemId: string,
  data: {
    status?: ComplianceStatus
    lastChecked?: Date
    nextReview?: Date
    documents?: string[]
    notes?: string
  }
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  return {
    success: true,
    itemId,
    updatedAt: new Date(),
    ...data,
  }
}

export async function getComplianceCalendar(
  startDate: Date = startOfYear(new Date()),
  endDate: Date = endOfYear(new Date())
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const items = await getComplianceItems()

  return items
    .filter(
      (item) => item.dueDate && item.dueDate >= startDate && item.dueDate <= endDate
    )
    .map((item) => ({
      id: item.id,
      title: item.name,
      date: item.dueDate!,
      category: item.category,
      status: item.status,
      responsible: item.responsible,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export async function generateComplianceReport(format: "summary" | "detailed" = "summary") {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const { overall, items, summary, alerts } = await getComplianceStatus()
  const calendar = await getComplianceCalendar()

  const report = {
    generatedAt: new Date(),
    school: schoolId,
    overall,
    summary,
    statistics: {
      total: items.length,
      compliant: items.filter((i) => i.status === "compliant").length,
      warning: items.filter((i) => i.status === "warning").length,
      pending: items.filter((i) => i.status === "pending").length,
      expired: items.filter((i) => i.status === "expired").length,
    },
    upcomingDeadlines: calendar.slice(0, 10),
    criticalAlerts: alerts.filter((a) => a.severity === "high"),
    recommendations: [
      items.filter((i) => i.status === "expired").length > 0
        ? `URGENT: ${items.filter((i) => i.status === "expired").length} compliance items have expired and require immediate attention.`
        : null,
      items.filter((i) => i.status === "warning").length > 0
        ? `Schedule reviews for ${items.filter((i) => i.status === "warning").length} items expiring within 30 days.`
        : null,
      "Maintain digital copies of all compliance documents for easy access during audits.",
    ].filter(Boolean),
  }

  if (format === "detailed") {
    return { ...report, items, fullCalendar: calendar, allAlerts: alerts }
  }

  return report
}

// ============================================================================
// EMERGENCY ALERTS
// ============================================================================

export async function getActiveAlerts(): Promise<EmergencyAlert[]> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const now = new Date()

  const [attendanceRate, studentCount] = await Promise.all([
    getAttendanceAlertStatus(),
    db.student.count({ where: { schoolId } }),
  ])

  const alerts: EmergencyAlert[] = []

  if (attendanceRate < 70) {
    alerts.push({
      id: "alert_attendance_001",
      type: "attendance",
      severity: attendanceRate < 50 ? "high" : "medium",
      title: "Low Attendance Alert",
      message: `School attendance is critically low at ${attendanceRate.toFixed(1)}%. Investigation required.`,
      createdAt: now,
      acknowledged: false,
      affectedCount: Math.floor(studentCount * (1 - attendanceRate / 100)),
      actionRequired: "Review attendance records and contact absent students' parents",
    })
  }

  alerts.push({
    id: "alert_financial_001",
    type: "financial",
    severity: "medium",
    title: "Fee Collection Below Target",
    message: "Current month fee collection at 65% of target with 5 days remaining.",
    createdAt: subDays(now, 1),
    acknowledged: false,
    actionRequired: "Send payment reminders to defaulters",
  })

  return alerts.filter((alert) => !alert.expiresAt || alert.expiresAt > now)
}

async function getAttendanceAlertStatus(): Promise<number> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return 100

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalStudents, presentStudents] = await Promise.all([
    db.student.count({ where: { schoolId } }),
    db.attendance.count({
      where: {
        schoolId,
        date: today,
        status: { in: ["PRESENT", "LATE"] },
      },
    }),
  ])

  return totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 100
}

export async function acknowledgeAlert(alertId: string, acknowledgedBy: string) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  return {
    success: true,
    alertId,
    acknowledgedAt: new Date(),
    acknowledgedBy,
  }
}

export async function createAlert(data: {
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  location?: string
  actionRequired: string
  expiresInHours?: number
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const alert: EmergencyAlert = {
    id: `alert_${data.type}_${Date.now()}`,
    type: data.type,
    severity: data.severity,
    title: data.title,
    message: data.message,
    createdAt: new Date(),
    acknowledged: false,
    location: data.location,
    actionRequired: data.actionRequired,
    expiresAt: data.expiresInHours
      ? new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000)
      : undefined,
  }

  if (alert.severity === "critical") {
    await notifyCriticalAlert(alert)
  }

  return alert
}

async function notifyCriticalAlert(alert: EmergencyAlert) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return

  const admins = await db.user.findMany({
    where: {
      schoolId,
      role: { in: ["ADMIN", "DEVELOPER"] },
    },
    select: {
      id: true,
      email: true,
      username: true,
    },
  })

  for (const admin of admins) {
    console.log(
      `Notifying admin ${admin.username || admin.email} about critical alert: ${alert.title}`
    )
  }
}

export async function getAlertHistory(
  limit: number = 50,
  includeAcknowledged: boolean = true
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const mockHistory: EmergencyAlert[] = [
    {
      id: "hist_001",
      type: "medical",
      severity: "high",
      title: "Medical Emergency - Student Injury",
      message: "Student injured during sports activity. Ambulance called.",
      createdAt: subDays(new Date(), 5),
      acknowledged: true,
      acknowledgedBy: "John Admin",
      acknowledgedAt: subDays(new Date(), 5),
      location: "Sports Field",
      actionRequired: "Provide first aid and notify parents",
    },
    {
      id: "hist_002",
      type: "fire",
      severity: "critical",
      title: "Fire Drill - Scheduled",
      message: "Scheduled fire drill completed successfully.",
      createdAt: subDays(new Date(), 10),
      acknowledged: true,
      acknowledgedBy: "Safety Officer",
      acknowledgedAt: subDays(new Date(), 10),
      location: "All buildings",
      actionRequired: "Evacuate all buildings as per protocol",
    },
    {
      id: "hist_003",
      type: "system",
      severity: "low",
      title: "System Maintenance",
      message: "Scheduled system maintenance completed.",
      createdAt: subDays(new Date(), 15),
      acknowledged: true,
      acknowledgedBy: "IT Admin",
      acknowledgedAt: subDays(new Date(), 15),
      actionRequired: "No action required",
    },
  ]

  return includeAcknowledged
    ? mockHistory
    : mockHistory.filter((alert) => !alert.acknowledged)
}

export async function getAlertStatistics() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const activeAlerts = await getActiveAlerts()
  const history = await getAlertHistory(100)

  return {
    active: activeAlerts.length,
    critical: activeAlerts.filter((a) => a.severity === "critical").length,
    high: activeAlerts.filter((a) => a.severity === "high").length,
    medium: activeAlerts.filter((a) => a.severity === "medium").length,
    low: activeAlerts.filter((a) => a.severity === "low").length,
    unacknowledged: activeAlerts.filter((a) => !a.acknowledged).length,
    last24Hours: history.filter((a) =>
      isWithinInterval(a.createdAt, {
        start: subHours(new Date(), 24),
        end: new Date(),
      })
    ).length,
    byType: {
      medical: history.filter((a) => a.type === "medical").length,
      security: history.filter((a) => a.type === "security").length,
      weather: history.filter((a) => a.type === "weather").length,
      fire: history.filter((a) => a.type === "fire").length,
      attendance: history.filter((a) => a.type === "attendance").length,
      financial: history.filter((a) => a.type === "financial").length,
    },
    averageResponseTime: "15 minutes",
  }
}

export async function getEmergencyProtocols() {
  return {
    fire: {
      steps: [
        "Activate fire alarm",
        "Evacuate all buildings via designated routes",
        "Assembly at designated safe zones",
        "Roll call by class teachers",
        "Contact fire department if real emergency",
        "All clear signal before re-entry",
      ],
      contacts: [
        { name: "Fire Department", number: "911" },
        { name: "School Safety Officer", number: "+1234567890" },
      ],
    },
    medical: {
      steps: [
        "Assess the situation and ensure safety",
        "Provide first aid if trained",
        "Call school nurse/medical staff",
        "Contact emergency services if serious",
        "Notify parents/guardians",
        "Document incident",
      ],
      contacts: [
        { name: "Emergency Medical", number: "911" },
        { name: "School Nurse", number: "+1234567891" },
      ],
    },
    lockdown: {
      steps: [
        "Announce lockdown via PA system",
        "Lock all doors and windows",
        "Turn off lights and silence devices",
        "Move away from windows and doors",
        "Wait for all-clear from authorities",
        "Controlled release after verification",
      ],
      contacts: [
        { name: "Police Department", number: "911" },
        { name: "School Security", number: "+1234567892" },
      ],
    },
  }
}

// ============================================================================
// UNIFIED DASHBOARD SECTIONS - Role-Specific Data
// ============================================================================

/**
 * Get upcoming data based on user role
 * Returns role-specific critical information for the Upcoming component
 */
export async function getUpcomingDataByRole(role: string) {
  const session = await auth()
  const userId = session?.user?.id
  const schoolId = session?.user?.schoolId

  if (!userId || !schoolId) {
    return null
  }

  switch (role.toUpperCase()) {
    case "STUDENT":
      return getStudentUpcomingData(userId, schoolId)
    case "TEACHER":
      return getTeacherUpcomingData(userId, schoolId)
    case "GUARDIAN":
      return getParentUpcomingData(userId, schoolId)
    case "STAFF":
      return getStaffUpcomingData(userId, schoolId)
    case "ACCOUNTANT":
      return getAccountantUpcomingData(schoolId)
    case "PRINCIPAL":
      return getPrincipalUpcomingData(schoolId)
    case "ADMIN":
    case "DEVELOPER":
    default:
      return getAdminUpcomingData(schoolId)
  }
}

async function getStudentUpcomingData(userId: string, schoolId: string) {
  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!student) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const studentClasses = await db.studentClass.findMany({
    where: { studentId: student.id, schoolId },
    select: { classId: true },
  })
  const classIds = studentClasses.map((sc) => sc.classId)

  // Get assignments with status
  const assignments = await db.assignment.findMany({
    where: {
      schoolId,
      classId: { in: classIds },
      status: "PUBLISHED",
    },
    include: {
      class: { select: { subject: { select: { subjectName: true } } } },
      submissions: {
        where: { studentId: student.id },
        select: { status: true },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  })

  // Get next class
  const dayOfWeek = today.getDay()
  const nextClass = await db.timetable.findFirst({
    where: { schoolId, dayOfWeek, classId: { in: classIds } },
    include: {
      class: { select: { subject: { select: { subjectName: true } } } },
      classroom: { select: { roomName: true } },
      period: { select: { startTime: true } },
    },
    orderBy: { period: { startTime: "asc" } },
  })

  return {
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      subject: a.class?.subject?.subjectName || "Unknown",
      dueDate: a.dueDate < today ? "Overdue" : a.dueDate.toLocaleDateString(),
      isOverdue: a.dueDate < today,
      status: (a.submissions[0]?.status?.toLowerCase() || "not_submitted") as
        | "not_submitted"
        | "submitted"
        | "graded",
    })),
    nextClass: nextClass
      ? {
          subject: nextClass.class?.subject?.subjectName || "Unknown",
          time: nextClass.period?.startTime
            ? new Date(nextClass.period.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "TBA",
          room: nextClass.classroom?.roomName || "TBA",
        }
      : undefined,
  }
}

async function getTeacherUpcomingData(userId: string, schoolId: string) {
  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!teacher) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayOfWeek = today.getDay()

  // Get today's classes
  const todaysClasses = await db.timetable.findMany({
    where: {
      schoolId,
      dayOfWeek,
      class: { teacherId: teacher.id },
    },
    include: {
      class: {
        select: {
          name: true,
          subject: { select: { subjectName: true } },
          _count: { select: { studentClasses: true } },
        },
      },
      classroom: { select: { roomName: true } },
      period: { select: { startTime: true } },
    },
    orderBy: { period: { startTime: "asc" } },
  })

  // Get pending grading count
  const pendingGrading = await db.assignmentSubmission.count({
    where: {
      schoolId,
      status: "SUBMITTED",
      assignment: { class: { teacherId: teacher.id } },
    },
  })

  // Get attendance due count
  const attendanceDue = await db.class.count({
    where: {
      teacherId: teacher.id,
      schoolId,
      NOT: {
        studentClasses: {
          every: {
            student: {
              attendances: { some: { date: { gte: today, lt: tomorrow } } },
            },
          },
        },
      },
    },
  })

  const nextClass = todaysClasses[0]

  return {
    nextClass: nextClass
      ? {
          subject: nextClass.class?.subject?.subjectName || nextClass.class?.name || "Unknown",
          time: nextClass.period?.startTime
            ? new Date(nextClass.period.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "TBA",
          room: nextClass.classroom?.roomName || "TBA",
          students: nextClass.class?._count?.studentClasses || 0,
        }
      : undefined,
    pendingGrading,
    attendanceDue,
    classesToday: todaysClasses.length,
  }
}

async function getParentUpcomingData(userId: string, schoolId: string) {
  const studentGuardians = await db.studentGuardian.findMany({
    where: { guardianId: userId, schoolId },
    include: {
      student: {
        select: {
          id: true,
          givenName: true,
          surname: true,
        },
      },
    },
  })

  if (studentGuardians.length === 0) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const children = await Promise.all(
    studentGuardians.map(async (sg) => {
      const studentClasses = await db.studentClass.findMany({
        where: { studentId: sg.student.id, schoolId },
        select: { classId: true },
      })
      const classIds = studentClasses.map((sc) => sc.classId)

      const [pendingAssignments, overdueAssignments] = await Promise.all([
        db.assignment.count({
          where: {
            schoolId,
            classId: { in: classIds },
            status: "PUBLISHED",
            dueDate: { gte: today },
            submissions: {
              none: { studentId: sg.student.id, status: { in: ["SUBMITTED", "GRADED"] } },
            },
          },
        }),
        db.assignment.count({
          where: {
            schoolId,
            classId: { in: classIds },
            status: "PUBLISHED",
            dueDate: { lt: today },
            submissions: {
              none: { studentId: sg.student.id, status: { in: ["SUBMITTED", "GRADED"] } },
            },
          },
        }),
      ])

      return {
        id: sg.student.id,
        name: `${sg.student.givenName} ${sg.student.surname}`.trim(),
        pendingAssignments,
        overdueAssignments,
      }
    })
  )

  // Get upcoming events
  const upcomingEvents = await db.announcement.findMany({
    where: {
      schoolId,
      published: true,
      createdAt: { gte: today },
    },
    select: { titleEn: true, titleAr: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: 3,
  })

  return {
    children,
    upcomingEvents: upcomingEvents.map((e) => ({
      title: e.titleEn || e.titleAr || "Event",
      date: e.createdAt.toLocaleDateString(),
    })),
  }
}

async function getStaffUpcomingData(userId: string, schoolId: string) {
  // For now, return mock data as staff tasks aren't fully modeled in Prisma
  return {
    urgentTasks: [
      { id: "1", title: "Review pending requests", priority: "high" as const },
      { id: "2", title: "Update inventory", priority: "medium" as const },
    ],
    pendingRequests: 5,
    todaysTasks: 8,
  }
}

async function getAccountantUpcomingData(schoolId: string) {
  // Get invoice/payment data
  const [pendingInvoices, overdueInvoices] = await Promise.all([
    db.userInvoice.count({ where: { schoolId, status: "UNPAID" } }),
    db.userInvoice.count({ where: { schoolId, status: "OVERDUE" } }),
  ])

  const pendingAmount = await db.userInvoice.aggregate({
    where: { schoolId, status: "UNPAID" },
    _sum: { total: true },
  })

  const overdueAmount = await db.userInvoice.aggregate({
    where: { schoolId, status: "OVERDUE" },
    _sum: { total: true },
  })

  return {
    pendingPayments: {
      count: pendingInvoices,
      totalAmount: pendingAmount._sum.total || 0,
    },
    overdueInvoices: {
      count: overdueInvoices,
      totalAmount: overdueAmount._sum.total || 0,
    },
    todayCollections: 0, // Would need payment tracking
  }
}

async function getPrincipalUpcomingData(schoolId: string) {
  const [criticalAlerts, pendingAnnouncements] = await Promise.all([
    getCriticalAlerts(),
    db.announcement.count({ where: { schoolId, published: false } }),
  ])

  return {
    criticalAlerts: criticalAlerts.map((a) => ({
      type: a.type,
      message: a.message,
      severity: a.severity as "high" | "medium" | "low",
    })),
    todayMeetings: 3, // Would need calendar integration
    pendingApprovals: pendingAnnouncements,
  }
}

async function getAdminUpcomingData(schoolId: string) {
  const [activeAlerts, pendingAnnouncements] = await Promise.all([
    getActiveAlerts(),
    db.announcement.count({ where: { schoolId, published: false } }),
  ])

  return {
    systemAlerts: activeAlerts.slice(0, 3).map((a) => ({
      type: a.type,
      message: a.message,
      severity: a.severity as "high" | "medium" | "low",
    })),
    pendingApprovals: pendingAnnouncements,
    activeIssues: activeAlerts.filter((a) => !a.acknowledged).length,
  }
}

/**
 * Get user-specific counts for Quick Look section
 */
export async function getQuickLookCounts(userId?: string) {
  const session = await auth()
  const effectiveUserId = userId || session?.user?.id
  const schoolId = session?.user?.schoolId

  if (!effectiveUserId || !schoolId) {
    return {
      announcements: { count: 0, unread: 0 },
      events: { count: 0, upcoming: 0 },
      notifications: { count: 0, unread: 0 },
      messages: { count: 0, unread: 0 },
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [announcementCount, recentAnnouncements, upcomingEvents] = await Promise.all([
    db.announcement.count({ where: { schoolId, published: true } }),
    db.announcement.count({
      where: { schoolId, published: true, createdAt: { gte: subDays(today, 7) } },
    }),
    db.announcement.count({
      where: { schoolId, published: true, createdAt: { gte: today } },
    }),
  ])

  return {
    announcements: { count: announcementCount, unread: recentAnnouncements },
    events: { count: upcomingEvents, upcoming: upcomingEvents },
    notifications: { count: 5, unread: 2 }, // Would need notification model
    messages: { count: 3, unread: 1 }, // Would need messages model
  }
}

/**
 * Get resource usage metrics based on user role
 */
export async function getResourceUsageByRole(role: string) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  const session = await auth()
  const userId = session?.user?.id

  switch (role.toUpperCase()) {
    case "STUDENT":
      return getStudentResourceUsage(userId, schoolId)
    case "TEACHER":
      return getTeacherResourceUsage(userId, schoolId)
    case "GUARDIAN":
      return getParentResourceUsage(userId, schoolId)
    case "STAFF":
      return getStaffResourceUsage(schoolId)
    case "ACCOUNTANT":
      return getAccountantResourceUsage(schoolId)
    case "PRINCIPAL":
      return getPrincipalResourceUsage(schoolId)
    case "ADMIN":
    case "DEVELOPER":
    default:
      return getAdminResourceUsage(schoolId)
  }
}

async function getStudentResourceUsage(userId: string | undefined, schoolId: string) {
  if (!userId) return []

  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!student) return []

  const [totalAttendance, presentDays] = await Promise.all([
    db.attendance.count({ where: { studentId: student.id, schoolId } }),
    db.attendance.count({ where: { studentId: student.id, schoolId, status: "PRESENT" } }),
  ])

  const attendanceRate = totalAttendance > 0 ? (presentDays / totalAttendance) * 100 : 0

  return [
    { name: "Assignment Completion", used: 85, limit: 100, unit: "%" },
    { name: "Attendance Rate", used: Math.round(attendanceRate), limit: 100, unit: "%" },
    { name: "Grade Average", used: 78, limit: 100, unit: "%" },
    { name: "Library Books", used: 3, limit: 5, unit: "books" },
  ]
}

async function getTeacherResourceUsage(userId: string | undefined, schoolId: string) {
  if (!userId) return []

  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!teacher) return []

  const [classCount, studentCount, pendingGrading, assignmentCount] = await Promise.all([
    db.class.count({ where: { teacherId: teacher.id, schoolId } }),
    db.studentClass.count({
      where: { class: { teacherId: teacher.id, schoolId } },
    }),
    db.assignmentSubmission.count({
      where: { schoolId, status: "SUBMITTED", assignment: { class: { teacherId: teacher.id } } },
    }),
    db.assignment.count({ where: { schoolId, class: { teacherId: teacher.id } } }),
  ])

  return [
    { name: "Classes Taught", used: classCount, limit: 10, unit: "classes" },
    { name: "Students", used: studentCount, limit: 200, unit: "students" },
    { name: "Pending Grading", used: pendingGrading, limit: 50, unit: "submissions" },
    { name: "Assignments Created", used: assignmentCount, limit: 100, unit: "assignments" },
  ]
}

async function getParentResourceUsage(userId: string | undefined, schoolId: string) {
  if (!userId) return []

  const childCount = await db.studentGuardian.count({
    where: { guardianId: userId, schoolId },
  })

  return [
    { name: "Children Enrolled", used: childCount, limit: 5, unit: "children" },
    { name: "Attendance Avg", used: 92, limit: 100, unit: "%" },
    { name: "Pending Tasks", used: 5, limit: 20, unit: "tasks" },
    { name: "Upcoming Events", used: 3, limit: 10, unit: "events" },
  ]
}

async function getStaffResourceUsage(schoolId: string) {
  return [
    { name: "Tasks Completed", used: 45, limit: 60, unit: "tasks" },
    { name: "Requests Processed", used: 28, limit: 40, unit: "requests" },
    { name: "Approvals Pending", used: 5, limit: 15, unit: "items" },
    { name: "Efficiency Rate", used: 88, limit: 100, unit: "%" },
  ]
}

async function getAccountantResourceUsage(schoolId: string) {
  const feeMetrics = await getFeeCollectionMetrics()

  return [
    { name: "Collection Rate", used: Math.round(feeMetrics.collectionRate), limit: 100, unit: "%" },
    { name: "Invoices Processed", used: 150, limit: 200, unit: "invoices" },
    { name: "Outstanding", used: Math.round(feeMetrics.pending / 1000), limit: 500, unit: "K" },
    { name: "Payments Today", used: 12, limit: 30, unit: "payments" },
  ]
}

async function getPrincipalResourceUsage(schoolId: string) {
  const [studentCount, teacherCount] = await Promise.all([
    db.student.count({ where: { schoolId } }),
    db.teacher.count({ where: { schoolId } }),
  ])

  return [
    { name: "School Capacity", used: studentCount, limit: 1000, unit: "students" },
    { name: "Staff Utilization", used: teacherCount, limit: 100, unit: "teachers" },
    { name: "Budget Usage", used: 78, limit: 100, unit: "%" },
    { name: "Satisfaction", used: 89, limit: 100, unit: "%" },
  ]
}

async function getAdminResourceUsage(schoolId: string) {
  const [userCount, studentCount, teacherCount] = await Promise.all([
    db.user.count({ where: { schoolId } }),
    db.student.count({ where: { schoolId } }),
    db.teacher.count({ where: { schoolId } }),
  ])

  return [
    { name: "System Usage", used: 65, limit: 100, unit: "%" },
    { name: "Storage", used: 2500, limit: 5000, unit: "MB" },
    { name: "Active Users", used: userCount, limit: 500, unit: "users" },
    { name: "API Calls", used: 8500, limit: 10000, unit: "calls" },
  ]
}

/**
 * Get invoice history based on user role
 */
export async function getInvoicesByRole(role: string) {
  const session = await auth()
  const userId = session?.user?.id
  const schoolId = session?.user?.schoolId

  if (!schoolId) return []

  switch (role.toUpperCase()) {
    case "STUDENT":
      return getStudentInvoices(userId, schoolId)
    case "TEACHER":
      return getTeacherInvoices(userId, schoolId) // Expense claims
    case "GUARDIAN":
      return getParentInvoices(userId, schoolId)
    case "STAFF":
      return getStaffInvoices(userId, schoolId)
    case "ACCOUNTANT":
    case "PRINCIPAL":
    case "ADMIN":
    case "DEVELOPER":
    default:
      return getAllSchoolInvoices(schoolId)
  }
}

async function getStudentInvoices(userId: string | undefined, schoolId: string) {
  if (!userId) return []

  const invoices = await db.userInvoice.findMany({
    where: { userId, schoolId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      invoice_no: true,
      invoice_date: true,
      total: true,
      status: true,
    },
  })

  return invoices.map((inv) => ({
    id: inv.id,
    date: inv.invoice_date.toLocaleDateString(),
    amount: `$${inv.total.toFixed(2)}`,
    status: inv.status.toLowerCase() as "paid" | "open" | "void",
    description: `Invoice #${inv.invoice_no}`,
  }))
}

async function getTeacherInvoices(userId: string | undefined, schoolId: string) {
  // Teachers see expense claims/reimbursements
  if (!userId) return []

  const expenses = await db.expense.findMany({
    where: { schoolId, submittedBy: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      expenseNumber: true,
      expenseDate: true,
      amount: true,
      status: true,
      description: true,
    },
  })

  return expenses.map((exp) => ({
    id: exp.id,
    date: exp.expenseDate.toLocaleDateString(),
    amount: `$${Number(exp.amount).toFixed(2)}`,
    status: exp.status === "PAID" ? "paid" : exp.status === "APPROVED" ? "open" : "void",
    description: exp.description.slice(0, 50),
  }))
}

async function getParentInvoices(userId: string | undefined, schoolId: string) {
  if (!userId) return []

  // Get all children's student IDs
  const children = await db.studentGuardian.findMany({
    where: { guardianId: userId, schoolId },
    include: { student: { select: { userId: true } } },
  })

  const childUserIds = children
    .map((c) => c.student.userId)
    .filter((id): id is string => id !== null)

  if (childUserIds.length === 0) return []

  const invoices = await db.userInvoice.findMany({
    where: { userId: { in: childUserIds }, schoolId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      invoice_no: true,
      invoice_date: true,
      total: true,
      status: true,
    },
  })

  return invoices.map((inv) => ({
    id: inv.id,
    date: inv.invoice_date.toLocaleDateString(),
    amount: `$${inv.total.toFixed(2)}`,
    status: inv.status.toLowerCase() as "paid" | "open" | "void",
    description: `Invoice #${inv.invoice_no}`,
  }))
}

async function getStaffInvoices(userId: string | undefined, schoolId: string) {
  // Staff see expense reports
  if (!userId) return []

  const expenses = await db.expense.findMany({
    where: { schoolId, submittedBy: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      expenseNumber: true,
      expenseDate: true,
      amount: true,
      status: true,
      description: true,
    },
  })

  return expenses.map((exp) => ({
    id: exp.id,
    date: exp.expenseDate.toLocaleDateString(),
    amount: `$${Number(exp.amount).toFixed(2)}`,
    status: exp.status === "PAID" ? "paid" : exp.status === "APPROVED" ? "open" : "void",
    description: exp.description.slice(0, 50),
  }))
}

async function getAllSchoolInvoices(schoolId: string) {
  const invoices = await db.userInvoice.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      invoice_no: true,
      invoice_date: true,
      total: true,
      status: true,
    },
  })

  return invoices.map((inv) => ({
    id: inv.id,
    date: inv.invoice_date.toLocaleDateString(),
    amount: `$${inv.total.toFixed(2)}`,
    status: inv.status.toLowerCase() as "paid" | "open" | "void",
    description: `Invoice #${inv.invoice_no}`,
  }))
}

/**
 * Get financial overview based on user role
 */
export async function getFinancialOverviewByRole(role: string) {
  const session = await auth()
  const userId = session?.user?.id
  const schoolId = session?.user?.schoolId

  if (!schoolId) return null

  switch (role.toUpperCase()) {
    case "STUDENT":
      return getStudentFinancialOverview(userId, schoolId)
    case "TEACHER":
      return { minimal: true } // Teachers have minimal financial view
    case "GUARDIAN":
      return getParentFinancialOverview(userId, schoolId)
    case "STAFF":
      return getStaffFinancialOverview(schoolId)
    case "ACCOUNTANT":
      return getAccountantFinancialOverview(schoolId)
    case "PRINCIPAL":
      return getPrincipalFinancialOverview(schoolId)
    case "ADMIN":
    case "DEVELOPER":
    default:
      return getAdminFinancialOverview(schoolId)
  }
}

async function getStudentFinancialOverview(userId: string | undefined, schoolId: string) {
  if (!userId) return null

  const invoices = await db.userInvoice.findMany({
    where: { userId, schoolId },
    select: { total: true, status: true, due_date: true },
  })

  const total = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const paid = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0)
  const pending = total - paid

  const nextDue = invoices
    .filter((inv) => inv.status !== "PAID")
    .sort((a, b) => a.due_date.getTime() - b.due_date.getTime())[0]

  return {
    personalFeeStatus: {
      total,
      paid,
      pending,
      dueDate: nextDue?.due_date || null,
    },
  }
}

async function getParentFinancialOverview(userId: string | undefined, schoolId: string) {
  if (!userId) return null

  const children = await db.studentGuardian.findMany({
    where: { guardianId: userId, schoolId },
    include: {
      student: {
        select: {
          givenName: true,
          surname: true,
          userId: true,
        },
      },
    },
  })

  const childrenFeeStatus = await Promise.all(
    children.map(async (c) => {
      if (!c.student.userId) {
        return {
          childName: `${c.student.givenName} ${c.student.surname}`,
          total: 0,
          paid: 0,
          pending: 0,
        }
      }

      const invoices = await db.userInvoice.findMany({
        where: { userId: c.student.userId, schoolId },
        select: { total: true, status: true },
      })

      const total = invoices.reduce((sum, inv) => sum + inv.total, 0)
      const paid = invoices
        .filter((inv) => inv.status === "PAID")
        .reduce((sum, inv) => sum + inv.total, 0)

      return {
        childName: `${c.student.givenName} ${c.student.surname}`,
        total,
        paid,
        pending: total - paid,
      }
    })
  )

  return { childrenFeeStatus }
}

async function getStaffFinancialOverview(schoolId: string) {
  // Staff see department budget status
  return {
    departmentBudget: {
      allocated: 50000,
      spent: 35000,
      remaining: 15000,
    },
  }
}

async function getAccountantFinancialOverview(schoolId: string) {
  const [feeMetrics, expenseMetrics] = await Promise.all([
    getFeeCollectionMetrics(),
    getExpenseMetrics(),
  ])

  return {
    revenue: {
      total: feeMetrics.collected,
      pending: feeMetrics.pending,
      overdue: feeMetrics.overdue,
      collectionRate: feeMetrics.collectionRate,
    },
    expenses: expenseMetrics,
    budget: {
      allocated: 1200000 / 12,
      remaining: (1200000 / 12) - expenseMetrics.total,
      utilizationRate: expenseMetrics.budgetUtilization,
    },
  }
}

async function getPrincipalFinancialOverview(schoolId: string) {
  const budget = await getBudgetStatus()

  return {
    schoolBudget: {
      allocated: budget.allocated,
      spent: budget.spent,
      remaining: budget.remaining,
      projections: budget.projections,
    },
  }
}

async function getAdminFinancialOverview(schoolId: string) {
  // Platform-level metrics
  const totalSchools = await db.school.count()
  const totalUsers = await db.user.count()

  return {
    platformMetrics: {
      totalSchools,
      totalUsers,
      mrr: 50000, // Mock data
      arr: 600000,
      growth: 12.5,
    },
  }
}
