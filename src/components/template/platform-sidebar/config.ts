// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

type IconKey = keyof typeof import("./icons").Icons

export type PlatformNavItem = {
  key: string
  title: string
  href: string
  icon: IconKey
  roles: Role[]
  alwaysVisible?: boolean
  className?: string
}

export type Role =
  | "DEVELOPER"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN"
  | "ACCOUNTANT"
  | "STAFF"
  | "USER"

const ALL_ROLES: Role[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
  "USER",
]

export const platformNav: PlatformNavItem[] = [
  // Core – always visible, not toggleable
  {
    key: "dashboard",
    title: "Overview",
    href: "/dashboard",
    icon: "pieChart",
    roles: ALL_ROLES,
    alwaysVisible: true,
  },
  {
    key: "school",
    title: "School",
    href: "/school",
    icon: "admin",
    roles: ["ADMIN", "DEVELOPER"],
    alwaysVisible: true,
    className: "-ms-[1.5px] h-4.5 w-4.5",
  },

  // Toggleable modules
  {
    key: "sales",
    title: "Sales",
    href: "/sales",
    icon: "sales",
    roles: ["ADMIN", "DEVELOPER"],
  },
  {
    key: "announcements",
    title: "Announcements",
    href: "/announcements",
    icon: "speaker",
    roles: ALL_ROLES,
    className: "h-4.5 w-4.5",
  },
  {
    key: "finance",
    title: "Finance",
    href: "/finance",
    icon: "creditCard",
    roles: ALL_ROLES,
  },
  {
    key: "grades",
    title: "Grades",
    href: "/grades",
    icon: "grades",
    roles: ["ADMIN", "STAFF", "TEACHER", "STUDENT", "GUARDIAN"],
    className: "-ms-[1px] h-4.5 w-4.5",
  },
  {
    key: "subjects",
    title: "Subjects",
    href: "/subjects",
    icon: "subject",
    roles: ["ADMIN", "STAFF", "TEACHER"],
    className: "",
  },
  {
    key: "parents",
    title: "Parents",
    href: "/parents",
    icon: "users",
    roles: ["ADMIN", "STAFF"],
  },
  {
    key: "admission",
    title: "Admission",
    href: "/admission",
    icon: "userPlus",
    roles: ["ADMIN", "STAFF"],
  },
  {
    key: "students",
    title: "Students",
    href: "/students",
    icon: "graduationCap",
    roles: ["ADMIN", "STAFF", "TEACHER"],
  },
  {
    key: "teachers",
    title: "Teachers",
    href: "/teachers",
    icon: "userCheck",
    roles: ["ADMIN", "STAFF"],
  },
  {
    key: "classrooms",
    title: "Classrooms",
    href: "/classrooms",
    icon: "box",
    roles: ["ADMIN", "STAFF", "TEACHER"],
  },
  {
    key: "exams",
    title: "Exams",
    href: "/exams",
    icon: "exam",
    roles: ["ADMIN", "STAFF", "TEACHER", "STUDENT", "GUARDIAN"],
    className: "-ms-[1px] h-4.5 w-4.5",
  },
  {
    key: "events",
    title: "Events",
    href: "/events",
    icon: "calendar",
    roles: ["ADMIN", "STAFF", "TEACHER"],
  },
  {
    key: "attendance",
    title: "Attendance",
    href: "/attendance",
    icon: "checkCircle",
    roles: ["ADMIN", "STAFF", "TEACHER", "STUDENT", "GUARDIAN"],
  },
  {
    key: "timetable",
    title: "Timetable",
    href: "/timetable",
    icon: "clock",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    key: "library",
    title: "Library",
    href: "/library",
    icon: "bookOpen",
    roles: ALL_ROLES,
  },
  {
    key: "transportation",
    title: "Transportation",
    href: "/transportation",
    icon: "bus",
    roles: ["ADMIN", "STAFF", "DEVELOPER"],
  },
  {
    key: "transportationFees",
    title: "Transport fees",
    href: "/transportation/fees",
    icon: "creditCard",
    roles: ["ACCOUNTANT", "DEVELOPER"],
  },
  {
    key: "myTransportation",
    title: "My transportation",
    href: "/transportation/me",
    icon: "bus",
    roles: ["STUDENT", "GUARDIAN"],
  },
  {
    key: "transportationTrips",
    title: "Trips",
    href: "/transportation/trips",
    icon: "bus",
    roles: ["TEACHER"],
  },
  {
    key: "stream",
    title: "Stream",
    href: "/stream",
    icon: "video",
    roles: ALL_ROLES,
  },
  {
    key: "liveClasses",
    title: "Live Classes",
    href: "/live-classes",
    icon: "monitorPlay",
    roles: ALL_ROLES,
  },
  // Messages and WhatsApp are intentionally omitted from the sidebar —
  // both channels are reachable from the top-header navigation. The routes
  // still exist; this only removes the redundant sidebar entries.

  // Core – always visible, not toggleable
  {
    key: "profile",
    title: "Profile",
    href: "/profile",
    icon: "user",
    roles: ALL_ROLES,
    alwaysVisible: true,
  },
  {
    key: "settings",
    title: "Settings",
    href: "/settings",
    icon: "cog",
    roles: ALL_ROLES,
    alwaysVisible: true,
  },

  // Showcase + Billing – developer only
  {
    key: "charts",
    title: "Charts",
    href: "/charts",
    icon: "barChart",
    roles: ["DEVELOPER"],
  },
  {
    key: "stats",
    title: "Stats",
    href: "/stats",
    icon: "trendingUp",
    roles: ["DEVELOPER"],
  },
  {
    key: "billing",
    title: "Billing",
    href: "/billing",
    icon: "receipt",
    roles: ["DEVELOPER"],
  },
]

/** Toggleable module items (excludes alwaysVisible core items) */
export const toggleableModules = platformNav.filter(
  (item) => !item.alwaysVisible
)
