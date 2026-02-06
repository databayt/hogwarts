/**
 * Centralized Test Data
 *
 * Single source of truth for all test credentials, URLs, and constants.
 * Aligned with seed data from prisma/seeds/
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type TestEnv = "local" | "production"
export type Locale = "en" | "ar"

export type UserRole =
  | "DEVELOPER"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN"
  | "ACCOUNTANT"
  | "STAFF"
  | "USER"

export interface TestUser {
  email: string
  password: string
  role: UserRole
  schoolId: string | null
  name: string
}

export type TestUserKey =
  | "developer"
  | "user"
  | "admin"
  | "teacher"
  | "student"
  | "guardian"
  | "accountant"
  | "staff"

// =============================================================================
// TEST CREDENTIALS
// =============================================================================

/**
 * Test credentials from seed data.
 * All accounts use password: 1234
 */
export const TEST_USERS: Record<TestUserKey, TestUser> = {
  // Platform accounts (no schoolId)
  developer: {
    email: "dev@databayt.org",
    password: "1234",
    role: "DEVELOPER",
    schoolId: null,
    name: "Developer",
  },
  user: {
    email: "user@databayt.org",
    password: "1234",
    role: "USER",
    schoolId: null,
    name: "Fresh User",
  },

  // Demo school accounts (tied to demo school only)
  admin: {
    email: "admin@databayt.org",
    password: "1234",
    role: "ADMIN",
    schoolId: "demo",
    name: "School Admin",
  },
  teacher: {
    email: "teacher@databayt.org",
    password: "1234",
    role: "TEACHER",
    schoolId: "demo",
    name: "Teacher",
  },
  student: {
    email: "student@databayt.org",
    password: "1234",
    role: "STUDENT",
    schoolId: "demo",
    name: "Student",
  },
  guardian: {
    email: "parent@databayt.org",
    password: "1234",
    role: "GUARDIAN",
    schoolId: "demo",
    name: "Parent",
  },
  accountant: {
    email: "accountant@databayt.org",
    password: "1234",
    role: "ACCOUNTANT",
    schoolId: "demo",
    name: "Accountant",
  },
  staff: {
    email: "staff@databayt.org",
    password: "1234",
    role: "STAFF",
    schoolId: "demo",
    name: "Staff Member",
  },
} as const

// =============================================================================
// URL CONFIGURATION
// =============================================================================

export const URLS = {
  local: {
    base: "http://localhost:3000",
    schoolPattern: (subdomain: string) => `http://${subdomain}.localhost:3000`,
  },
  production: {
    base: "https://ed.databayt.org",
    schoolPattern: (subdomain: string) => `https://${subdomain}.databayt.org`,
  },
} as const

// =============================================================================
// ROUTES
// =============================================================================

/**
 * SaaS Marketing Routes (main domain, public)
 */
export const SAAS_MARKETING_ROUTES = {
  home: "",
  features: "/features",
  pricing: "/pricing",
  docs: "/docs",
  blog: "/blog",
  login: "/login",
  join: "/join",
  onboarding: "/onboarding",
} as const

/**
 * SaaS Dashboard Routes (main domain, DEVELOPER only)
 */
export const SAAS_DASHBOARD_ROUTES = {
  dashboard: "/dashboard",
  analytics: "/analytics",
  tenants: "/tenants",
  billing: "/billing",
  domains: "/domains",
  kanban: "/kanban",
  sales: "/sales",
  observability: "/observability",
  profile: "/profile",
} as const

/**
 * School Marketing Routes (subdomain, public)
 */
export const SCHOOL_MARKETING_ROUTES = {
  home: "",
  about: "/about",
  academic: "/academic",
  admissions: "/admissions",
  apply: "/apply",
  tour: "/tour",
  login: "/login",
} as const

/**
 * School Dashboard Routes (subdomain, authenticated)
 */
