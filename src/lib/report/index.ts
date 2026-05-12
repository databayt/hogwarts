/**
 * Public surface of the report pipeline. Repo-specific adapters import from
 * here; everything else is internal.
 */

export { runReportPipeline } from "./pipeline";
export { reportSchema, REPORT_CATEGORIES } from "./schema";
export { computeScore, THRESHOLDS, bucketFor } from "./score";
export { RateLimitError } from "./adapters/adapter";
export type { ReportAdapter } from "./adapters/adapter";
export {
  REPORT_LABELS,
  ALL_REPORT_LABELS,
  severityLabel,
  languageLabel,
} from "./labels";
export { ensureLabels } from "./github";
export type {
  Bucket,
  Classification,
  Language,
  PipelineResult,
  PipelineEvent,
  ReportCategory,
  ReportInput,
  ReporterContext,
  ScoringResult,
  Severity,
} from "./types";
