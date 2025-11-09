"use server"

import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns";
import { getFinancialSummary } from "./financial";
import { getActiveAlerts } from "./emergency";
import { getComplianceStatus } from "./compliance";

/**
 * Principal Dashboard Actions
 * Comprehensive data fetching for school leadership overview
 */

// ==================== SCHOOL PERFORMANCE SCORECARD ====================

export async function getSchoolPerformanceScorecard() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const [
    academicScore,
    attendanceScore,
    disciplineScore,
    parentSatisfactionScore,
    financialHealthScore
  ] = await Promise.all([
    calculateAcademicScore(),
    calculateAttendanceScore(),
    calculateDisciplineScore(),
    calculateParentSatisfactionScore(),
    calculateFinancialHealthScore(),
  ]);

  const overall = (
    academicScore * 0.3 +
    attendanceScore * 0.25 +
    disciplineScore * 0.15 +
    parentSatisfactionScore * 0.15 +
    financialHealthScore * 0.15
  );

  return {
    overall: Math.round(overall * 10) / 10,
    academic: Math.round(academicScore * 10) / 10,
    attendance: Math.round(attendanceScore * 10) / 10,
    discipline: Math.round(disciplineScore * 10) / 10,
    parentSatisfaction: Math.round(parentSatisfactionScore * 10) / 10,
    financialHealth: Math.round(financialHealthScore * 10) / 10,
  };
}

async function calculateAcademicScore(): Promise<number> {
  const { schoolId } = await getTenantContext();
  if (!schoolId) return 0;

  // Calculate based on exam results
  const recentExamResults = await db.examResult.findMany({
    where: { schoolId },
    take: 100,
    orderBy: { createdAt: "desc" },
    select: { percentage: true },
  });

  if (recentExamResults.length === 0) return 75; // Default score

  const avgPercentage =
    recentExamResults.reduce((sum, r) => sum + r.percentage, 0) /
    recentExamResults.length;

  return avgPercentage;
}

async function calculateAttendanceScore(): Promise<number> {
  const { schoolId } = await getTenantContext();
  if (!schoolId) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalRecords, presentRecords] = await Promise.all([
    db.attendance.count({
      where: {
        schoolId,
        date: {
          gte: subDays(today, 30), // Last 30 days
          lte: today,
        },
      },
    }),
    db.attendance.count({
      where: {
        schoolId,
        date: {
          gte: subDays(today, 30),
          lte: today,
        },
        status: { in: ["PRESENT", "LATE"] },
      },
    }),
  ]);

  return totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 95;
}

async function calculateDisciplineScore(): Promise<number> {
  // In production, this would calculate based on disciplinary records
  // For now, return a calculated score based on some metrics
  const { schoolId } = await getTenantContext();
  if (!schoolId) return 0;

  // Mock calculation - in production would query incident records
  const baseScore = 85; // Start with base score

  // Could subtract points for incidents, add for positive behavior
  return baseScore;
}

async function calculateParentSatisfactionScore(): Promise<number> {
  // In production, this would be based on parent surveys and feedback
  const { schoolId } = await getTenantContext();
  if (!schoolId) return 0;

  // Mock calculation - would aggregate parent feedback scores
  return 88.5;
}

async function calculateFinancialHealthScore(): Promise<number> {
  const financial = await getFinancialSummary();

  // Calculate score based on collection rate and budget utilization
  const collectionScore = financial.revenue.collectionRate;
  const budgetScore = Math.max(0, 100 - Math.abs(financial.budget.utilizationRate - 75));

  return (collectionScore + budgetScore) / 2;
}

// ==================== CRITICAL ALERTS ====================

