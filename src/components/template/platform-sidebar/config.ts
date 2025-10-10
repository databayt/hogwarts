type IconKey = keyof typeof import("./icons").Icons;

export type PlatformNavItem = {
  title: string;
  href: string;
  icon: IconKey;
  roles: Role[];
  className?: string;
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
  { title: "Overview", href: "/dashboard", icon: "pieChart", roles: ["ADMIN"] },
  { title: "Admin", href: "/dashboard/admin", icon: "admin", roles: ["ADMIN"], className: "-ml-[1.5px] h-4.5 w-4.5" },
  { title: "Billing", href: "/dashboard/billing", icon: "browser", roles: ["ADMIN"] },
  { title: "Charts", href: "/dashboard/charts", icon: "barChart", roles: ["ADMIN"] },
  { title: "Settings", href: "/dashboard/settings", icon: "cog", roles: ["ADMIN", "STAFF", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "DEVELOPER"] },

  // School platform – recommended visibility
  { title: "Announcements", href: "/announcements", icon: "speaker", roles: ALL_ROLES, className: "h-4.5 w-4.5" },
  // { title: "Messages", href: "/messages", icon: "envelope", roles: ALL_ROLES },
  // { title: "Notifications", href: "/notifications", icon: "bell", roles: ALL_ROLES, className: "h-4.5 w-4.5" },
  { title: "Invoices", href: "/invoice", icon: "invoice", roles: ["ADMIN", "ACCOUNTANT"], className: "-ml-[1px] h-4.5 w-4.5" },
  { title: "Grades", href: "/grades", icon: "grades", roles: ["ADMIN", "STAFF", "TEACHER", "STUDENT", "GUARDIAN"], className: "-ml-[1px] h-4.5 w-4.5" },
  { title: "Subjects", href: "/subjects", icon: "subject", roles: ["ADMIN", "STAFF", "TEACHER"], className: "" },
  { title: "Parents", href: "/parents", icon: "users", roles: ["ADMIN", "STAFF"] },
  { title: "Students", href: "/students", icon: "graduationCap", roles: ["ADMIN", "STAFF", "TEACHER"] },
  { title: "Teachers", href: "/teachers", icon: "userCheck", roles: ["ADMIN", "STAFF"] },
  { title: "Classes", href: "/classes", icon: "box", roles: ["ADMIN", "STAFF", "TEACHER"] },
  { title: "Lessons", href: "/lessons", icon: "bookOpen", roles: ["ADMIN", "STAFF", "TEACHER"] },
  { title: "Exams", href: "/exams", icon: "exam", roles: ["ADMIN", "STAFF", "TEACHER"], className: "-ml-[1px] h-4.5 w-4.5" },
  { title: "Events", href: "/events", icon: "calendar", roles: ["ADMIN", "STAFF", "TEACHER"] },
  { title: "Attendance", href: "/attendance", icon: "checkCircle", roles: ["ADMIN", "STAFF", "TEACHER"] },
  { title: "Reports", href: "/attendance/reports", icon: "barChart", roles: ["ADMIN", "STAFF"] },
  { title: "Timetable", href: "/timetable", icon: "clock", roles: ["ADMIN", "TEACHER", "STUDENT"]},
  { title: "Settings", href: "/settings", icon: "cog", roles: ["ADMIN"] },
  { title: "Profile", href: "/profile", icon: "cog", roles: ALL_ROLES },
];