export const SCHOOL_DASHBOARD_ROUTES = {
  dashboard: "/dashboard",
  students: "/students",
  teachers: "/teachers",
  classes: "/classes",
  finance: "/finance",
  attendance: "/attendance",
  exams: "/exams",
  settings: "/dashboard/settings",
  admission: "/admission",
  stream: "/stream",
  timetable: "/timetable",
  grades: "/grades",
  messages: "/messages",
} as const

// =============================================================================
// TEST TAGS
// =============================================================================

export const TEST_TAGS = {
  smoke: "@smoke",
  rbac: "@rbac",
  multiTenant: "@multi-tenant",
  auth: "@auth",
  sso: "@sso",
  i18n: "@i18n",
  critical: "@critical",
  slow: "@slow",
} as const

// =============================================================================
// TIMEOUTS
// =============================================================================

export const TIMEOUTS = {
  short: 5_000,
  medium: 10_000,
  long: 30_000,
  navigation: 15_000,
  networkIdle: 20_000,
} as const

// =============================================================================
// SELECTORS
// =============================================================================

export const SELECTORS = {
  // Login form
  emailInput: 'input[name="email"]',
  passwordInput: 'input[name="password"]',
  submitButton: 'button[type="submit"]',
  googleOAuth: 'button:has-text("Google")',
  facebookOAuth: 'button:has-text("Facebook")',

  // Auth state indicators
  userMenu: '[data-testid="user-menu"]',
  logoutButton: '[data-testid="logout-button"]',
  dashboardLink: 'a[href*="/dashboard"]',

  // Layout elements
  sidebar: '[data-testid="sidebar"], aside',
  mainContent: 'main, [role="main"]',
  header: 'header, [role="banner"]',

  // Tables
  tableBody: "table tbody",
  tableRow: "table tbody tr",
  searchInput: 'input[placeholder*="Search"], input[placeholder*="بحث"]',

  // Forms
  formError: '[data-testid="form-error"], .form-error, [role="alert"]',
  toast: "[data-sonner-toast], .toast",
  toastSuccess: '[data-sonner-toast][data-type="success"]',
  toastError: '[data-sonner-toast][data-type="error"]',

  // Error states
  sseError: "text=/server-side exception|application error/i",
  notFound: "text=/not found|404/i",
  unauthorized: "text=/unauthorized|403|access denied/i",
} as const

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get current test environment from env variable
 */
export function getTestEnv(): TestEnv {
  return (process.env.TEST_ENV as TestEnv) || "local"
}

/**
 * Get base URL for the current environment
 */
export function getBaseUrl(env: TestEnv = getTestEnv()): string {
  return URLS[env].base
}

/**
 * Get school subdomain URL
 */
export function getSchoolUrl(
  subdomain: string,
  env: TestEnv = getTestEnv()
): string {
  return URLS[env].schoolPattern(subdomain)
}

/**
 * Build full URL with locale
 */
export function buildUrl(
  path: string,
  locale: Locale = "en",
  env: TestEnv = getTestEnv()
): string {
  const base = getBaseUrl(env)
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}/${locale}${normalizedPath}`
}

/**
 * Build school URL with locale
 */
export function buildSchoolUrl(
  subdomain: string,
  path: string,
  locale: Locale = "en",
  env: TestEnv = getTestEnv()
): string {
  const base = getSchoolUrl(subdomain, env)
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}/${locale}${normalizedPath}`
}

/**
 * Get expected redirect URL after login
 */
export function getExpectedRedirect(
  userKey: TestUserKey,
  locale: Locale = "en",
  env: TestEnv = getTestEnv()
): string {
  const user = TEST_USERS[userKey]

  if (userKey === "developer") {
    return buildUrl("/dashboard", locale, env)
  }

  if (user.schoolId) {
    return buildSchoolUrl(user.schoolId, "/dashboard", locale, env)
  }

  // Users without school stay on SaaS marketing (no callbackUrl)
  return buildUrl("", locale, env)
}
