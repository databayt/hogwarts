import type { QuickAction } from "./quick-actions"

/**
 * Get quick actions based on user role
 * Each role has 4 focused actions tailored to their most critical responsibilities
 * Actions are practical and lead to real functionality
 */
export function getQuickActionsByRole(
  role: string,
  subdomain?: string
): QuickAction[] {
  const baseUrl = subdomain ? `/s/${subdomain}` : ""

  switch (role.toUpperCase()) {
    case "ADMIN":
    case "DEVELOPER":
      // Admin: System management + Analytics focused
      return [
        {
          iconName: "BarChart",
          label: "School",
          description: "View school overview",
          href: `${baseUrl}/school`,
        },
        {
          iconName: "Gear",
          label: "Settings",
          description: "Configure school settings",
          href: `${baseUrl}/settings`,
        },
        {
          iconName: "FileText",
          label: "Finance",
          description: "View financial reports",
          href: `${baseUrl}/finance`,
        },
        {
          iconName: "Users",
          label: "Staff",
          description: "Manage staff members",
          href: `${baseUrl}/staff`,
        },
      ]

    case "PRINCIPAL":
      // Principal: School oversight + Strategic focused
      return [
        {
          iconName: "BarChart",
          label: "Performance",
          description: "Review school performance",
          href: `${baseUrl}/analytics`,
        },
        {
          iconName: "Users",
          label: "Staff",
          description: "Manage staff and teachers",
          href: `${baseUrl}/staff`,
        },
        {
          iconName: "FileText",
          label: "Reports",
          description: "View and generate reports",
          href: `${baseUrl}/reports`,
        },
        {
          iconName: "Announcement",
          label: "Announce",
          description: "Create school announcement",
          href: `${baseUrl}/announcements/new`,
        },
      ]

    case "TEACHER":
      // Teacher: Classroom management focused - practical daily tasks
      return [
        {
          iconName: "Checklist",
          label: "Mark Attendance",
          description: "Take class attendance",
          href: `${baseUrl}/attendance/mark`,
        },
        {
          iconName: "Pencil",
          label: "Enter Grades",
          description: "Record student grades",
          href: `${baseUrl}/grades/enter`,
        },
        {
          iconName: "Book",
          label: "Assignments",
          description: "Create or review assignments",
          href: `${baseUrl}/assignments`,
        },
        {
          iconName: "Calendar",
          label: "My Schedule",
          description: "View your timetable",
          href: `${baseUrl}/timetable`,
        },
      ]

    case "STUDENT":
      // Student: Academic progress + Learning focused
      return [
        {
          iconName: "Book",
          label: "Assignments",
          description: "View pending assignments",
          href: `${baseUrl}/assignments`,
        },
        {
          iconName: "Sparkle",
          label: "My Grades",
          description: "Check your grades",
          href: `${baseUrl}/grades`,
        },
        {
          iconName: "Calendar",
          label: "Schedule",
          description: "View class schedule",
          href: `${baseUrl}/timetable`,
        },
        {
          iconName: "Chat",
          label: "Messages",
          description: "Send a message",
          href: `${baseUrl}/messaging`,
        },
      ]

    case "GUARDIAN":
      // Parent: Child monitoring + Communication focused
      return [
        {
          iconName: "Users",
          label: "My Children",
          description: "View children's profiles",
          href: `${baseUrl}/children`,
        },
        {
          iconName: "Sparkle",
          label: "Grades",
          description: "Check children's grades",
          href: `${baseUrl}/grades`,
        },
        {
          iconName: "Checklist",
          label: "Attendance",
          description: "View attendance records",
          href: `${baseUrl}/attendance`,
        },
        {
          iconName: "Chat",
          label: "Contact Teacher",
          description: "Message a teacher",
          href: `${baseUrl}/messaging/new`,
        },
      ]

    case "ACCOUNTANT":
      // Accountant: Financial management focused - practical daily tasks
      return [
        {
          iconName: "Notebook",
          label: "Create Invoice",
          description: "Generate new invoice",
          href: `${baseUrl}/finance/invoice/new`,
        },
        {
          iconName: "Notebook",
          label: "Collect Fees",
          description: "Record fee payments",
          href: `${baseUrl}/finance/fees`,
        },
        {
          iconName: "BarChart",
          label: "Financial Reports",
          description: "View financial reports",
          href: `${baseUrl}/finance/reports`,
        },
        {
          iconName: "Archive",
          label: "Receipts",
          description: "View and print receipts",
          href: `${baseUrl}/finance/receipt`,
        },
      ]

    case "STAFF":
      // Staff: Operations focused - practical daily tasks
      return [
        {
          iconName: "TaskList",
          label: "My Tasks",
          description: "View assigned tasks",
          href: `${baseUrl}/tasks`,
        },
        {
          iconName: "Notebook",
          label: "Submit Request",
          description: "Create a new request",
          href: `${baseUrl}/requests/new`,
        },
        {
          iconName: "Calendar",
          label: "My Schedule",
          description: "View work schedule",
          href: `${baseUrl}/schedule`,
        },
        {
          iconName: "Users",
          label: "Directory",
          description: "Find staff contacts",
          href: `${baseUrl}/directory`,
        },
      ]

    default:
      // Default: Basic navigation for all users
      return [
        {
          iconName: "Announcement",
          label: "Announcements",
          description: "View announcements",
          href: `${baseUrl}/announcements`,
        },
        {
          iconName: "Chat",
          label: "Messages",
          description: "View messages",
          href: `${baseUrl}/messaging`,
        },
        {
          iconName: "Calendar",
          label: "Events",
          description: "View upcoming events",
          href: `${baseUrl}/events`,
        },
        {
          iconName: "Gear",
          label: "Settings",
          description: "Account settings",
          href: `${baseUrl}/dashboard/settings`,
        },
      ]
  }
}

