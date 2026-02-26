// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Components
export { AnalyticsDashboard } from "./content"

// Server actions
export {
  analyzeQuestion,
  analyzeExamQuestions,
  getAnalyticsDashboard,
  getQuestionAnalytics,
} from "./actions"

// Psychometric functions
export {
  calcDifficultyIndex,
  calcDiscriminationIndex,
  calcPointBiserial,
  analyzeDistractors,
  assessItemQuality,
  getDifficultyLabel,
  getDiscriminationLabel,
  getQualityColor,
} from "./psychometrics"

// Types
export type {
  ResponseData,
  DistractorData,
  QualityAssessment,
} from "./psychometrics"
