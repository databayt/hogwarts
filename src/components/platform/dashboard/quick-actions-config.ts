import type { QuickAction } from "./quick-actions";
import type { Dictionary } from "@/components/internationalization/dictionaries";

/**
 * Get quick actions based on user role
 * Each role has 4 focused actions tailored to their most critical responsibilities
 */
export function getQuickActionsByRole(
  role: string,
  dictionary?: Dictionary["school"],
  subdomain?: string
): QuickAction[] {
  const baseUrl = subdomain ? `/s/${subdomain}` : "";

  switch (role.toUpperCase()) {
    case "ADMIN":
      // Admin: System management focused
      return [
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
          iconName: "FileText",
          label: "Reports",
          href: `${baseUrl}/reports`,
        },
        {
          iconName: "BarChart3",
          label: "Analytics",
          href: `${baseUrl}/analytics`,
        },
      ];

    case "PRINCIPAL":
      // Principal: School oversight focused
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
          iconName: "BarChart3",
          label: "Performance",
          href: `${baseUrl}/performance`,
        },
        {
          iconName: "PieChart",
          label: "Analytics",
          href: `${baseUrl}/analytics`,
        },
      ];

    case "TEACHER":
      // Teacher: Classroom management focused
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
          iconName: "Calendar",
          label: "Timetable",
          href: `${baseUrl}/timetable`,
        },
      ];

    case "STUDENT":
      // Student: Academic progress focused
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
      ];

    case "GUARDIAN":
      // Parent: Child monitoring focused
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
      ];

    case "ACCOUNTANT":
      // Accountant: Financial management focused
      return [
        {
          iconName: "DollarSign",
          label: "Invoices",
          href: `${baseUrl}/finance/invoice`,
        },
        {
          iconName: "Users",
          label: "Fees",
          href: `${baseUrl}/finance/fees`,
        },
        {
          iconName: "BarChart3",
          label: "Reports",
          href: `${baseUrl}/finance/reports`,
        },
        {
          iconName: "FileText",
          label: "Receipts",
          href: `${baseUrl}/finance/receipt`,
        },
      ];

    case "STAFF":
      // Staff: Operations focused
      return [
        {
          iconName: "ClipboardList",
          label: "Tasks",
          href: `${baseUrl}/tasks`,
        },
        {
          iconName: "FileText",
          label: "Requests",
          href: `${baseUrl}/requests`,
        },
        {
          iconName: "Calendar",
          label: "Schedule",
          href: `${baseUrl}/schedule`,
        },
        {
          iconName: "Users",
          label: "Directory",
          href: `${baseUrl}/directory`,
        },
      ];

    default:
      // Default: Basic navigation
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
          iconName: "Calendar",
          label: "Calendar",
          href: `${baseUrl}/calendar`,
        },
        {
          iconName: "Settings",
          label: "Settings",
          href: `${baseUrl}/settings`,
        },
      ];
  }
}
