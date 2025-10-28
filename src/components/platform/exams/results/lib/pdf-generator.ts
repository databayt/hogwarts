// PDF Generator Core

import { renderToStream } from "@react-pdf/renderer";
import type { PDFResultData, PDFGenerationOptions, PDFGenerationResult } from "../types";

/**
 * Generate PDF from React component
 * This is a server-side function that uses @react-pdf/renderer
 */
export async function generatePDF(
  component: React.ReactElement,
  fileName: string
): Promise<PDFGenerationResult> {
  try {
    // Render React component to PDF stream
    const stream = await renderToStream(component as React.ReactElement<any>);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk as Uint8Array);
    }

    const buffer = Buffer.concat(chunks);

    // In production, you would upload to storage (Vercel Blob, S3, etc.)
    // For now, we'll return base64 data URL
    const base64 = buffer.toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64}`;

    return {
      success: true,
      pdfUrl: dataUrl,
      fileName: fileName,
      fileSize: buffer.length,
    };
  } catch (error) {
    console.error("PDF generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate file name for PDF
 */
export function generatePDFFileName(
  studentName: string,
  examTitle: string,
  template: string
): string {
  const sanitizedName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
  const sanitizedExam = examTitle.replace(/[^a-zA-Z0-9]/g, "_");
  const timestamp = new Date().toISOString().split("T")[0];

  return `${sanitizedName}_${sanitizedExam}_${template}_${timestamp}.pdf`;
}

/**
 * Generate batch PDF file name
 */
export function generateBatchPDFFileName(
  examTitle: string,
  studentCount: number
): string {
  const sanitizedExam = examTitle.replace(/[^a-zA-Z0-9]/g, "_");
  const timestamp = new Date().toISOString().split("T")[0];

  return `${sanitizedExam}_${studentCount}_students_${timestamp}.zip`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Validate PDF data before generation
 */
export function validatePDFData(data: PDFResultData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.student) {
    errors.push("Student data is missing");
  }

  if (!data.exam) {
    errors.push("Exam data is missing");
  }

  if (!data.school) {
    errors.push("School data is missing");
  }

  if (data.student && data.student.totalMarks <= 0) {
    errors.push("Invalid total marks");
  }

  if (data.student && data.student.marksObtained < 0) {
    errors.push("Invalid marks obtained");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Apply PDF options and defaults
 */
export function applyPDFDefaults(
  options?: Partial<PDFGenerationOptions>
): PDFGenerationOptions {
  return {
    template: options?.template || "classic",
    includeQuestionBreakdown: options?.includeQuestionBreakdown ?? true,
    includeGradeDistribution: options?.includeGradeDistribution ?? true,
    includeClassAnalytics: options?.includeClassAnalytics ?? true,
    includeSchoolBranding: options?.includeSchoolBranding ?? true,
    orientation: options?.orientation || "portrait",
    pageSize: options?.pageSize || "A4",
    language: options?.language || "en",
  };
}

/**
 * Get PDF dimensions based on page size
 */
export function getPDFDimensions(pageSize: "A4" | "Letter"): {
  width: number;
  height: number;
} {
  const dimensions = {
    A4: {
      width: 595.28, // 210mm in points
      height: 841.89, // 297mm in points
    },
    Letter: {
      width: 612, // 8.5 inches in points
      height: 792, // 11 inches in points
    },
  };

  return dimensions[pageSize];
}

/**
 * Calculate margins for PDF
 */
export function getPDFMargins(hasHeader: boolean = true, hasFooter: boolean = true) {
  return {
    top: hasHeader ? 60 : 40,
    right: 40,
    bottom: hasFooter ? 40 : 40,
    left: 40,
  };
}

/**
 * Get font family based on language
 */
export function getFontFamily(language: "en" | "ar"): string {
  return language === "ar" ? "Tajawal" : "Inter";
}

/**
 * Get text direction based on language
 */
export function getTextDirection(language: "en" | "ar"): "ltr" | "rtl" {
  return language === "ar" ? "rtl" : "ltr";
}

/**
 * Format date for PDF
 */
export function formatPDFDate(date: Date, language: "en" | "ar"): string {
  const locale = language === "ar" ? "ar-SA" : "en-US";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Format number for PDF (respects locale)
 */
export function formatPDFNumber(num: number, language: "en" | "ar"): string {
  const locale = language === "ar" ? "ar-SA" : "en-US";
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Create watermark text
 */
export function createWatermark(text: string, opacity: number = 0.1): {
  text: string;
  opacity: number;
  rotation: number;
} {
  return {
    text: text.toUpperCase(),
    opacity,
    rotation: -45,
  };
}

/**
 * Calculate optimal font size based on text length
 */
export function calculateOptimalFontSize(
  text: string,
  maxWidth: number,
  baseFontSize: number = 10,
  minFontSize: number = 8
): number {
  // Simple heuristic: reduce font size if text is too long
  const charCount = text.length;
  const maxChars = maxWidth / (baseFontSize * 0.5); // Rough estimate

  if (charCount <= maxChars) {
    return baseFontSize;
  }

  const ratio = maxChars / charCount;
  const calculatedSize = baseFontSize * ratio;

  return Math.max(calculatedSize, minFontSize);
}

/**
 * Split long text into lines for PDF
 */
export function splitTextIntoLines(
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  // Approximate character width
  const charWidth = fontSize * 0.5;
  const maxCharsPerLine = Math.floor(maxWidth / charWidth);

  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;

    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Generate PDF metadata
 */
export function generatePDFMetadata(data: PDFResultData) {
  return {
    title: `${data.exam.title} - ${data.student.studentName}`,
    author: data.school.name,
    subject: `Exam Results - ${data.exam.subjectName}`,
    keywords: `exam, results, ${data.exam.className}, ${data.exam.subjectName}`,
    creator: "Hogwarts School Management System",
    producer: "Hogwarts School Management System",
    creationDate: data.metadata.generatedAt,
  };
}

/**
 * Sanitize text for PDF (remove special characters that might cause issues)
 */
export function sanitizePDFText(text: string): string {
  // Remove or replace problematic characters
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
    .replace(/\t/g, "    ") // Replace tabs with spaces
    .trim();
}

/**
 * Calculate content height for pagination
 */
export function calculateContentHeight(
  items: unknown[],
  itemHeight: number,
  pageHeight: number,
  marginTop: number,
  marginBottom: number
): { pages: number; itemsPerPage: number } {
  const availableHeight = pageHeight - marginTop - marginBottom;
  const itemsPerPage = Math.floor(availableHeight / itemHeight);
  const pages = Math.ceil(items.length / itemsPerPage);

  return { pages, itemsPerPage };
}

/**
 * Generate color scheme based on school branding
 */
export function generateColorScheme(primaryColor?: string) {
  const defaultPrimary = "#3B82F6"; // blue-500
  const primary = primaryColor || defaultPrimary;

  return {
    primary,
    secondary: adjustColorBrightness(primary, 20),
    light: adjustColorBrightness(primary, 80),
    dark: adjustColorBrightness(primary, -20),
    text: "#1F2937", // gray-800
    textLight: "#6B7280", // gray-500
    border: "#E5E7EB", // gray-200
    background: "#FFFFFF",
  };
}

/**
 * Adjust color brightness
 */
function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness
  const adjust = (value: number) => {
    const adjusted = value + (value * percent) / 100;
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  const newR = adjust(r);
  const newG = adjust(g);
  const newB = adjust(b);

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}
