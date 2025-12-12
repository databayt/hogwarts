/**
 * Unified File Block - Print Hook
 * Client-side hook for print operations
 */

"use client";

import { useState, useCallback, useRef } from "react";
import type { PrintConfig, PrintProgress, PrintResult, UsePrintReturn } from "./types";
import { DEFAULT_MARGINS } from "./types";

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePrint(): UsePrintReturn {
  const [isPrinting, setIsPrinting] = useState(false);
  const [progress, setProgress] = useState<PrintProgress>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);

  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  // ============================================================================
  // Create Print Frame
  // ============================================================================

  const createPrintFrame = useCallback((): HTMLIFrameElement => {
    // Remove existing frame if any
    if (printFrameRef.current) {
      document.body.removeChild(printFrameRef.current);
    }

    // Create new frame
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.style.visibility = "hidden";

    document.body.appendChild(frame);
    printFrameRef.current = frame;

    return frame;
  }, []);

  // ============================================================================
  // Generate Print Styles
  // ============================================================================

  const generatePrintStyles = useCallback((config: PrintConfig): string => {
    const margins = config.margins || DEFAULT_MARGINS;
    const orientation = config.orientation || "portrait";
    const pageSize = config.pageSize || "A4";

    return `
      @media print {
        @page {
          size: ${pageSize} ${orientation};
          margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
        }

        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          ${!config.color ? "filter: grayscale(100%);" : ""}
        }

        /* Hide non-printable elements */
        .no-print,
        button,
        [role="button"],
        nav,
        .navigation,
        header:not(.print-header),
        footer:not(.print-footer) {
          display: none !important;
        }

        /* Ensure page breaks work */
        .page-break {
          page-break-before: always;
        }

        .no-page-break {
          page-break-inside: avoid;
        }

        /* Table handling */
        table {
          page-break-inside: auto;
        }

        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }

        thead {
          display: table-header-group;
        }

        tfoot {
          display: table-footer-group;
        }
      }
    `;
  }, []);

  // ============================================================================
  // Print Element
  // ============================================================================

  const print = useCallback(
    async (element?: HTMLElement | null, config: PrintConfig = {}): Promise<PrintResult> => {
      setIsPrinting(true);
      setError(null);
      setProgress({ status: "preparing", message: "Preparing print..." });

      try {
        // If no element, print the whole page
        if (!element) {
          setProgress({ status: "printing", message: "Opening print dialog..." });
          window.print();
          setProgress({ status: "completed" });
          return { success: true };
        }

        // Create print frame
        const frame = createPrintFrame();
        const frameDoc = frame.contentDocument || frame.contentWindow?.document;

        if (!frameDoc) {
          throw new Error("Could not create print frame");
        }

        // Clone the element
        const clone = element.cloneNode(true) as HTMLElement;

        // Get computed styles from the original document
        const stylesheets = Array.from(document.styleSheets);
        let stylesHtml = "";

        for (const stylesheet of stylesheets) {
          try {
            if (stylesheet.href) {
              stylesHtml += `<link rel="stylesheet" href="${stylesheet.href}" />`;
            } else if (stylesheet.cssRules) {
              const rules = Array.from(stylesheet.cssRules)
                .map((rule) => rule.cssText)
                .join("\n");
              stylesHtml += `<style>${rules}</style>`;
            }
          } catch {
            // Cross-origin stylesheets will throw
          }
        }

        // Add print-specific styles
        const printStyles = generatePrintStyles(config);
        stylesHtml += `<style>${printStyles}</style>`;

        // Get document direction for RTL support
        const direction = document.documentElement.dir || "ltr";

        // Build print document
        frameDoc.open();
        frameDoc.write(`
          <!DOCTYPE html>
          <html dir="${direction}" lang="${document.documentElement.lang || "en"}">
            <head>
              <meta charset="utf-8">
              <title>Print</title>
              ${stylesHtml}
            </head>
            <body class="print-body">
              ${clone.outerHTML}
            </body>
          </html>
        `);
        frameDoc.close();

        // Wait for resources to load
        await new Promise((resolve) => setTimeout(resolve, 500));

        setProgress({ status: "printing", message: "Opening print dialog..." });

        // Trigger print
        frame.contentWindow?.focus();
        frame.contentWindow?.print();

        setProgress({ status: "completed" });
        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Print failed";
        setError(errorMessage);
        setProgress({ status: "error", error: errorMessage });
        return { success: false, error: errorMessage };
      } finally {
        setIsPrinting(false);
        // Cleanup frame after a delay
        setTimeout(() => {
          if (printFrameRef.current) {
            document.body.removeChild(printFrameRef.current);
            printFrameRef.current = null;
          }
        }, 1000);
      }
    },
    [createPrintFrame, generatePrintStyles]
  );

  // ============================================================================
  // Print by Element ID
  // ============================================================================

  const printById = useCallback(
    async (elementId: string, config: PrintConfig = {}): Promise<PrintResult> => {
      const element = document.getElementById(elementId);

      if (!element) {
        const errorMessage = `Element with id "${elementId}" not found`;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return print(element, config);
    },
    [print]
  );

  // ============================================================================
  // Print HTML Content
  // ============================================================================

  const printHtml = useCallback(
    async (html: string, config: PrintConfig = {}): Promise<PrintResult> => {
      setIsPrinting(true);
      setError(null);
      setProgress({ status: "preparing", message: "Preparing print..." });

      try {
        const frame = createPrintFrame();
        const frameDoc = frame.contentDocument || frame.contentWindow?.document;

        if (!frameDoc) {
          throw new Error("Could not create print frame");
        }

        const printStyles = generatePrintStyles(config);
        const direction = document.documentElement.dir || "ltr";

        frameDoc.open();
        frameDoc.write(`
          <!DOCTYPE html>
          <html dir="${direction}" lang="${document.documentElement.lang || "en"}">
            <head>
              <meta charset="utf-8">
              <title>Print</title>
              <style>${printStyles}</style>
            </head>
            <body class="print-body">
              ${html}
            </body>
          </html>
        `);
        frameDoc.close();

        await new Promise((resolve) => setTimeout(resolve, 300));

        setProgress({ status: "printing", message: "Opening print dialog..." });

        frame.contentWindow?.focus();
        frame.contentWindow?.print();

        setProgress({ status: "completed" });
        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Print failed";
        setError(errorMessage);
        setProgress({ status: "error", error: errorMessage });
        return { success: false, error: errorMessage };
      } finally {
        setIsPrinting(false);
        setTimeout(() => {
          if (printFrameRef.current) {
            document.body.removeChild(printFrameRef.current);
            printFrameRef.current = null;
          }
        }, 1000);
      }
    },
    [createPrintFrame, generatePrintStyles]
  );

  // ============================================================================
  // Reset
  // ============================================================================

  const reset = useCallback(() => {
    setIsPrinting(false);
    setProgress({ status: "idle" });
    setError(null);
  }, []);

  return {
    isPrinting,
    progress,
    error,
    print,
    printById,
    printHtml,
    reset,
  };
}
