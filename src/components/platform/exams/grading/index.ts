/**
 * Grading Module
 *
 * Exports all grading-related functionality:
 * - Grade conversion utilities
 * - CGPA calculation
 * - Configuration UI
 * - Retake management
 */

// Components
export { GradingConfigForm } from "./grading-config-form"
export { RetakeManager, calculateAttempts } from "./retake-manager"

// Server actions
export {
  getGradingConfig,
  saveGradingConfig,
  convertGradeAction,
  getAllFormatsAction,
  checkPassingAction,
  calculateCGPAAction,
  calculateSemesterGPAAction,
  calculateRequiredGPAAction,
  getStudentCGPAHistory,
  updateGradeBoundaries,
} from "./actions"

// Utilities
export {
  percentageToLetter,
  percentageToGPA4,
  percentageToGPA5,
  gpaToLetter,
  gpa4ToGpa5,
  gpa5ToGpa4,
  letterToPercentage,
  convertGrade,
  getAllGradeFormats,
  isPassing,
  formatGrade,
  DEFAULT_GRADE_BOUNDARIES,
} from "./grade-converter"

export {
  calculateSemesterGPA,
  calculateCumulativeGPA,
  calculateWeightedScore,
  applyRetakePenalty,
  getGPAClassification,
  requiredGPAForTarget,
} from "./cgpa-calculator"

// Validation schemas
export {
  gradeBoundarySchema,
  gradingConfigSchema,
  gradeConversionSchema,
  cgpaCalculationSchema,
  targetGPASchema,
} from "./validation"

// Types
export type { GradeBoundary, ConversionOptions } from "./grade-converter"

export type {
  CourseGrade,
  ExamTypeWeights,
  CGPAOptions,
  CGPAResult,
  SemesterData,
} from "./cgpa-calculator"

export type {
  GradeBoundaryInput,
  GradingConfigInput,
  GradeConversionInput,
  CGPACalculationInput,
  TargetGPAInput,
} from "./validation"
