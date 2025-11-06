import {
  Users,
  FileText,
  Bell,
  CheckCircle,
  Calendar,
  BookOpen,
  Award,
  CalendarDays,
  MessageSquare,
  ClipboardList,
  DollarSign,
  Settings,
  UserPlus,
  BarChart3,
  Clock,
  FolderOpen,
} from "lucide-react";
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
          icon: FileText,
          label: dictionary?.dashboard?.quickActions?.generateReports || "Generate Reports",
          href: `${baseUrl}/reports`,
        },
        {
          icon: CheckCircle,
          label: dictionary?.dashboard?.quickActions?.approveRequests || "Approve Requests",
          href: `${baseUrl}/approvals`,
        },
        {
          icon: Bell,
          label: dictionary?.dashboard?.quickActions?.sendAnnouncements || "Send Announcements",
          href: `${baseUrl}/announcements/create`,
        },
        {
          icon: Users,
          label: dictionary?.dashboard?.quickActions?.userManagement || "User Management",
          href: `${baseUrl}/users`,
        },
        {
          icon: Settings,
          label: dictionary?.dashboard?.quickActions?.settings || "Settings",
          href: `${baseUrl}/settings`,
        },
        {
          icon: BarChart3,
          label: dictionary?.dashboard?.quickActions?.analytics || "Analytics",
          href: `${baseUrl}/analytics`,
        },
      ];

    case "PRINCIPAL":
      return [
        {
          icon: FileText,
          label: dictionary?.dashboard?.quickActions?.viewReports || "View Reports",
          href: `${baseUrl}/reports`,
        },
        {
          icon: Users,
          label: dictionary?.dashboard?.quickActions?.staffManagement || "Staff Management",
          href: `${baseUrl}/staff`,
        },
        {
          icon: Bell,
          label: dictionary?.dashboard?.quickActions?.announcements || "Announcements",
          href: `${baseUrl}/announcements`,
        },
        {
          icon: CheckCircle,
          label: dictionary?.dashboard?.quickActions?.approveRequests || "Approve Requests",
          href: `${baseUrl}/approvals`,
        },
        {
          icon: BarChart3,
          label: dictionary?.dashboard?.quickActions?.performance || "Performance",
          href: `${baseUrl}/performance`,
        },
        {
          icon: Calendar,
          label: dictionary?.dashboard?.quickActions?.events || "Events",
          href: `${baseUrl}/events`,
        },
      ];

    case "TEACHER":
      return [
        {
          icon: Users,
          label: dictionary?.teacherDashboard?.quickActions?.takeAttendance || "Take Attendance",
          href: `${baseUrl}/attendance/mark`,
        },
        {
          icon: FileText,
          label: dictionary?.teacherDashboard?.quickActions?.enterGrades || "Enter Grades",
          href: `${baseUrl}/grades/enter`,
        },
        {
          icon: BookOpen,
          label: dictionary?.teacherDashboard?.quickActions?.createAssignment || "Create Assignment",
          href: `${baseUrl}/assignments/create`,
        },
        {
          icon: MessageSquare,
          label: dictionary?.teacherDashboard?.quickActions?.messageParents || "Message Parents",
          href: `${baseUrl}/messages`,
        },
        {
          icon: Calendar,
          label: dictionary?.dashboard?.quickActions?.viewTimetable || "View Timetable",
          href: `${baseUrl}/timetable`,
        },
        {
          icon: ClipboardList,
          label: dictionary?.dashboard?.quickActions?.lessonPlans || "Lesson Plans",
          href: `${baseUrl}/lessons`,
        },
      ];

    case "STUDENT":
      return [
        {
          icon: FileText,
          label: dictionary?.studentDashboard?.quickActions?.submitAssignment || "Submit Assignment",
          href: `${baseUrl}/assignments`,
        },
        {
          icon: Award,
          label: dictionary?.studentDashboard?.quickActions?.checkGrades || "Check Grades",
          href: `${baseUrl}/grades`,
        },
        {
          icon: CalendarDays,
          label: dictionary?.studentDashboard?.quickActions?.viewTimetable || "View Timetable",
          href: `${baseUrl}/timetable`,
        },
        {
          icon: MessageSquare,
          label: dictionary?.studentDashboard?.quickActions?.messages || "Messages",
          href: `${baseUrl}/messages`,
        },
        {
          icon: BookOpen,
          label: dictionary?.dashboard?.quickActions?.library || "Library",
          href: `${baseUrl}/library`,
        },
        {
          icon: Clock,
          label: dictionary?.dashboard?.quickActions?.attendance || "Attendance",
          href: `${baseUrl}/attendance`,
        },
      ];

    case "GUARDIAN":
      return [
        {
          icon: Users,
          label: dictionary?.dashboard?.quickActions?.viewChildren || "View Children",
          href: `${baseUrl}/children`,
        },
        {
          icon: Award,
          label: dictionary?.dashboard?.quickActions?.checkGrades || "Check Grades",
          href: `${baseUrl}/grades`,
        },
        {
          icon: Calendar,
          label: dictionary?.dashboard?.quickActions?.attendance || "Attendance",
          href: `${baseUrl}/attendance`,
        },
        {
          icon: MessageSquare,
          label: dictionary?.dashboard?.quickActions?.messageTeachers || "Message Teachers",
          href: `${baseUrl}/messages`,
        },
        {
          icon: DollarSign,
          label: dictionary?.dashboard?.quickActions?.fees || "Fees",
          href: `${baseUrl}/finance/fees`,
        },
        {
          icon: Bell,
          label: dictionary?.dashboard?.quickActions?.announcements || "Announcements",
          href: `${baseUrl}/announcements`,
        },
      ];

    case "ACCOUNTANT":
      return [
        {
          icon: DollarSign,
          label: dictionary?.dashboard?.quickActions?.manageInvoices || "Manage Invoices",
          href: `${baseUrl}/finance/invoice`,
        },
        {
          icon: FileText,
          label: dictionary?.dashboard?.quickActions?.generateReceipts || "Generate Receipts",
          href: `${baseUrl}/finance/receipt`,
        },
        {
          icon: BarChart3,
          label: dictionary?.dashboard?.quickActions?.financialReports || "Financial Reports",
          href: `${baseUrl}/finance/reports`,
        },
        {
          icon: Users,
          label: dictionary?.dashboard?.quickActions?.feeManagement || "Fee Management",
          href: `${baseUrl}/finance/fees`,
        },
        {
          icon: CheckCircle,
          label: dictionary?.dashboard?.quickActions?.approvePayments || "Approve Payments",
          href: `${baseUrl}/finance/approvals`,
        },
        {
          icon: FolderOpen,
          label: dictionary?.dashboard?.quickActions?.budgetTracking || "Budget Tracking",
          href: `${baseUrl}/finance/budget`,
        },
      ];

    case "STAFF":
      return [
        {
          icon: ClipboardList,
          label: dictionary?.dashboard?.quickActions?.myTasks || "My Tasks",
          href: `${baseUrl}/tasks`,
        },
        {
          icon: Calendar,
          label: dictionary?.dashboard?.quickActions?.mySchedule || "My Schedule",
          href: `${baseUrl}/schedule`,
        },
        {
          icon: MessageSquare,
          label: dictionary?.dashboard?.quickActions?.messages || "Messages",
          href: `${baseUrl}/messages`,
        },
        {
          icon: Bell,
          label: dictionary?.dashboard?.quickActions?.announcements || "Announcements",
          href: `${baseUrl}/announcements`,
        },
        {
          icon: FileText,
          label: dictionary?.dashboard?.quickActions?.reports || "Reports",
          href: `${baseUrl}/reports`,
        },
        {
          icon: Users,
          label: dictionary?.dashboard?.quickActions?.directory || "Directory",
          href: `${baseUrl}/directory`,
        },
      ];

    default:
      return [
        {
          icon: Bell,
          label: dictionary?.dashboard?.quickActions?.announcements || "Announcements",
          href: `${baseUrl}/announcements`,
        },
        {
          icon: MessageSquare,
          label: dictionary?.dashboard?.quickActions?.messages || "Messages",
          href: `${baseUrl}/messages`,
        },
        {
          icon: Settings,
          label: dictionary?.dashboard?.quickActions?.settings || "Settings",
          href: `${baseUrl}/settings`,
        },
      ];
  }
}
