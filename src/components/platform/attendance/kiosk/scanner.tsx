/**
 * Kiosk Scanner
 *
 * Barcode/QR code scanner component for kiosk check-in.
 * Uses camera or listens for barcode scanner input.
 */
"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface KioskScannerProps {
  onScan: (value: string) => void
  onCancel: () => void
  locale: string
}

export function KioskScanner({ onScan, onCancel, locale }: KioskScannerProps) {
  const isRTL = locale === "ar"
  const [scannerInput, setScannerInput] = useState("")
  const [isListening, setIsListening] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Focus input on mount to capture barcode scanner input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle barcode scanner input (most scanners simulate keyboard input)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isListening) return

      // Escape to cancel
      if (e.key === "Escape") {
        onCancel()
        return
      }

      // Enter submits the scan
      if (e.key === "Enter" && scannerInput.length > 0) {
        onScan(scannerInput)
        setScannerInput("")
        return
      }

      // Build up the scanned value
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setScannerInput((prev) => {
          const newValue = prev + e.key

          // Reset timeout - barcode scanners send input very quickly
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }

          // Auto-clear after 2 seconds of no input
          timeoutRef.current = setTimeout(() => {
            setScannerInput("")
          }, 2000)

          return newValue
        })
      }
    },
    [isListening, scannerInput, onScan, onCancel]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [handleKeyDown])

  return (
    <div className="flex w-full max-w-lg flex-col items-center text-center">
      {/* Hidden input to capture scanner input */}
      <input
        ref={inputRef}
        type="text"
        value={scannerInput}
        onChange={() => {}}
        className="sr-only"
        aria-hidden="true"
      />

      {/* Scanner visual */}
      <div className="relative mb-8">
        <div className="bg-primary/10 flex h-64 w-64 items-center justify-center rounded-3xl">
          {/* Scanning animation */}
          <div className="relative h-48 w-48">
            {/* Corner brackets */}
            <div className="border-primary absolute top-0 left-0 h-8 w-8 border-t-4 border-l-4" />
            <div className="border-primary absolute top-0 right-0 h-8 w-8 border-t-4 border-r-4" />
            <div className="border-primary absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4" />
            <div className="border-primary absolute right-0 bottom-0 h-8 w-8 border-r-4 border-b-4" />

            {/* Scanning line animation */}
            <div className="bg-primary/50 absolute top-1/2 right-4 left-4 h-0.5 animate-pulse" />
          </div>
        </div>

        {/* Pulsing ring */}
        <div className="border-primary/30 absolute inset-0 animate-ping rounded-3xl border-4 opacity-75" />
      </div>

      <h2 className="mb-2 text-3xl font-bold">
        {isRTL ? "جاري المسح..." : "Scanning..."}
      </h2>

      <p className="text-muted-foreground mb-4 text-lg">
        {isRTL
          ? "ضع بطاقتك أمام الماسح الضوئي"
          : "Place your card in front of the scanner"}
      </p>

      {/* Show current input if any */}
      {scannerInput && (
        <div className="bg-muted mb-4 rounded-lg px-4 py-2">
          <span className="font-mono text-lg">{scannerInput}</span>
        </div>
      )}

      <button
        onClick={onCancel}
        className="text-muted-foreground hover:text-foreground mt-4 text-lg transition-colors"
      >
        {isRTL ? "إلغاء" : "Cancel"}
      </button>
    </div>
  )
}
