type IconKey = keyof typeof import("./icons").Icons;

export type PlatformNavItem = {
  title: string;
  href: string;
  icon: IconKey;
  roles: Role[];
};

export type Role =
  | "DEVELOPER"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN"
  | "ACCOUNTANT"
  | "STAFF"
  | "USER";

const ALL_ROLES: Role[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
  "USER",
];

export const platformNav: PlatformNavItem[] = [
  // Developer (operator) – developer only
  { title: "Overview", href: "/operator/overview", icon: "box", roles: ["DEVELOPER"] },
  { title: "Kanban", href: "/operator/kanban", icon: "checkCircle", roles: ["DEVELOPER"] },
  { title: "Products", href: "/operator/product", icon: "file", roles: ["DEVELOPER"] },
  { title: "Domains", href: "/operator/domains", icon: "browser", roles: ["DEVELOPER"] },
  { title: "Billing", href: "/operator/billing", icon: "pieChart", roles: ["DEVELOPER"] },
  { title: "Observability", href: "/operator/observability", icon: "barChart", roles: ["DEVELOPER"] },
  { title: "Tenants", href: "/operator/tenants", icon: "envelope", roles: ["DEVELOPER"] },
  { title: "Dev Profile", href: "/operator/profile", icon: "cog", roles: ["DEVELOPER"] },

  // Admin dashboard – admin only
  { title: "Dashboard", href: "/dashboard", icon: "box", roles: ["ADMIN"] },
  { title: "Admin", href: "/dashboard/admin", icon: "file", roles: ["ADMIN"] },
  { title: "Dashboard Billing", href: "/dashboard/billing", icon: "pieChart", roles: ["ADMIN"] },
  { title: "Dashboard Charts", href: "/dashboard/charts", icon: "barChart", roles: ["ADMIN"] },
  { title: "Dashboard Settings", href: "/dashboard/settings", icon: "cog", roles: ["ADMIN"] },

  // School platform – recommended visibility
  { title: "Announcements", href: "/announcements", icon: "envelope", roles: ALL_ROLES },
  { title: "Students", href: "/students", icon: "file", roles: ["ADMIN", "STAFF", "TEACHER"] },
  { title: "Teachers", href: "/teachers", icon: "file", roles: ["ADMIN", "STAFF"] },
  { title: "Classes", href: "/classes", icon: "box", roles: ["ADMIN", "STAFF", "TEACHER"] },
  { title: "Attendance", href: "/attendance", icon: "checkCircle", roles: ["ADMIN", "STAFF", "TEACHER"] },
  { title: "Attendance Reports", href: "/attendance/reports", icon: "barChart", roles: ["ADMIN", "STAFF"] },
  { title: "Timetable", href: "/timetable", icon: "browser", roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { title: "Settings", href: "/settings", icon: "cog", roles: ["ADMIN"] },
  { title: "Profile", href: "/profile", icon: "cog", roles: ALL_ROLES },
];


