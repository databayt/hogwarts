/**
 * Unified File Block - Generate Module Exports
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
export {
  InvoiceTemplate,
  createInvoiceStyles,
  CertificateTemplate,
  createCertificateStyles,
  ReportCardTemplate,
  createReportCardStyles,
} from "./templates";

// Hook
export { useGenerate } from "./use-generate";