/**
 * Secondary quick actions for expanded view
 * These are less critical but still useful actions
 */
export function getSecondaryQuickActions(
  role: string,
  subdomain?: string
): QuickAction[] {
  const baseUrl = subdomain ? `/s/${subdomain}` : ""

  switch (role.toUpperCase()) {
    case "ADMIN":
    case "DEVELOPER":
      return [
        {
          iconName: "Announcement",
          label: "New Announcement",
          description: "Create announcement",
          href: `${baseUrl}/announcements/new`,
        },
        {
          iconName: "Calendar",
          label: "Create Event",
          description: "Schedule school event",
          href: `${baseUrl}/events/new`,
        },
        {
          iconName: "Archive",
          label: "Backup Data",
          description: "Backup school data",
          href: `${baseUrl}/settings/backup`,
        },
        {
          iconName: "ShieldCheck",
          label: "Security",
          description: "Review security settings",
          href: `${baseUrl}/settings/security`,
        },
      ]

    case "TEACHER":
      return [
        {
          iconName: "Users",
          label: "My Classes",
          description: "View assigned classes",
          href: `${baseUrl}/classes`,
        },
        {
          iconName: "Chat",
          label: "Messages",
          description: "Send a message",
          href: `${baseUrl}/messaging`,
        },
        {
          iconName: "FileText",
          label: "Lesson Plans",
          description: "View lesson plans",
          href: `${baseUrl}/lessons`,
        },
        {
          iconName: "Gear",
          label: "Preferences",
          description: "Account settings",
          href: `${baseUrl}/dashboard/settings`,
        },
      ]

    case "STUDENT":
      return [
        {
          iconName: "Book",
          label: "Library",
          description: "Browse library",
          href: `${baseUrl}/library`,
        },
        {
          iconName: "Lightning",
          label: "Notifications",
          description: "View notifications",
          href: `${baseUrl}/notifications`,
        },
        {
          iconName: "Calendar",
          label: "Events",
          description: "Upcoming events",
          href: `${baseUrl}/events`,
        },
        {
          iconName: "Gear",
          label: "Settings",
          description: "Account settings",
          href: `${baseUrl}/dashboard/settings`,
        },
      ]

    default:
      return [
        {
          iconName: "Lightning",
          label: "Notifications",
          description: "View notifications",
          href: `${baseUrl}/notifications`,
        },
        {
          iconName: "Gear",
          label: "Settings",
          description: "Account settings",
          href: `${baseUrl}/dashboard/settings`,
        },
      ]
  }
}
