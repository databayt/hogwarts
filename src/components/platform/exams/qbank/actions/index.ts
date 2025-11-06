/**
 * Central export file for all qbank actions
 * Refactored from original 569-line actions.ts into focused modules
 */

// Question CRUD Operations
export {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestions,
  getQuestionById,
  duplicateQuestion,
} from "./question-crud";

// Template Management
export {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplates,
  getTemplateById,
  toggleTemplateStatus,
  duplicateTemplate,
} from "./templates";

// Exam Generation
export {
  generateExam,
  previewExamGeneration,
  regenerateExam,
  deleteGeneratedExam,
} from "./generation";

// Analytics Operations
export {
  updateQuestionAnalytics,
  batchUpdateAnalytics,
  getAnalyticsDashboard,
  getQuestionPerformance,
  resetQuestionAnalytics,
} from "./analytics";

// Import/Export Operations
export {
  exportQuestionsToCSV,
  importQuestionsFromCSV,
  downloadQuestionTemplate,
  exportQuestionsWithMetadata,
} from "./import-export";

// CSV Utilities
export {
  generateQuestionsCSV,
  parseQuestionsCSV,
  generateQuestionCSVTemplate,
  QUESTION_CSV_HEADERS,
} from "./csv-utils";

// Type Exports
export type {
  ActionResponse,
  QuestionWithAnalytics,
  CreateQuestionData,
  TemplateWithStats,
  CreateTemplateData,
  GenerateExamData,
  GenerationResult,
  AnalyticsUpdate,
  DashboardAnalytics,
  QuestionFilters,
  TemplateFilters,
  ImportResult,
  ExportOptions,
} from "./types";