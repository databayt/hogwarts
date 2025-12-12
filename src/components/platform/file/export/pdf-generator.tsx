/**
 * Unified File Block - PDF Generator
 * Generate and download PDF files using @react-pdf/renderer
 */

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";
import type { ExportColumn, ExportConfig, ExportResult } from "./types";
import { getValue, formatValue, getHeader, generateExportFilename } from "./formatters";
import { downloadBlob } from "./csv-generator";

// ============================================================================
// Font Registration (Arabic support)
// ============================================================================

// Register Tajawal font for Arabic text
Font.register({
  family: "Tajawal",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/tajawal/v9/Iurf6YBj_oCad4k1l4qjHrRpiYlJ.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/tajawal/v9/Iurf6YBj_oCad4k1l8qkHrRpiYlJ.ttf",
      fontWeight: "bold",
    },
  ],
});

// Register Inter font for English text
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2",
      fontWeight: "bold",
    },
  ],
});

// ============================================================================
// Styles
// ============================================================================

const createStyles = (
  locale: string,
  customStyles?: ExportConfig["styles"]
) => {
  const isRTL = locale === "ar";
  const fontFamily = isRTL ? "Tajawal" : "Inter";

  return StyleSheet.create({
    page: {
      padding: 30,
      fontFamily,
      fontSize: 10,
      direction: isRTL ? "rtl" : "ltr",
    },
    header: {
      marginBottom: 20,
      textAlign: isRTL ? "right" : "left",
    },
    logo: {
      width: 60,
      height: 60,
      marginBottom: 10,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 5,
      textAlign: isRTL ? "right" : "center",
    },
    subtitle: {
      fontSize: 12,
      color: "#666",
      marginBottom: 5,
      textAlign: isRTL ? "right" : "center",
    },
    schoolName: {
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 10,
      textAlign: isRTL ? "right" : "center",
    },
    date: {
      fontSize: 8,
      color: "#999",
      marginBottom: 10,
      textAlign: isRTL ? "right" : "center",
    },
    table: {
      width: "100%",
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: customStyles?.borderColor || "#e5e5e5",
    },
    tableRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      borderBottomWidth: 1,
      borderBottomColor: customStyles?.borderColor || "#e5e5e5",
    },
    tableHeaderRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      backgroundColor: customStyles?.headerBg || "#f3f4f6",
      borderBottomWidth: 1,
      borderBottomColor: customStyles?.borderColor || "#e5e5e5",
    },
    tableHeaderCell: {
      padding: 8,
      fontWeight: "bold",
      color: customStyles?.headerText || "#111827",
      textAlign: isRTL ? "right" : "left",
    },
    tableCell: {
      padding: 8,
      textAlign: isRTL ? "right" : "left",
    },
    evenRow: {
      backgroundColor: customStyles?.evenRowBg || "#f9fafb",
    },
    oddRow: {
      backgroundColor: customStyles?.oddRowBg || "#ffffff",
    },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 30,
      right: 30,
      textAlign: "center",
      fontSize: 8,
      color: "#999",
    },
    pageNumber: {
      position: "absolute",
      bottom: 20,
      right: 30,
      fontSize: 8,
      color: "#999",
    },
  });
};

// ============================================================================
// PDF Document Component
// ============================================================================

interface PDFDocumentProps<T> {
  config: ExportConfig<T>;
  styles: ReturnType<typeof createStyles>;
}

// Map page size to react-pdf format
const pageSizeMap: Record<string, "A4" | "LETTER" | "LEGAL" | "A3"> = {
  "A4": "A4",
  "Letter": "LETTER",
  "Legal": "LEGAL",
  "A3": "A3",
};

function PDFDocument<T>({ config, styles }: PDFDocumentProps<T>) {
  const {
    columns,
    data,
    locale = "en",
    title,
    subtitle,
    logoUrl,
    schoolName,
    orientation = "portrait",
    pageSize = "A4",
    includeHeader = true,
  } = config;

  const pdfPageSize = pageSizeMap[pageSize] || "A4";

  // Filter columns for PDF
  const pdfColumns = columns.filter(
    (col) => !col.hidden && col.includeInPdf !== false
  );

  // Calculate column widths
  const totalWidth = pdfColumns.reduce((sum, col) => sum + (col.width || 100), 0);
  const columnWidths = pdfColumns.map(
    (col) => `${((col.width || 100) / totalWidth) * 100}%`
  );

  return (
    <Document>
      <Page size={pdfPageSize} orientation={orientation} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {logoUrl && <Image src={logoUrl} style={styles.logo} />}
          {schoolName && <Text style={styles.schoolName}>{schoolName}</Text>}
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={styles.date}>
            {locale === "ar" ? "تاريخ الإنشاء:" : "Generated:"}{" "}
            {new Date().toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          {includeHeader && (
            <View style={styles.tableHeaderRow}>
              {pdfColumns.map((col, idx) => (
                <View
                  key={col.key}
                  style={[styles.tableHeaderCell, { width: columnWidths[idx] }]}
                >
                  <Text>{getHeader(col, locale)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Data Rows */}
          {data.map((row, rowIdx) => (
            <View
              key={rowIdx}
              style={[
                styles.tableRow,
                rowIdx % 2 === 0 ? styles.evenRow : styles.oddRow,
              ]}
            >
              {pdfColumns.map((col, colIdx) => {
                const value = getValue(row, col);
                const formatted = formatValue(value, col, row, locale);

                return (
                  <View
                    key={col.key}
                    style={[
                      styles.tableCell,
                      { width: columnWidths[colIdx] },
                      col.align === "right" ? { textAlign: "right" } : {},
                      col.align === "center" ? { textAlign: "center" } : {},
                    ]}
                  >
                    <Text>{formatted}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

// ============================================================================
// PDF Export
// ============================================================================

/**
 * Generate and download PDF file
 */
export async function exportToPdf<T>(config: ExportConfig<T>): Promise<ExportResult> {
  try {
    const { filename, locale = "en", data, styles: customStyles } = config;

    // Create styles
    const styles = createStyles(locale, customStyles);

    // Generate PDF document
    const pdfDoc = <PDFDocument config={config} styles={styles} />;

    // Generate blob
    const blob = await pdf(pdfDoc).toBlob();

    // Generate filename
    const exportFilename = generateExportFilename(filename, "pdf", locale);

    // Trigger download
    downloadBlob(blob, exportFilename);

    return {
      success: true,
      filename: exportFilename,
      format: "pdf",
      rowCount: data.length,
      fileSize: blob.size,
    };
  } catch (error) {
    console.error("[exportToPdf] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "PDF export failed",
    };
  }
}

// ============================================================================
// PDF Preview Component
// ============================================================================

interface PDFPreviewProps<T> {
  config: ExportConfig<T>;
  width?: number;
  height?: number;
}

export function PDFPreview<T>({
  config,
  width = 600,
  height = 800,
}: PDFPreviewProps<T>) {
  const styles = createStyles(config.locale || "en", config.styles);

  return (
    <div style={{ width, height, overflow: "auto", border: "1px solid #e5e5e5" }}>
      <PDFDocument config={config} styles={styles} />
    </div>
  );
}

export { createStyles };
