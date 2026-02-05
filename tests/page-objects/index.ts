/**
 * Page Objects Index
 *
 * Re-exports all page objects for convenient imports.
 */

// Base page classes
export { BasePage, SchoolBasePage } from "./base.page"

// Auth page objects
export { LoginPage, SchoolLoginPage } from "./auth"

// Marketing page objects
export {
  OnboardingPage,
  SaasBlogPage,
  SaasDocsPage,
  SaasFeaturesPage,
  SaasHomePage,
  SaasPricingPage,
  SchoolAboutPage,
  SchoolAcademicPage,
  SchoolAdmissionsPage,
  SchoolApplyPage,
  SchoolHomePage,
  SchoolTourPage,
} from "./marketing.page"

// Dashboard page objects
export {
  SaasAnalyticsPage,
  SaasBillingPage,
  SaasDashboardPage,
  SaasTenantsPage,
  SchoolAttendancePage,
  SchoolClassesPage,
  SchoolDashboardPage,
  SchoolExamsPage,
  SchoolFinancePage,
  SchoolSettingsPage,
  SchoolStudentsPage,
  SchoolTeachersPage,
} from "./dashboard.page"