export async function getCriticalAlerts() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const [emergencyAlerts, complianceStatus, financialSummary] = await Promise.all([
    getActiveAlerts(),
    getComplianceStatus(),
    getFinancialSummary(),
  ]);

  const alerts: Array<{
    type: string;
    message: string;
    severity: string;
    action: string;
    timestamp: Date;
  }> = [];

  // Add emergency alerts
  emergencyAlerts
    .filter(alert => alert.severity === "high" || alert.severity === "critical")
    .forEach(alert => {
      alerts.push({
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        action: alert.actionRequired,
        timestamp: alert.createdAt,
      });
    });

  // Add compliance alerts
  complianceStatus.alerts
    .filter(alert => alert.severity === "high")
    .forEach(alert => {
      alerts.push({
        type: "Compliance",
        message: alert.message,
        severity: alert.severity,
        action: "Review compliance status",
        timestamp: new Date(),
      });
    });

  // Add financial alerts
  financialSummary.alerts.forEach(alert => {
    alerts.push({
      type: "Financial",
      message: alert.message,
      severity: alert.severity,
      action: "Review financial lab",
      timestamp: new Date(),
    });
  });

  return alerts.slice(0, 5); // Return top 5 critical alerts
}

// ==================== TODAY'S PRIORITIES ====================

export async function getTodaysPriorities() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const priorities: Array<{
    priority: string;
    time: string;
    status: "scheduled" | "pending" | "completed";
    type: string;
  }> = [];

  // Get scheduled meetings (would query calendar/meeting table)
  priorities.push({
    priority: "Staff Meeting",
    time: "9:00 AM",
    status: "scheduled" as const,
    type: "meeting",
  });

  // Check for pending approvals
  const pendingAnnouncements = await db.announcement.count({
    where: { schoolId, published: false },
  });

  if (pendingAnnouncements > 0) {
    priorities.push({
      priority: `Review ${pendingAnnouncements} Pending Announcements`,
      time: "Urgent",
      status: "pending" as const,
      type: "approval",
    });
  }

  // Check compliance deadlines
  const compliance = await getComplianceStatus();
  const urgentCompliance = compliance.alerts.filter(a => a.severity === "high");

  if (urgentCompliance.length > 0) {
    priorities.push({
      priority: `Address ${urgentCompliance.length} Compliance Issues`,
      time: "Today",
      status: "pending" as const,
      type: "compliance",
    });
  }

  return priorities;
}

// ==================== ACADEMIC PERFORMANCE TRENDS ====================

export async function getAcademicPerformanceTrends() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // Get subjects with recent exam results
  const subjects = await db.subject.findMany({
    where: { schoolId },
    include: {
      exams: {
        where: {
          examDate: {
            gte: subMonths(new Date(), 3), // Last 3 months
          },
        },
        include: {
          results: {
            select: {
              percentage: true,
            },
          },
        },
      },
    },
  });

  const trends = subjects.map(subject => {
    const allResults = subject.exams.flatMap(exam => exam.results);
    const currentAvg =
      allResults.length > 0
        ? allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length
        : 0;

    // Calculate trend (in production, would compare with previous period)
    const previousAvg = currentAvg - (Math.random() * 10 - 5); // Mock previous average
    const improvement = currentAvg - previousAvg;

    return {
      subject: subject.subjectName,
      trend: improvement > 1 ? "up" : improvement < -1 ? "down" : "stable",
      improvement: `${improvement > 0 ? "+" : ""}${improvement.toFixed(1)}%`,
      currentAvg: currentAvg.toFixed(1),
    };
  });

  return trends.slice(0, 4); // Return top 4 subjects
}

// ==================== DISCIPLINARY SUMMARY ====================

export async function getDisciplinarySummary() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // In production, this would query actual disciplinary records
  // For now, return calculated mock data based on school size
  const totalStudents = await db.student.count({ where: { schoolId } });

  // Estimate incidents (in production, query actual incident table)
  const incidentRate = 0.05; // 5% of students per month
  const totalIncidents = Math.floor(totalStudents * incidentRate);
  const resolved = Math.floor(totalIncidents * 0.8);
  const pending = totalIncidents - resolved;

  return {
    totalIncidents,
    resolved,
    pending,
    trend: "decreasing" as const,
    topIssues: [
      "Late to class",
      "Missing homework",
      "Classroom disruption",
    ],
    monthlyComparison: {
      current: totalIncidents,
      previous: Math.floor(totalIncidents * 1.2),
      change: -16.7,
    },
  };
}

