"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useRef, useState } from "react"
import { AlertCircle, CheckCircle, Download, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import {
  generateResultImportTemplate,
  importExamResultsFromCSV,
} from "../results/actions/csv-import-export"

interface CSVImportDialogProps {
  examId: string
}

export function CSVImportDialog({ examId }: CSVImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [csvContent, setCsvContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [updateExisting, setUpdateExisting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    totalRows: number
    successCount: number
    errorCount: number
    errors: Array<{ row: number; studentId?: string; errors: string[] }>
  } | null>(null)
  const [importResult, setImportResult] = useState<{
    totalRows: number
    successCount: number
    errorCount: number
    updatedCount?: number
    errors: Array<{ row: number; studentId?: string; errors: string[] }>
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setFileName(file.name)
      setValidationResult(null)
      setImportResult(null)

      const reader = new FileReader()
      reader.onload = (ev) => {
        setCsvContent((ev.target?.result as string) || "")
      }
      reader.readAsText(file)
    },
    []
  )

  const handleDownloadTemplate = useCallback(async () => {
    const result = await generateResultImportTemplate(examId)
    if (result.success && result.data) {
      const blob = new Blob([result.data.csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.data.filename
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [examId])

  const handleValidate = useCallback(async () => {
    setIsValidating(true)
    const result = await importExamResultsFromCSV({
      examId,
      csvContent,
      validateOnly: true,
      updateExisting,
    })

    if (result.success && result.data) {
      setValidationResult(result.data)
    }
    setIsValidating(false)
  }, [examId, csvContent, updateExisting])

  const handleImport = useCallback(async () => {
    setIsImporting(true)
    const result = await importExamResultsFromCSV({
      examId,
      csvContent,
      validateOnly: false,
      updateExisting,
    })

    if (result.success && result.data) {
      setImportResult(result.data)
    }
    setIsImporting(false)
  }, [examId, csvContent, updateExisting])

  const reset = useCallback(() => {
    setCsvContent("")
    setFileName("")
    setValidationResult(null)
    setImportResult(null)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Marks from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student marks. Download the template first to
            get the correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="w-full gap-1"
          >
            <Download className="h-4 w-4" />
            Download CSV Template
          </Button>

          {/* File Upload */}
          <div
            className="border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            {fileName ? (
              <p className="text-sm font-medium">{fileName}</p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Click to select a CSV file
              </p>
            )}
          </div>

          {/* Update existing checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="updateExisting"
              checked={updateExisting}
              onCheckedChange={(v) => setUpdateExisting(v === true)}
            />
            <Label htmlFor="updateExisting" className="text-sm">
              Update existing results (overwrite)
            </Label>
          </div>

          {/* Validation Results */}
          {validationResult && !importResult && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                {validationResult.errorCount === 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm font-medium">Validation Results</span>
              </div>
              <div className="flex gap-3 text-sm">
                <Badge variant="secondary">
                  {validationResult.totalRows} rows
                </Badge>
                <Badge variant="default">
                  {validationResult.successCount} valid
                </Badge>
                {validationResult.errorCount > 0 && (
                  <Badge variant="destructive">
                    {validationResult.errorCount} errors
                  </Badge>
                )}
              </div>
              {validationResult.errors.length > 0 && (
                <ul className="text-destructive mt-2 space-y-1 text-xs">
                  {validationResult.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>
                      Row {e.row}
                      {e.studentId ? ` (${e.studentId})` : ""}:{" "}
                      {e.errors.join(", ")}
                    </li>
                  ))}
                  {validationResult.errors.length > 5 && (
                    <li>
                      ...and {validationResult.errors.length - 5} more errors
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Import Complete</span>
              </div>
              <div className="flex gap-3 text-sm">
                <Badge variant="default">
                  {importResult.successCount} imported
                </Badge>
                {(importResult.updatedCount ?? 0) > 0 && (
                  <Badge variant="secondary">
                    {importResult.updatedCount} updated
                  </Badge>
                )}
                {importResult.errorCount > 0 && (
                  <Badge variant="destructive">
                    {importResult.errorCount} errors
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {importResult ? (
            <Button
              onClick={() => {
                reset()
                setOpen(false)
                window.location.reload()
              }}
            >
              Done
            </Button>
          ) : (
            <>
              {!validationResult && csvContent && (
                <Button
                  variant="outline"
                  onClick={handleValidate}
                  disabled={isValidating}
                >
                  {isValidating ? "Validating..." : "Validate"}
                </Button>
              )}
              {validationResult && validationResult.successCount > 0 && (
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting
                    ? "Importing..."
                    : `Import ${validationResult.successCount} Results`}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
