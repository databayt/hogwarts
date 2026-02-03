/**
 * Paper Generation Actions - Public API
 * Export all server actions
 */

// Types
export type {
  ActionResult,
  CreatePaperConfigInput,
  ExamPaperDataBundle,
  GenerateAnswerKeyInput,
  GenerateAnswerKeyOutput,
  GeneratePaperInput,
  GeneratePaperOutput,
  GenerateVersionsInput,
  GenerateVersionsOutput,
  PaperConfigWithRelations,
  UpdatePaperConfigInput,
} from "./types"

// Config actions
export {
  createPaperConfig,
  deletePaperConfig,
  getOrCreatePaperConfig,
  getPaperConfig,
  updatePaperConfig,
} from "./paper-config"

// Generation actions
export {
  generateAnswerKey,
  generateExamPaper,
  generateMultipleVersions,
  getPaperData,
} from "./paper-generation"
