"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateCSVFilename } from "@/lib/csv-export";

export type ExportFormat = "csv" | "excel" | "pdf";

interface ExportButtonProps {
  /** Function to get CSV data */
  getCSV: (filters?: Record<string, unknown>) => Promise<string>;
  /** Current filters to apply to export */
  filters?: Record<string, unknown>;
  /** Entity name for filename (e.g., "students", "teachers") */
  entityName: string;
  /** Available export formats */
  formats?: ExportFormat[];
  /** Button variant */
  variant?: "default" | "outline" | "ghost";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** i18n translations */
  translations?: {
    export?: string;
    exportCSV?: string;
    exportExcel?: string;
    exportPDF?: string;
    exporting?: string;
  };
}

export function ExportButton({
  getCSV,
  filters,
  entityName,
  formats = ["csv"],
  variant = "outline",
  size = "sm",
  translations = {},
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const t = {
    export: translations.export || "Export",
    exportCSV: translations.exportCSV || "Export CSV",
    exportExcel: translations.exportExcel || "Export Excel",
    exportPDF: translations.exportPDF || "Export PDF",
    exporting: translations.exporting || "Exporting...",
  };

  const handleExport = async (format: ExportFormat = "csv") => {
    setIsExporting(true);
    try {
      if (format === "csv") {
        const csv = await getCSV(filters);

        // Create blob and download
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = generateCSVFilename(entityName);
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      // TODO: Add Excel and PDF export support
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Single format - show simple button
  if (formats.length === 1) {
    return (
      <Button
        onClick={() => handleExport(formats[0])}
        disabled={isExporting}
        variant={variant}
        size={size}
        aria-label={t.export}
        title={t.export}
      >
        {size === "icon" ? (
          <Download className="h-4 w-4" />
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? t.exporting : t.export}
          </>
        )}
      </Button>
    );
  }

  // Multiple formats - show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isExporting}
          variant={variant}
          size={size}
          aria-label={t.export}
          title={t.export}
        >
          {size === "icon" ? (
            <Download className="h-4 w-4" />
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? t.exporting : t.export}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.includes("csv") && (
          <DropdownMenuItem onClick={() => handleExport("csv")}>
            <FileText className="h-4 w-4 mr-2" />
            {t.exportCSV}
          </DropdownMenuItem>
        )}
        {formats.includes("excel") && (
          <DropdownMenuItem onClick={() => handleExport("excel")}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t.exportExcel}
          </DropdownMenuItem>
        )}
        {formats.includes("pdf") && (
          <DropdownMenuItem onClick={() => handleExport("pdf")}>
            <FileText className="h-4 w-4 mr-2" />
            {t.exportPDF}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
