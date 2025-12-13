/**
 * Unified File Block - Generate Hook
 * Client-side hook for document generation
 */

"use client";

import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import type {
  GenerateDocumentType,
  TemplateStyle,
  GenerateConfig,
  GenerateProgress,
  GenerateResult,
  UseGenerateReturn,
  InvoiceData,
  ReceiptData,
  CertificateData,
  ReportCardData,
  IdCardData,
  TranscriptData,
} from "./types";
import { InvoiceTemplate } from "./invoice";
import { CertificateTemplate } from "./certificate";
import { ReportCardTemplate } from "./report-card";
import { IdCardTemplate } from "./id-card";
import { ReceiptTemplate } from "./receipt";
import { TranscriptTemplate } from "./transcript";
import { downloadBlob } from "../export/csv-generator";

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGenerate(): UseGenerateReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerateProgress>({
    status: "idle",
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Generic Generate Function
  // ============================================================================

  const generate = useCallback(
    async <T>(config: GenerateConfig<T>): Promise<GenerateResult> => {
      setIsGenerating(true);
      setError(null);
      setProgress({ status: "generating", progress: 30, message: "Generating document..." });

      try {
        const { type, style = "modern", data, output = "pdf", filename } = config;

        let component: React.ReactElement | null = null;

        // Select template based on type
        switch (type) {
          case "invoice":
            component = InvoiceTemplate({ data: data as InvoiceData, style });
            break;
          case "receipt":
            component = ReceiptTemplate({ data: data as ReceiptData, style });
            break;
          case "certificate":
            component = CertificateTemplate({ data: data as CertificateData, style });
            break;
          case "report_card":
            component = ReportCardTemplate({ data: data as ReportCardData, style });
            break;
          case "id_card":
            component = IdCardTemplate({ data: data as IdCardData, style });
            break;
          case "transcript":
            component = TranscriptTemplate({ data: data as TranscriptData, style });
            break;
          default:
            throw new Error(`Unknown document type: ${type}`);
        }

        if (!component) {
          throw new Error("Failed to create document template");
        }

        setProgress({ status: "generating", progress: 60, message: "Rendering PDF..." });

        // Generate PDF blob - cast to any to satisfy @react-pdf/renderer types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blob = await pdf(component as any).toBlob();

        setProgress({ status: "generating", progress: 90, message: "Preparing download..." });

        // Generate filename
        const documentFilename = filename || `${type}_${Date.now()}`;
        const fullFilename = `${documentFilename}.pdf`;

        if (output === "pdf") {
          // Trigger download
          downloadBlob(blob, fullFilename);
        }

        setProgress({ status: "completed", progress: 100, message: "Document generated" });

        return {
          success: true,
          filename: fullFilename,
          blob,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Generation failed";
        setError(errorMessage);
        setProgress({ status: "error", progress: 0, error: errorMessage });
        return { success: false, error: errorMessage };
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  // ============================================================================
  // Specific Document Generators
  // ============================================================================

  const generateInvoice = useCallback(
    async (data: InvoiceData, style?: TemplateStyle): Promise<GenerateResult> => {
      return generate({
        type: "invoice",
        style,
        data,
        filename: `invoice_${data.invoiceNumber}`,
      });
    },
    [generate]
  );

  const generateReceipt = useCallback(
    async (data: ReceiptData, style?: TemplateStyle): Promise<GenerateResult> => {
      return generate({
        type: "receipt",
        style,
        data,
        filename: `receipt_${data.receiptNumber}`,
      });
    },
    [generate]
  );

  const generateCertificate = useCallback(
    async (data: CertificateData, style?: TemplateStyle): Promise<GenerateResult> => {
      return generate({
        type: "certificate",
        style,
        data,
        filename: `certificate_${data.certificateNumber}`,
      });
    },
    [generate]
  );

  const generateReportCard = useCallback(
    async (data: ReportCardData, style?: TemplateStyle): Promise<GenerateResult> => {
      return generate({
        type: "report_card",
        style,
        data,
        filename: `report_card_${data.studentId}_${data.termName}`,
      });
    },
    [generate]
  );

  const generateIdCard = useCallback(
    async (data: IdCardData, style?: TemplateStyle): Promise<GenerateResult> => {
      return generate({
        type: "id_card",
        style,
        data,
        filename: `id_card_${data.idNumber}`,
      });
    },
    [generate]
  );

  const generateTranscript = useCallback(
    async (data: TranscriptData, style?: TemplateStyle): Promise<GenerateResult> => {
      return generate({
        type: "transcript",
        style,
        data,
        filename: `transcript_${data.studentId}`,
      });
    },
    [generate]
  );

  // ============================================================================
  // Reset
  // ============================================================================

  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress({ status: "idle", progress: 0 });
    setError(null);
  }, []);

  return {
    isGenerating,
    progress,
    error,
    generateInvoice,
    generateReceipt,
    generateCertificate,
    generateReportCard,
    generateIdCard,
    generateTranscript,
    generate,
    reset,
  };
}
