// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
          href: "/timetable",
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
          iconName: "Notebook",
          label: "Exams",
          description: "View your exams",
          href: "/exams",
        },
        {
          iconName: "Users",
          label: "Profile",
          description: "View your profile",
          href: "/profile",
        },
        {
          iconName: "Gear",
          label: "Settings",
          description: "Account settings",
          href: "/settings",
        },
      ]

    case "GUARDIAN":
      // Parent: Child monitoring + Communication focused
      return [
        {
          iconName: "Users",
          label: "Children",
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
          label: "Classrooms",
          description: "Manage classrooms",
          href: "/classrooms",
        },
        {
          iconName: "Book",
          label: "Subjects",
          description: "View subjects",
          href: "/subjects",
        },
      ]

    case "TEACHER":
      return [
        {
          iconName: "Users",
          label: "Classrooms",
          description: "View assigned classrooms",
          href: "/classrooms",
        },
        {
          iconName: "Chat",
          label: "Messages",
          description: "Send a message",
          href: "/messages",
        },
        {
          iconName: "FileText",
          label: "Subjects",
          description: "View subjects",
          href: "/subjects",
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
          iconName: "FileText",
          label: "Subjects",
          description: "View subjects",
          href: "/subjects",
        },
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

/**
 * Hrefs the home block's 2x2 cluster already links to (`home-block-client.tsx`
 * TILES). Top-up tiles skip them so the dashboard never shows the same app
 * twice within one screen; a role's own primary four are kept as written.
 */
const HOME_BLOCK_HREFS = new Set([
  "/notifications",
  "/messages",
  "/lumos",
  "/subjects",
])

/**
 * Places every role can open, in the order they top a short list up. Each has
 * Android tile art (`quick-actions.tsx` tileByLabel) and a dictionary label.
 */
const SHARED_ACTIONS: QuickAction[] = [
  {
    iconName: "Announcement",
    label: "Announcements",
    description: "View announcements",
    href: "/announcements",
  },
  {
    iconName: "Calendar",
    label: "Events",
    description: "View upcoming events",
    href: "/events",
  },
  {
    iconName: "Calendar",
    label: "Schedule",
    description: "View the timetable",
    href: "/timetable",
  },
  {
    iconName: "Checklist",
    label: "Attendance",
    description: "View attendance",
    href: "/attendance",
  },
  {
    iconName: "Book",
    label: "Library",
    description: "Browse library",
    href: "/library",
  },
  {
    iconName: "Users",
    label: "Profile",
    description: "View your profile",
    href: "/profile",
  },
  {
    iconName: "Gear",
    label: "Settings",
    description: "Account settings",
    href: "/settings",
  },
]

/**
 * The dashboard's tile row: the role's primary four, then its secondary
 * actions, then the shared list, deduplicated by href and label, up to
 * `count`. The school dashboard asks for four (the home grid's half is 4x2).
 */
export function getDashboardTileActions(
  role: string,
  count = 8
): QuickAction[] {
  const out = [...getQuickActionsByRole(role)]
  const seen = new Set(out.flatMap((a) => [a.href, a.label]))

  for (const action of [...getSecondaryQuickActions(role), ...SHARED_ACTIONS]) {
    if (out.length >= count) break
    if (HOME_BLOCK_HREFS.has(action.href ?? "")) continue
    if (seen.has(action.href) || seen.has(action.label)) continue
    out.push(action)
    seen.add(action.href)
    seen.add(action.label)
  }

  return out.slice(0, count)
}