// ==================== STAFF EVALUATIONS DUE ====================

export async function getStaffEvaluationsDue() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // Get teachers who haven't been evaluated recently
  const teachers = await db.teacher.findMany({
    where: { schoolId },
    take: 5,
    select: {
      id: true,
      givenName: true,
      surname: true,
      teacherDepartments: {
        where: {
          isPrimary: true,
        },
        select: {
          department: {
            select: {
              departmentName: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  // In production, would check actual evaluation records
  return teachers.map((teacher, index) => ({
    teacher: `${teacher.givenName} ${teacher.surname}`,
    department: teacher.teacherDepartments[0]?.department?.departmentName || "General",
    dueDate: new Date(Date.now() + (index + 1) * 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: index === 1 ? "in-progress" as const : "pending" as const,
    lastEvaluation: subMonths(new Date(), 6 + index),
  }));
}

// ==================== BUDGET STATUS ====================

export async function getBudgetStatus() {
  const financial = await getFinancialSummary();

  const allocated = 2500000; // Annual budget
  const monthlyAllocated = allocated / 12;
  const spent = financial.expenses.total;
  const remaining = monthlyAllocated - spent;
  const utilization = (spent / monthlyAllocated) * 100;

  return {
    allocated: monthlyAllocated,
    spent,
    remaining,
    utilization,
    projections: utilization > 90 ? "Over budget" : utilization > 75 ? "On track" : "Under budget",
    yearToDate: {
      allocated: allocated * (new Date().getMonth() + 1) / 12,
      spent: spent * (new Date().getMonth() + 1),
    },
    categories: financial.expenses.categories,
  };
}

// ==================== PARENT FEEDBACK SUMMARY ====================

export async function getParentFeedback() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // In production, would aggregate actual parent survey responses
  // For now, return calculated scores
  const totalParents = await db.guardian.count({ where: { schoolId } });

  return {
    responseRate: 65, // 65% of parents responded
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
  };
}

// ==================== GOAL PROGRESS ====================

export async function getGoalProgress() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const [academicScore, attendanceScore, parentFeedback] = await Promise.all([
    calculateAcademicScore(),
    calculateAttendanceScore(),
    getParentFeedback(),
  ]);

  const goals = [
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
  ];

  return goals;
}

// ==================== UPCOMING BOARD MEETINGS ====================

export async function getUpcomingBoardMeetings() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // In production, would query actual meeting/calendar table
  const meetings = [
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
  ];

  return meetings;
}

// ==================== MONTHLY HIGHLIGHTS ====================

export async function getMonthlyHighlights() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const highlights: Array<{
    highlight: string;
    description: string;
    impact: "high" | "medium" | "low";
  }> = [];

  // Check for achievements
  const topExamResults = await db.examResult.findMany({
    where: {
      schoolId,
      percentage: { gte: 95 },
      createdAt: { gte: startOfMonth(new Date()) },
    },
    take: 1,
  });

  if (topExamResults.length > 0) {
    highlights.push({
      highlight: "Academic Excellence",
      description: `${topExamResults.length} students achieved 95%+ in recent exams`,
      impact: "high" as const,
    });
  }

  // Check for new enrollments
  const newStudents = await db.student.count({
    where: {
      schoolId,
      createdAt: { gte: startOfMonth(new Date()) },
    },
  });

  if (newStudents > 0) {
    highlights.push({
      highlight: "New Enrollments",
      description: `${newStudents} new students joined this month`,
      impact: "medium" as const,
    });
  }

  // Check for events
  const recentAnnouncements = await db.announcement.count({
    where: {
      schoolId,
      createdAt: { gte: startOfMonth(new Date()) },
    },
  });

  if (recentAnnouncements > 0) {
    highlights.push({
      highlight: "School Events",
      description: `${recentAnnouncements} major events organized this month`,
      impact: "medium" as const,
    });
  }

  return highlights;
}

// ==================== COMPREHENSIVE PRINCIPAL DASHBOARD ====================

export async function getPrincipalDashboardData() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

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
  ]);

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
  };
}