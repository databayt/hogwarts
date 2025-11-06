import type { QuickAction } from "./quick-actions";
import type { Dictionary } from "@/components/internationalization/dictionaries";

/**
 * Get quick actions based on user role
 * Each role has specific actions tailored to their responsibilities
 */
export function getQuickActionsByRole(
  role: string,
  dictionary?: Dictionary["school"],
  subdomain?: string
): QuickAction[] {
  const baseUrl = subdomain ? `/s/${subdomain}` : "";

  switch (role.toUpperCase()) {
    case "ADMIN":
      return [
        {
          iconName: "FileText",
          label: dictionary?.dashboard?.quickActions?.generateReports || "Generate Reports",
          href: `${baseUrl}/reports`,
        },
        {
          iconName: "CheckCircle",
          label: dictionary?.dashboard?.quickActions?.approveRequests || "Approve Requests",
          href: `${baseUrl}/approvals`,
        },
        {
          iconName: "Bell",
          label: dictionary?.dashboard?.quickActions?.sendAnnouncements || "Send Announcements",
          href: `${baseUrl}/announcements/create`,
        },
        {
          iconName: "Users",
          label: dictionary?.dashboard?.quickActions?.userManagement || "User Management",
          href: `${baseUrl}/users`,
        },
        {
          iconName: "Settings",
          label: dictionary?.dashboard?.quickActions?.settings || "Settings",
          href: `${baseUrl}/settings`,
        },
        {
          iconName: "BarChart3",
          label: dictionary?.dashboard?.quickActions?.analytics || "Analytics",
          href: `${baseUrl}/analytics`,
        },
      ];

    case "PRINCIPAL":
      return [
        {
          iconName: "FileText",
          label: dictionary?.dashboard?.quickActions?.viewReports || "View Reports",
          href: `${baseUrl}/reports`,
        },
        {
          iconName: "Users",
          label: dictionary?.dashboard?.quickActions?.staffManagement || "Staff Management",
          href: `${baseUrl}/staff`,
        },
        {
          iconName: "Bell",
          label: dictionary?.dashboard?.quickActions?.announcements || "Announcements",
          href: `${baseUrl}/announcements`,
        },
        {
          iconName: "CheckCircle",
          label: dictionary?.dashboard?.quickActions?.approveRequests || "Approve Requests",
          href: `${baseUrl}/approvals`,
        },
        {
          iconName: "BarChart3",
          label: dictionary?.dashboard?.quickActions?.performance || "Performance",
          href: `${baseUrl}/performance`,
        },
        {
          iconName: "Calendar",
          label: dictionary?.dashboard?.quickActions?.events || "Events",
          href: `${baseUrl}/events`,
        },
      ];

    case "TEACHER":
      return [
        {
          iconName: "Users",
          label: dictionary?.teacherDashboard?.quickActions?.takeAttendance || "Take Attendance",
          href: `${baseUrl}/attendance/mark`,
        },
        {
          iconName: "FileText",
          label: dictionary?.teacherDashboard?.quickActions?.enterGrades || "Enter Grades",
          href: `${baseUrl}/grades/enter`,
        },
        {
          iconName: "BookOpen",
          label: dictionary?.teacherDashboard?.quickActions?.createAssignment || "Create Assignment",
          href: `${baseUrl}/assignments/create`,
        },
        {
          iconName: "MessageSquare",
          label: dictionary?.teacherDashboard?.quickActions?.messageParents || "Message Parents",
          href: `${baseUrl}/messages`,
        },
        {
          iconName: "Calendar",
          label: dictionary?.dashboard?.quickActions?.viewTimetable || "View Timetable",
          href: `${baseUrl}/timetable`,
        },
        {
          iconName: "ClipboardList",
          label: dictionary?.dashboard?.quickActions?.lessonPlans || "Lesson Plans",
          href: `${baseUrl}/lessons`,
        },
      ];

    case "STUDENT":
      return [
        {
          iconName: "FileText",
          label: dictionary?.studentDashboard?.quickActions?.submitAssignment || "Submit Assignment",
          href: `${baseUrl}/assignments`,
        },
        {
          iconName: "Award",
          label: dictionary?.studentDashboard?.quickActions?.checkGrades || "Check Grades",
          href: `${baseUrl}/grades`,
        },
        {
          iconName: "CalendarDays",
          label: dictionary?.studentDashboard?.quickActions?.viewTimetable || "View Timetable",
          href: `${baseUrl}/timetable`,
        },
        {
          iconName: "MessageSquare",
          label: dictionary?.studentDashboard?.quickActions?.messages || "Messages",
          href: `${baseUrl}/messages`,
        },
        {
          iconName: "BookOpen",
          label: dictionary?.dashboard?.quickActions?.library || "Library",
          href: `${baseUrl}/library`,
        },
        {
          iconName: "Clock",
          label: dictionary?.dashboard?.quickActions?.attendance || "Attendance",
          href: `${baseUrl}/attendance`,
        },
      ];

    case "GUARDIAN":
      return [
        {
          iconName: "Users",
          label: dictionary?.dashboard?.quickActions?.viewChildren || "View Children",
          href: `${baseUrl}/children`,
        },
        {
          iconName: "Award",
          label: dictionary?.dashboard?.quickActions?.checkGrades || "Check Grades",
          href: `${baseUrl}/grades`,
        },
        {
          iconName: "Calendar",
          label: dictionary?.dashboard?.quickActions?.attendance || "Attendance",
          href: `${baseUrl}/attendance`,
        },
        {
          iconName: "MessageSquare",
          label: dictionary?.dashboard?.quickActions?.messageTeachers || "Message Teachers",
          href: `${baseUrl}/messages`,
        },
        {
          iconName: "DollarSign",
          label: dictionary?.dashboard?.quickActions?.fees || "Fees",
          href: `${baseUrl}/finance/fees`,
        },
        {
          iconName: "Bell",
          label: dictionary?.dashboard?.quickActions?.announcements || "Announcements",
          href: `${baseUrl}/announcements`,
        },
      ];

    case "ACCOUNTANT":
      return [
        {
          iconName: "DollarSign",
          label: dictionary?.dashboard?.quickActions?.manageInvoices || "Manage Invoices",
          href: `${baseUrl}/finance/invoice`,
        },
        {
          iconName: "FileText",
          label: dictionary?.dashboard?.quickActions?.generateReceipts || "Generate Receipts",
          href: `${baseUrl}/finance/receipt`,
        },
        {
          iconName: "BarChart3",
          label: dictionary?.dashboard?.quickActions?.financialReports || "Financial Reports",
          href: `${baseUrl}/finance/reports`,
        },
        {
          iconName: "Users",
          label: dictionary?.dashboard?.quickActions?.feeManagement || "Fee Management",
          href: `${baseUrl}/finance/fees`,
        },
        {
          iconName: "CheckCircle",
          label: dictionary?.dashboard?.quickActions?.approvePayments || "Approve Payments",
          href: `${baseUrl}/finance/approvals`,
        },
        {
          iconName: "FolderOpen",
          label: dictionary?.dashboard?.quickActions?.budgetTracking || "Budget Tracking",
          href: `${baseUrl}/finance/budget`,
        },
      ];

    case "STAFF":
      return [
        {
          iconName: "ClipboardList",
          label: dictionary?.dashboard?.quickActions?.myTasks || "My Tasks",
          href: `${baseUrl}/tasks`,
        },
        {
          iconName: "Calendar",
          label: dictionary?.dashboard?.quickActions?.mySchedule || "My Schedule",
          href: `${baseUrl}/schedule`,
        },
        {
          iconName: "MessageSquare",
          label: dictionary?.dashboard?.quickActions?.messages || "Messages",
          href: `${baseUrl}/messages`,
        },
        {
          iconName: "Bell",
          label: dictionary?.dashboard?.quickActions?.announcements || "Announcements",
          href: `${baseUrl}/announcements`,
        },
        {
          iconName: "FileText",
          label: dictionary?.dashboard?.quickActions?.reports || "Reports",
          href: `${baseUrl}/reports`,
        },
        {
          iconName: "Users",
          label: dictionary?.dashboard?.quickActions?.directory || "Directory",
          href: `${baseUrl}/directory`,
        },
      ];

    default:
      return [
        {
          iconName: "Bell",
          label: dictionary?.dashboard?.quickActions?.announcements || "Announcements",
          href: `${baseUrl}/announcements`,
        },
        {
          iconName: "MessageSquare",
          label: dictionary?.dashboard?.quickActions?.messages || "Messages",
          href: `${baseUrl}/messages`,
        },
        {
          iconName: "Settings",
          label: dictionary?.dashboard?.quickActions?.settings || "Settings",
          href: `${baseUrl}/settings`,
        },
      ];
  }
}
