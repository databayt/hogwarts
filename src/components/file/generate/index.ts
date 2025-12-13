/**
 * Unified File Block - Generate Module Exports
 * Flat structure - all files at module root level
 */

// Types
export type {
  GenerateDocumentType,
  TemplateStyle,
  DocumentMetadata,
  InvoiceItem,
  InvoiceData,
  ReceiptData,
  CertificateData,
  ReportCardSubject,
  ReportCardData,
  IdCardData,
  TranscriptCourse,
  TranscriptData,
  GenerateConfig,
  GenerateResult,
  GenerateProgress,
  UseGenerateReturn,
} from "./types";

// Templates
export { InvoiceTemplate, createStyles as createInvoiceStyles } from "./invoice";
export { CertificateTemplate, createCertificateStyles } from "./certificate";
export { ReportCardTemplate, createReportCardStyles } from "./report-card";

// Hook
export { useGenerate } from "./use-generate";
