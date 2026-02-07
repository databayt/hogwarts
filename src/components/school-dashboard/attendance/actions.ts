/**
 * Attendance Server Actions - Barrel Export
 *
 * This file re-exports all attendance actions from feature-specific modules.
 * Import from this file for backward compatibility, or import directly
 * from the specific module for better tree-shaking.
 *
 * Modules:
 * - core: Mark attendance, class selection, check-out, soft delete
 * - analytics: Stats, trends, patterns, calendar, risk assessment
 * - qr: QR code session management
 * - identifiers: Student identifier management (barcode, RFID, etc.)
 * - excuses: Excuse submission and review
 * - interventions: Chronic absenteeism intervention tracking
 * - periods: Period-by-period attendance tracking
 * - bulk: Bulk upload, reports, CSV export
 * - dashboard: Today's dashboard, early warning, follow-up
 */

// Core attendance operations
export {
  type ActionResponse,
  markAttendance,
  markSingleAttendance,
  getAttendanceList,
  getClassesForSelection,
  quickMarkAllPresent,
  checkOutStudent,
  bulkCheckOut,
  deleteAttendance,
  bulkDeleteAttendance,
  restoreAttendance,
} from "./actions/core"

// Analytics & statistics
export {
  getAttendanceStats,
  getAttendanceTrends,
  getMethodUsageStats,
  getDayWisePatterns,
  getCalendarData,
  getClassComparisonStats,
  getStudentsAtRisk,
  getRecentAttendance,
} from "./actions/analytics"

// QR code sessions
export {
  generateQRSession,
  processQRScan,
  getActiveQRSessions,
} from "./actions/qr"

// Student identifiers
export {
  addStudentIdentifier,
  getStudentIdentifiers,
  findStudentByIdentifier,
} from "./actions/identifiers"

// Excuse management
export {
  submitExcuse,
  reviewExcuse,
  getExcusesForStudent,
  getPendingExcuses,
  getExcuseById,
  getUnexcusedAbsences,
} from "./actions/excuses"

// Intervention tracking
export {
  type AttendanceRiskLevel,
  createIntervention,
  updateIntervention,
  escalateIntervention,
  getStudentInterventions,
  getActiveInterventions,
  getAllInterventions,
  getInterventionStats,
  getInterventionAssignees,
} from "./actions/interventions"

// Period-by-period tracking
export {
  getPeriodsForClass,
  getCurrentPeriod,
  markPeriodAttendance,
  getPeriodAttendanceAnalytics,
  getStudentDayAttendance,
} from "./actions/periods"

// Bulk operations & reports
export {
  bulkUploadAttendance,
  getAttendanceReport,
  getAttendanceReportCsv,
  getRecentBulkUploads,
} from "./actions/bulk"

// Dashboard & early warning
export {
  getStudentsByRiskLevel,
  getStudentEarlyWarningDetails,
  getTodaysDashboard,
  getTeacherClassesToday,
  getFollowUpStudents,
  getUnmarkedClasses,
  getParentAttendanceSummary,
} from "./actions/dashboard"

// Policy engine
export {
  evaluatePolicies,
  getPolicyTriggers,
  createPolicyExemption,
  dismissPolicyTrigger,
} from "./actions/policy"

// Master attendance (school gate entry/exit)
export {
  recordMasterAttendance,
  getMasterAttendanceForDay,
  getPrefillFromMaster,
} from "./actions/master"

// Compliance reports
export {
  getComplianceDashboard,
  getComplianceReport,
  getScheduledReports,
} from "./actions/compliance"
