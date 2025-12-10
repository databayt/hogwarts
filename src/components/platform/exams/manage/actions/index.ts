/**
 * Central export file for all exam management actions
 * Split from original 506-line actions.ts into focused modules
 */

// CRUD Operations
export { createExam, updateExam, deleteExam } from "./crud";

// Read Operations
export { getExam, getExams, getUpcomingExams } from "./read";

// Marks Entry Operations
export {
  getExamWithStudents,
  enterMarks,
  bulkImportMarks,
} from "./marks-entry";

// Analytics Operations
export {
  getExamAnalytics,
  getClassPerformance,
  getSubjectAnalytics,
} from "./analytics";

// Results Operations
export {
  getExamResults,
  getStudentResults,
  getTopPerformers,
  publishResults,
} from "./results";

// Export Operations
export { getExamsCSV, getExamResultsCSV, getAnalyticsCSV, getExamsExportData } from "./export";

// Conflict Detection Operations
export {
  checkExamConflicts,
  findAvailableExamSlots,
  type ConflictDetail,
  type TimeSlot,
  type AvailableSlot,
} from "./conflict-detection";

// Type Exports
export type {
  ActionResponse,
  ExamStudent,
  ExamWithClass,
  ExamAnalytics,
  ExamResultRow,
  ExamListRow,
  MarksEntry,
  ExamExportData,
} from "./types";