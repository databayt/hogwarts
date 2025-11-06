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
          label: "Reports",
          href: `${baseUrl}/reports`,
        },
        {
          iconName: "CheckCircle",
          label: "Approvals",
          href: `${baseUrl}/approvals`,
        },
        {
          iconName: "Bell",
          label: "Announcements",
          href: `${baseUrl}/announcements/create`,
        },
        {
          iconName: "Users",
          label: "Users",
          href: `${baseUrl}/users`,
        },
        {
          iconName: "Settings",
          label: "Settings",
          href: `${baseUrl}/settings`,
        },
        {
          iconName: "BarChart3",
          label: "Analytics",
          href: `${baseUrl}/analytics`,
        },
      ];

    case "PRINCIPAL":
      return [
        {
          iconName: "FileText",
          label: "Reports",
          href: `${baseUrl}/reports`,
        },
        {
          iconName: "Users",
          label: "Staff",
          href: `${baseUrl}/staff`,
        },
        {
          iconName: "Bell",
          label: "Announcements",
          href: `${baseUrl}/announcements`,
        },
        {
          iconName: "CheckCircle",
          label: "Approvals",
          href: `${baseUrl}/approvals`,
        },
        {
          iconName: "BarChart3",
          label: "Performance",
          href: `${baseUrl}/performance`,
        },
        {
          iconName: "Calendar",
          label: "Events",
          href: `${baseUrl}/events`,
        },
      ];

    case "TEACHER":
      return [
        {
          iconName: "Users",
          label: "Attendance",
          href: `${baseUrl}/attendance/mark`,
        },
        {
          iconName: "FileText",
          label: "Grades",
          href: `${baseUrl}/grades/enter`,
        },
        {
          iconName: "BookOpen",
          label: "Assignments",
          href: `${baseUrl}/assignments/create`,
        },
        {
          iconName: "MessageSquare",
          label: "Messages",
          href: `${baseUrl}/messages`,
        },
        {
          iconName: "Calendar",
          label: "Timetable",
          href: `${baseUrl}/timetable`,
        },
        {
          iconName: "ClipboardList",
          label: "Lessons",
          href: `${baseUrl}/lessons`,
        },
      ];

    case "STUDENT":
      return [
        {
          iconName: "FileText",
          label: "Assignments",
          href: `${baseUrl}/assignments`,
        },
        {
          iconName: "Award",
          label: "Grades",
          href: `${baseUrl}/grades`,
        },
        {
          iconName: "CalendarDays",
          label: "Timetable",
          href: `${baseUrl}/timetable`,
        },
        {
          iconName: "MessageSquare",
          label: "Messages",
          href: `${baseUrl}/messages`,
        },
        {
          iconName: "BookOpen",
          label: "Library",
          href: `${baseUrl}/library`,
        },
        {
          iconName: "Clock",
          label: "Attendance",
          href: `${baseUrl}/attendance`,
        },
      ];

    case "GUARDIAN":
      return [
        {
          iconName: "Users",
          label: "Children",
          href: `${baseUrl}/children`,
        },
        {
          iconName: "Award",
          label: "Grades",
          href: `${baseUrl}/grades`,
        },
        {
          iconName: "Calendar",
          label: "Attendance",
          href: `${baseUrl}/attendance`,
        },
        {
          iconName: "MessageSquare",
          label: "Messages",
          href: `${baseUrl}/messages`,
        },
        {
          iconName: "DollarSign",
          label: "Fees",
          href: `${baseUrl}/finance/fees`,
        },
        {
          iconName: "Bell",
          label: "Announcements",
          href: `${baseUrl}/announcements`,
        },
      ];

    case "ACCOUNTANT":
      return [
        {
          iconName: "DollarSign",
          label: "Invoices",
          href: `${baseUrl}/finance/invoice`,
        },
        {
          iconName: "FileText",
          label: "Receipts",
          href: `${baseUrl}/finance/receipt`,
        },
        {
          iconName: "BarChart3",
          label: "Reports",
          href: `${baseUrl}/finance/reports`,
        },
        {
          iconName: "Users",
          label: "Fees",
          href: `${baseUrl}/finance/fees`,
        },
        {
          iconName: "CheckCircle",
          label: "Approvals",
          href: `${baseUrl}/finance/approvals`,
        },
        {
          iconName: "FolderOpen",
          label: "Budget",
          href: `${baseUrl}/finance/budget`,
        },
      ];

    case "STAFF":
      return [
        {
          iconName: "ClipboardList",
          label: "Tasks",
          href: `${baseUrl}/tasks`,
        },
        {
          iconName: "Calendar",
          label: "Schedule",
          href: `${baseUrl}/schedule`,
        },
        {
          iconName: "MessageSquare",
          label: "Messages",
          href: `${baseUrl}/messages`,
        },
        {
          iconName: "Bell",
          label: "Announcements",
          href: `${baseUrl}/announcements`,
        },
        {
          iconName: "FileText",
          label: "Reports",
          href: `${baseUrl}/reports`,
        },
        {
          iconName: "Users",
          label: "Directory",
          href: `${baseUrl}/directory`,
        },
      ];

    default:
      return [
        {
          iconName: "Bell",
          label: "Announcements",
          href: `${baseUrl}/announcements`,
        },
        {
          iconName: "MessageSquare",
          label: "Messages",
          href: `${baseUrl}/messages`,
        },
        {
          iconName: "Settings",
          label: "Settings",
          href: `${baseUrl}/settings`,
        },
      ];
  }
}
