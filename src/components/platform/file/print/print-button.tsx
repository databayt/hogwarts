/**
 * Unified File Block - Print Button Component
 * Simple button to trigger print operations
 */

"use client";

import * as React from "react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Printer, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { PrintConfig } from "./types";
import { usePrint } from "./use-print";

// ============================================================================
// Types
// ============================================================================

interface PrintButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Element to print (optional - prints whole page if not provided) */
  elementRef?: React.RefObject<HTMLElement | null>;

  /** Element ID to print */
  elementId?: string;

  /** HTML content to print */
  htmlContent?: string;

  /** Print configuration */
  config?: PrintConfig;

  /** Callback after print */
  onPrint?: () => void;

  /** Callback on error */
  onError?: (error: string) => void;

  /** Children for button text */
  children?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function PrintButton({
  elementRef,
  elementId,
  htmlContent,
  config,
  onPrint,
  onError,
  children,
  className,
  disabled,
  ...buttonProps
}: PrintButtonProps) {
  const { isPrinting, print, printById, printHtml } = usePrint();

  const handleClick = useCallback(async () => {
    let result;

    if (htmlContent) {
      result = await printHtml(htmlContent, config);
    } else if (elementId) {
      result = await printById(elementId, config);
    } else if (elementRef?.current) {
      result = await print(elementRef.current, config);
    } else {
      result = await print(null, config);
    }

    if (result.success) {
      onPrint?.();
    } else {
      onError?.(result.error || "Print failed");
    }
  }, [htmlContent, elementId, elementRef, config, print, printById, printHtml, onPrint, onError]);

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPrinting}
      className={cn(className)}
      {...buttonProps}
    >
      {isPrinting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Printer className="mr-2 h-4 w-4" />
      )}
      {children || (isPrinting ? "Printing..." : "Print")}
    </Button>
  );
}

// ============================================================================
// Print Area Wrapper
// ============================================================================

interface PrintAreaProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Wrapper component that marks an area as printable
 */
export function PrintArea({ children, className, id }: PrintAreaProps) {
  return (
    <div id={id} className={cn("print-area", className)}>
      {children}
    </div>
  );
}

/**
 * Wrapper for content that should not be printed
 */
export function NoPrint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("no-print", className)}>{children}</div>;
}

/**
 * Component that forces a page break when printing
 */
export function PageBreak() {
  return <div className="page-break" style={{ pageBreakBefore: "always" }} />;
}

export type { PrintButtonProps, PrintAreaProps };
