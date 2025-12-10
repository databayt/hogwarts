/**
 * Unified File Block - Export Button Component
 * Dropdown button for multi-format exports
 */

"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ExportColumn, ExportConfig, ExportFormat, ExportResult } from "./types";
import { useExport } from "./use-export";

// ============================================================================
// Types
// ============================================================================

interface ExportButtonProps<T> {
  /** Export configuration */
  config: Omit<ExportConfig<T>, "data">;

  /** Data to export (can also be passed via config) */
  data: T[];

  /** Enabled export formats */
  formats?: ExportFormat[];

  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";

  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";

  /** Custom button text */
  label?: string;

  /** Show column selector dialog */
  showColumnSelector?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Custom class name */
  className?: string;

  /** Callback on export complete */
  onExportComplete?: (result: ExportResult) => void;

  /** Callback on export error */
  onExportError?: (error: string) => void;

  /** Dictionary for i18n */
  dictionary?: {
    export?: string;
    exportAs?: string;
    csv?: string;
    excel?: string;
    pdf?: string;
    json?: string;
    selectColumns?: string;
    selectAll?: string;
    deselectAll?: string;
    cancel?: string;
    exporting?: string;
    complete?: string;
    error?: string;
  };
}

// ============================================================================
// Format Icons
// ============================================================================

const formatIcons: Record<ExportFormat, React.ReactNode> = {
  csv: <FileText className="mr-2 h-4 w-4" />,
  excel: <FileSpreadsheet className="mr-2 h-4 w-4" />,
  pdf: <FileText className="mr-2 h-4 w-4 text-red-500" />,
  json: <FileJson className="mr-2 h-4 w-4" />,
};

const formatLabels: Record<ExportFormat, string> = {
  csv: "CSV",
  excel: "Excel",
  pdf: "PDF",
  json: "JSON",
};

// ============================================================================
// Component
// ============================================================================

export function ExportButton<T>({
  config,
  data,
  formats = ["csv", "excel", "pdf"],
  variant = "outline",
  size = "default",
  label,
  showColumnSelector = false,
  disabled = false,
  className,
  onExportComplete,
  onExportError,
  dictionary,
}: ExportButtonProps<T>) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    config.columns.filter((col) => !col.hidden).map((col) => col.key)
  );

  const { isExporting, progress, error, exportTo, reset } = useExport({
    ...config,
    data,
  });

  // Handle export
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (showColumnSelector) {
        setSelectedFormat(format);
        setShowDialog(true);
        return;
      }

      const result = await exportTo(format, data);

      if (result.success) {
        onExportComplete?.(result);
      } else {
        onExportError?.(result.error || "Export failed");
      }
    },
    [showColumnSelector, exportTo, data, onExportComplete, onExportError]
  );

  // Handle dialog export
  const handleDialogExport = useCallback(async () => {
    if (!selectedFormat) return;

    const result = await exportTo(selectedFormat, data, { selectedColumns });

    if (result.success) {
      onExportComplete?.(result);
      setShowDialog(false);
    } else {
      onExportError?.(result.error || "Export failed");
    }
  }, [selectedFormat, exportTo, data, selectedColumns, onExportComplete, onExportError]);

  // Toggle column selection
  const toggleColumn = useCallback((key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  // Select/deselect all
  const toggleAll = useCallback(
    (select: boolean) => {
      if (select) {
        setSelectedColumns(config.columns.filter((col) => !col.hidden).map((col) => col.key));
      } else {
        setSelectedColumns([]);
      }
    },
    [config.columns]
  );

  // Get button content
  const getButtonContent = () => {
    if (isExporting) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {dictionary?.exporting || "Exporting..."}
        </>
      );
    }

    return (
      <>
        <Download className="mr-2 h-4 w-4" />
        {label || dictionary?.export || "Export"}
        <ChevronDown className="ml-2 h-4 w-4" />
      </>
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={disabled || isExporting || data.length === 0}
            className={cn(className)}
          >
            {getButtonContent()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
            {dictionary?.exportAs || "Export as"}
          </div>
          <DropdownMenuSeparator />
          {formats.map((format) => (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting}
            >
              {formatIcons[format]}
              {dictionary?.[format] || formatLabels[format]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Column Selector Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dictionary?.selectColumns || "Select Columns to Export"}
            </DialogTitle>
            <DialogDescription>
              Choose which columns to include in your {selectedFormat?.toUpperCase()} export.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Select All / Deselect All */}
            <div className="flex gap-4 text-sm">
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="text-primary hover:underline"
              >
                {dictionary?.selectAll || "Select All"}
              </button>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="text-primary hover:underline"
              >
                {dictionary?.deselectAll || "Deselect All"}
              </button>
            </div>

            {/* Column List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {config.columns
                .filter((col) => !col.hidden)
                .map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={selectedColumns.includes(column.key)}
                      onCheckedChange={() => toggleColumn(column.key)}
                    />
                    <Label htmlFor={column.key} className="cursor-pointer">
                      {config.locale === "ar" && column.headerAr
                        ? column.headerAr
                        : column.header}
                    </Label>
                  </div>
                ))}
            </div>

            {/* Progress */}
            {isExporting && (
              <div className="space-y-2">
                <Progress value={progress.progress} />
                <p className="text-sm text-muted-foreground">{progress.message}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {dictionary?.cancel || "Cancel"}
            </Button>
            <Button
              onClick={handleDialogExport}
              disabled={isExporting || selectedColumns.length === 0}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {dictionary?.exporting || "Exporting..."}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {dictionary?.export || "Export"} {selectedFormat?.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// Simple Export Button (Single Format)
// ============================================================================

interface SimpleExportButtonProps<T> {
  config: Omit<ExportConfig<T>, "data">;
  data: T[];
  format: ExportFormat;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  disabled?: boolean;
  className?: string;
  onExportComplete?: (result: ExportResult) => void;
  onExportError?: (error: string) => void;
}

export function SimpleExportButton<T>({
  config,
  data,
  format,
  variant = "outline",
  size = "default",
  label,
  disabled = false,
  className,
  onExportComplete,
  onExportError,
}: SimpleExportButtonProps<T>) {
  const { isExporting, exportTo } = useExport({
    ...config,
    data,
  });

  const handleClick = useCallback(async () => {
    const result = await exportTo(format, data);

    if (result.success) {
      onExportComplete?.(result);
    } else {
      onExportError?.(result.error || "Export failed");
    }
  }, [format, exportTo, data, onExportComplete, onExportError]);

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || isExporting || data.length === 0}
      onClick={handleClick}
      className={cn(className)}
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        formatIcons[format]
      )}
      {label || `Export ${formatLabels[format]}`}
    </Button>
  );
}

export type { ExportButtonProps, SimpleExportButtonProps };
