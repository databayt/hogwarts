/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  "/",
  "/new-verification",
  "/school",
  "/client",
  "/server",
  "/setting",
  "/features",
  "/pricing",
  "/blog",
  "/debug",
  "/docs",
  "/stream",
  "/stream/courses",
];

/**
 * An array of routes that require authentication
 * Users must be logged in to access these routes
 * @type {string[]}
 */
export const protectedRoutes = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/settings",
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
 */
export const authRoutes = [
  "/login",
  "/join",
  "/error",
  "/reset",
  "/new-password",
  "/new-verification",
  "/reset"
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

// ============================================================================
// Role-Based Access Control (RBAC)
// ============================================================================

/**
 * User roles - must match Prisma UserRole enum
 * Inlined here to keep proxy.ts lightweight (Edge Function <1MB limit)
 */
export type Role =
  | "DEVELOPER"  // Platform admin (across all schools)
  | "ADMIN"      // School admin
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN"
  | "ACCOUNTANT" // School accountant/finance
  | "STAFF"      // General school staff
  | "USER";      // General user

/**
 * Role-based route access matrix
 * Maps route patterns to allowed roles
 * Use "/*" suffix for wildcard matching (e.g., "/admin/*" matches "/admin/users")
 * Routes not in this map default to allowing all authenticated users
 */
export const roleRoutes: Record<string, Role[]> = {
  // ============================================================================
  // Admin-only routes (school configuration)
  // ============================================================================
  "/admin": ["ADMIN", "DEVELOPER"],
  "/admin/*": ["ADMIN", "DEVELOPER"],
  "/settings/school": ["ADMIN", "DEVELOPER"],
  "/settings/branding": ["ADMIN", "DEVELOPER"],
  "/settings/academic": ["ADMIN", "DEVELOPER"],
  "/settings/terms": ["ADMIN", "DEVELOPER"],
  "/settings/periods": ["ADMIN", "DEVELOPER"],
  "/settings/grade-levels": ["ADMIN", "DEVELOPER"],
  "/settings/departments": ["ADMIN", "DEVELOPER"],
  "/settings/*": ["ADMIN", "DEVELOPER"],

  // ============================================================================
  // Finance routes (all authenticated users - role-specific views handled in UI)
  // ============================================================================
  "/finance": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/finance/*": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/fees": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/fees/*": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/invoice": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/invoice/*": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/receipt": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/receipt/*": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/banking": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/banking/*": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/salary": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/salary/*": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/payroll": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/payroll/*": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/budget": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/budget/*": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/expenses": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],
  "/expenses/*": ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "DEVELOPER"],

  // ============================================================================
  // Academic management (admin & teachers)
  // ============================================================================
  "/teachers": ["ADMIN", "DEVELOPER"],
  "/teachers/*": ["ADMIN", "DEVELOPER"],
  "/subjects": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/subjects/*": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/classes": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/classes/*": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/timetable": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/timetable/*": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/lessons": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/lessons/*": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/exams": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/exams/*": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/grades": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/grades/*": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/assignments": ["ADMIN", "TEACHER", "DEVELOPER"],
  "/assignments/*": ["ADMIN", "TEACHER", "DEVELOPER"],

  // ============================================================================
  // Student management (admin, teachers, staff)
  // ============================================================================
  "/students": ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"],
  "/students/*": ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"],
  "/parents": ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"],
  "/parents/*": ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"],

  // ============================================================================
  // Attendance (admin, teachers, staff)
  // ============================================================================
  "/attendance": ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"],
  "/attendance/*": ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"],

  // ============================================================================
  // Communication (all staff roles)
  // ============================================================================
  "/announcements": ["ADMIN", "TEACHER", "STAFF", "ACCOUNTANT", "DEVELOPER"],
  "/announcements/*": ["ADMIN", "TEACHER", "STAFF", "ACCOUNTANT", "DEVELOPER"],
  "/messaging": ["ADMIN", "TEACHER", "STAFF", "ACCOUNTANT", "DEVELOPER"],
  "/messaging/*": ["ADMIN", "TEACHER", "STAFF", "ACCOUNTANT", "DEVELOPER"],

  // ============================================================================
  // Student/Guardian self-service routes
  // ============================================================================
  "/my-grades": ["STUDENT", "GUARDIAN", "DEVELOPER"],
  "/my-attendance": ["STUDENT", "GUARDIAN", "DEVELOPER"],
  "/my-fees": ["STUDENT", "GUARDIAN", "DEVELOPER"],
  "/my-assignments": ["STUDENT", "GUARDIAN", "DEVELOPER"],
  "/my-timetable": ["STUDENT", "GUARDIAN", "DEVELOPER"],

  // ============================================================================
  // Library (all authenticated users)
  // ============================================================================
  "/library": ["ADMIN", "TEACHER", "STAFF", "STUDENT", "GUARDIAN", "DEVELOPER"],
  "/library/*": ["ADMIN", "TEACHER", "STAFF", "STUDENT", "GUARDIAN", "DEVELOPER"],

  // ============================================================================
  // Events (all authenticated users)
  // ============================================================================
  "/events": ["ADMIN", "TEACHER", "STAFF", "STUDENT", "GUARDIAN", "DEVELOPER"],
  "/events/*": ["ADMIN", "TEACHER", "STAFF", "STUDENT", "GUARDIAN", "DEVELOPER"],
};

/**
 * Check if a route is allowed for a given role
 * @param pathname - The route pathname (without locale prefix)
 * @param role - The user's role
 * @returns true if the route is allowed, false otherwise
 */
export function isRouteAllowedForRole(pathname: string, role: Role): boolean {
  // DEVELOPER has access to everything (platform admin)
  if (role === "DEVELOPER") {
    return true;
  }

  // Check exact match first
  if (roleRoutes[pathname]) {
    return roleRoutes[pathname].includes(role);
  }

  // Check wildcard patterns (e.g., "/admin/*" matches "/admin/users")
  for (const [pattern, allowedRoles] of Object.entries(roleRoutes)) {
    if (pattern.endsWith("/*")) {
      const basePattern = pattern.slice(0, -2); // Remove "/*"
      if (pathname.startsWith(basePattern + "/") || pathname === basePattern) {
        return allowedRoles.includes(role);
      }
    }
  }

  // Default: allow all authenticated users for routes not in the matrix
  // This includes /dashboard, /profile, common platform features
  return true;
}