"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useRef, useState, useTransition } from "react"
import { Check, Copy, Loader2, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { generateStudentAccessCodes } from "./actions"

interface AccessCodeResult {
  studentId: string
  studentName: string
  code: string
  expiresAt: string
}

interface AccessCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentIds: string[]
  studentNames: Record<string, string>
}

export function AccessCodeDialog({
  open,
  onOpenChange,
  studentIds,
  studentNames,
}: AccessCodeDialogProps) {
  const [codes, setCodes] = useState<AccessCodeResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handleGenerate = useCallback(() => {
    setError(null)
    setCodes([])
    startTransition(async () => {
      const result = await generateStudentAccessCodes({
        studentIds,
      })
      if (result.success && result.data) {
        setCodes(
          result.data.map((c) => ({
            ...c,
            studentName: studentNames[c.studentId] || c.studentId,
          }))
        )
      } else {
        setError(
          "error" in result
            ? (result.error ?? "Failed to generate codes")
            : "Failed to generate codes"
        )
      }
    })
  }, [studentIds, studentNames])

  const handleCopy = useCallback(async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      // Fallback for environments without clipboard API
    }
  }, [])

  const handlePrint = useCallback(() => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Access Codes</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; }
          .code-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            page-break-inside: avoid;
          }
          .student-name { font-weight: 600; margin-bottom: 0.5rem; }
          .access-code {
            font-family: monospace;
            font-size: 1.5rem;
            letter-spacing: 0.1em;
            font-weight: 700;
            color: #1a1a1a;
          }
          .expiry { font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem; }
          .instructions {
            font-size: 0.875rem;
            color: #4b5563;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <h2>Student Access Codes</h2>
        <div class="instructions">
          Share this code with the student's parent or guardian.
          They can use it to link their account to the student's profile.
          Each code can only be used once.
        </div>
        ${codes
          .map(
            (c) => `
          <div class="code-card">
            <div class="student-name">${c.studentName}</div>
            <div class="access-code">${c.code}</div>
            <div class="expiry">Expires: ${new Date(c.expiresAt).toLocaleDateString()}</div>
          </div>
        `
          )
          .join("")}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }, [codes])

  // Auto-generate when dialog opens with students
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && studentIds.length > 0 && codes.length === 0) {
        handleGenerate()
      }
      if (!nextOpen) {
        setCodes([])
        setError(null)
      }
      onOpenChange(nextOpen)
    },
    [studentIds, codes.length, handleGenerate, onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {studentIds.length === 1
              ? "Generate Access Code"
              : `Generate Access Codes (${studentIds.length} students)`}
          </DialogTitle>
          <DialogDescription>
            Share these codes with parents to let them link their accounts to
            students. Each code can only be used once and expires after 90 days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              <span className="text-muted-foreground ms-2 text-sm">
                Generating codes...
              </span>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          {codes.length > 0 && (
            <>
              <div ref={printRef} className="space-y-3">
                {codes.map((item, index) => (
                  <div
                    key={item.studentId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.studentName}</p>
                      <p className="font-mono text-lg font-bold tracking-wider">
                        {item.code}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Expires: {new Date(item.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(item.code, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="me-2 h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isPending}
                >
                  Regenerate
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
