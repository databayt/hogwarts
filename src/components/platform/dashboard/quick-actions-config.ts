import type { QuickAction } from "./quick-actions"

/**
 * Get quick actions based on user role
 * Each role has 4 focused actions tailored to their most critical responsibilities
 * Actions are practical and lead to real functionality
 */
export function getQuickActionsByRole(
  role: string,
  _subdomain?: string
): QuickAction[] {
  // Subdomain is handled via domain routing, not path
  switch (role.toUpperCase()) {
    case "ADMIN":
    case "DEVELOPER":
      // Admin: System management + Analytics focused
      return [
        {
          iconName: "BarChart",
          label: "School",
          description: "View school overview",
          href: "/school",
        },
        {
          iconName: "Gear",
          label: "Settings",
          description: "Configure school settings",
          href: "/settings",
        },
        {
          iconName: "FileText",
          label: "Finance",
          description: "View financial reports",
          href: "/finance",
        },
        {
          iconName: "Users",
          label: "Staff",
          description: "Manage staff members",
          href: "/staff",
        },
      ]

    case "PRINCIPAL":
      // Principal: School oversight + Strategic focused
      return [
        {
          iconName: "BarChart",
          label: "Performance",
          description: "Review school performance",
          href: "/school",
        },
        {
          iconName: "Users",
          label: "Staff",
          description: "Manage staff and teachers",
          href: "/staff",
        },
        {
          iconName: "FileText",
          label: "Reports",
          description: "View and generate reports",
          href: "/finance",
        },
        {
          iconName: "Announcement",
          label: "Announce",
          description: "Create school announcement",
          href: "/announcements",
        },
      ]

    case "TEACHER":
      // Teacher: Classroom management focused - practical daily tasks
      return [
        {
          iconName: "Checklist",
          label: "Attendance",
          description: "Take class attendance",
          href: "/attendance",
        },
        {
          iconName: "Pencil",
          label: "Grades",
          description: "Record student grades",
          href: "/grades",
        },
        {
          iconName: "Book",
          label: "Assignments",
          description: "Create or review assignments",
          href: "/assignments",
        },
        {
          iconName: "Calendar",
          label: "Schedule",
          description: "View your timetable",
          href: "/lessons",
        },
      ]

    case "STUDENT":
      // Student: Academic progress + Learning focused
      return [
        {
          iconName: "Book",
          label: "Assignments",
          description: "View pending assignments",
          href: "/assignments",
        },
        {
          iconName: "Sparkle",
          label: "My Grades",
          description: "Check your grades",
          href: "/grades",
        },
        {
          iconName: "Calendar",
          label: "Schedule",
          description: "View class schedule",
          href: "/lessons",
        },
        {
          iconName: "Chat",
          label: "Messages",
          description: "Send a message",
          href: "/messages",
        },
      ]

    case "GUARDIAN":
      // Parent: Child monitoring + Communication focused
      return [
        {
          iconName: "Users",
          label: "My Children",
          description: "View children's profiles",
          href: "/parents",
        },
        {
          iconName: "Sparkle",
          label: "Grades",
          description: "Check children's grades",
          href: "/grades",
        },
        {
          iconName: "Checklist",
          label: "Attendance",
          description: "View attendance records",
          href: "/attendance",
        },
        {
          iconName: "Chat",
          label: "Contact Teacher",
          description: "Message a teacher",
          href: "/messages",
        },
      ]

    case "ACCOUNTANT":
      // Accountant: Financial management focused - practical daily tasks
      return [
        {
          iconName: "Notebook",
          label: "Invoices",
          description: "Manage invoices",
          href: "/finance/invoice",
        },
        {
          iconName: "Notebook",
          label: "Fees",
          description: "Record fee payments",
          href: "/finance/fees",
        },
        {
          iconName: "BarChart",
          label: "Finance",
          description: "View financial reports",
          href: "/finance",
        },
        {
          iconName: "Archive",
          label: "Receipts",
          description: "View and print receipts",
          href: "/finance/receipt",
        },
      ]

    case "STAFF":
      // Staff: Operations focused - practical daily tasks
      return [
        {
          iconName: "TaskList",
          label: "Dashboard",
          description: "View dashboard",
          href: "/dashboard",
        },
        {
          iconName: "Announcement",
          label: "Announcements",
          description: "View announcements",
          href: "/announcements",
        },
        {
          iconName: "Calendar",
          label: "Events",
          description: "View events",
          href: "/events",
        },
        {
          iconName: "Users",
          label: "Staff",
          description: "Staff directory",
          href: "/staff",
        },
      ]

    default:
      // Default: Basic navigation for all users
      return [
        {
          iconName: "Announcement",
          label: "Announcements",
          description: "View announcements",
          href: "/announcements",
        },
        {
          iconName: "Chat",
          label: "Messages",
          description: "View messages",
          href: "/messages",
        },
        {
          iconName: "Calendar",
          label: "Events",
          description: "View upcoming events",
          href: "/events",
        },
        {
          iconName: "Gear",
          label: "Settings",
          description: "Account settings",
          href: "/settings",
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
  _subdomain?: string
): QuickAction[] {
  switch (role.toUpperCase()) {
    case "ADMIN":
    case "DEVELOPER":
      return [
        {
          iconName: "Announcement",
          label: "Announcements",
          description: "View announcements",
          href: "/announcements",
        },
        {
          iconName: "Calendar",
          label: "Events",
          description: "Schedule school event",
          href: "/events",
        },
        {
          iconName: "Users",
          label: "Classes",
          description: "Manage classes",
          href: "/classes",
        },
        {
          iconName: "Book",
          label: "Lessons",
          description: "View lessons",
          href: "/lessons",
        },
      ]

    case "TEACHER":
      return [
        {
          iconName: "Users",
          label: "Classes",
          description: "View assigned classes",
          href: "/classes",
        },
        {
          iconName: "Chat",
          label: "Messages",
          description: "Send a message",
          href: "/messages",
        },
        {
          iconName: "FileText",
          label: "Lessons",
          description: "View lesson plans",
          href: "/lessons",
        },
        {
          iconName: "Gear",
          label: "Settings",
          description: "Account settings",
          href: "/settings",
        },
      ]

    case "STUDENT":
      return [
        {
          iconName: "Book",
          label: "Library",
          description: "Browse library",
          href: "/library",
        },
        {
          iconName: "Lightning",
          label: "Notifications",
          description: "View notifications",
          href: "/notifications",
        },
        {
          iconName: "Calendar",
          label: "Events",
          description: "Upcoming events",
          href: "/events",
        },
        {
          iconName: "Gear",
          label: "Settings",
          description: "Account settings",
          href: "/settings",
        },
      ]

    default:
      return [
        {
          iconName: "Lightning",
          label: "Notifications",
          description: "View notifications",
          href: "/notifications",
        },
        {
          iconName: "Gear",
          label: "Settings",
          description: "Account settings",
          href: "/settings",
        },
      ]
  }
}
