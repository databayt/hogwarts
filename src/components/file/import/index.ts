/**
 * Unified File Block - Import Module Exports
 */

// Types
export type {
  ImportFormat,
  ImportColumn,
  ImportConfig,
  ImportRowError,
  ImportResult,
  ImportPreview,
  ImportProgress,
  ImportOptions,
  UseImportReturn,
} from "./types"

// Parsers
export {
  detectFormat,
  parseCsvFile,
  parseExcelFile,
  parseJsonFile,
  parseFile,
  autoMatchColumns,
  generatePreview,
} from "./parsers"

// Validators
export {
  parseValue,
  validateValue,
  processRow,
  validateRows,
  commonValidators,
  commonSchemas,
} from "./validators"

// Hook
export { useImport } from "./use-import"

// Components
export { Importer, type ImporterProps } from "./importer"

// Domain-specific CSV Import
export {
  importStudents,
  importTeachers,
  generateStudentTemplate,
  generateTeacherTemplate,
} from "./csv-import"

// CSV Validation Helpers
export {
  formatZodError,
  validateDateFormat,
  validatePhoneFormat,
  validateGuardianInfo,
  formatDuplicateError,
  formatRequiredFieldError,
  createRowErrorMessage,
  validateCSVHeaders,
  suggestCorrection,
} from "./csv-validation"
