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

// Onboarding flow page object
export {
  OnboardingFlowPage,
  ONBOARDING_STEPS,
  type OnboardingStepName,
} from "./onboarding.page"

// Admission page objects
export {
  AdmissionDashboardPage,
  AdmissionPortalPage,
  APPLICATION_STEPS,
  ApplicationFormPage,
  ApplyDashboardPage,
  CampaignSelectorPage,
  InquiryPage,
  StatusTrackerPage,
  TourBookingPage,
  type ApplicationStepName,
} from "./admission.page"
