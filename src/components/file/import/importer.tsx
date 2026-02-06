/**
 * Unified File Block - Importer Component
 * File upload and column mapping for imports
 */

"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react"
import { useDropzone } from "react-dropzone"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { ImportColumn, ImportConfig, ImportResult } from "./types"
import { useImport } from "./use-import"

// ============================================================================
// Types
// ============================================================================

interface ImporterProps<T> {
  /** Import configuration */
  config: ImportConfig<T>

  /** Callback when import completes */
  onImport: (data: T[]) => Promise<void>

  /** Callback when import finishes (success or error) */
  onComplete?: (result: ImportResult<T>) => void

  /** Cancel callback */
  onCancel?: () => void

  /** Custom class name */
  className?: string

  /** Show step indicators */
  showSteps?: boolean

  /** Dictionary for i18n */
  dictionary?: {
    title?: string
    description?: string
    uploadStep?: string
    mapStep?: string
    reviewStep?: string
    importStep?: string
    dropzone?: string
    browse?: string
    column?: string
    mapTo?: string
    required?: string
    optional?: string
    preview?: string
    errors?: string
    warnings?: string
    validRows?: string
    invalidRows?: string
    import?: string
    cancel?: string
    back?: string
    next?: string
    importing?: string
    complete?: string
  }
}

type ImportStep = "upload" | "map" | "review" | "import"

// ============================================================================
// Component
// ============================================================================

export function Importer<T>({
  config,
  onImport,
  onComplete,
  onCancel,
  className,
  showSteps = true,
  dictionary,
}: ImporterProps<T>) {
  const [step, setStep] = useState<ImportStep>("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    isImporting,
    progress,
    error,
    preview,
    result,
    parseFile,
    updateMapping,
    validateData,
    importData,
    reset,
  } = useImport(config)

  // ============================================================================
  // File Upload
  // ============================================================================

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setSelectedFile(file)
      const previewResult = await parseFile(file)

      if (previewResult) {
        setStep("map")
      }
    },
    [parseFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "application/json": [".json"],
    },
    maxFiles: 1,
    disabled: isImporting,
  })

  // ============================================================================
  // Navigation
  // ============================================================================

  const handleNext = useCallback(async () => {
    if (step === "map") {
      const validationResult = await validateData()
      if (validationResult) {
        setStep("review")
      }
    } else if (step === "review") {
      setStep("import")
      const importResult = await importData(onImport)
      onComplete?.(importResult)
    }
  }, [step, validateData, importData, onImport, onComplete])

  const handleBack = useCallback(() => {
    if (step === "map") {
      setStep("upload")
      reset()
      setSelectedFile(null)
    } else if (step === "review") {
      setStep("map")
    }
  }, [step, reset])

  const handleCancel = useCallback(() => {
    reset()
    setSelectedFile(null)
    setStep("upload")
    onCancel?.()
  }, [reset, onCancel])

  // ============================================================================
  // Render Steps
  // ============================================================================

  const steps = [
    { key: "upload", label: dictionary?.uploadStep || "Upload" },
    { key: "map", label: dictionary?.mapStep || "Map Columns" },
    { key: "review", label: dictionary?.reviewStep || "Review" },
    { key: "import", label: dictionary?.importStep || "Import" },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === step)

  // ============================================================================
  // Render Content
  // ============================================================================

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{dictionary?.title || "Import Data"}</CardTitle>
        <CardDescription>
          {dictionary?.description ||
            "Upload a CSV or Excel file to import data"}
        </CardDescription>

        {/* Step Indicator */}
        {showSteps && (
          <div className="mt-4 flex items-center gap-2">
            {steps.map((s, idx) => (
              <React.Fragment key={s.key}>
                <div
                  className={cn(
                    "flex items-center gap-2",
                    idx <= currentStepIndex
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                      idx < currentStepIndex &&
                        "bg-primary text-primary-foreground",
                      idx === currentStepIndex && "border-primary border-2",
                      idx > currentStepIndex && "border-muted border-2"
                    )}
                  >
                    {idx < currentStepIndex ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className="hidden text-sm sm:inline">{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Upload Step */}
        {step === "upload" && (
          <div
            {...getRootProps()}
            className={cn(
              "border-border flex flex-col items-center justify-center rounded-lg border-2 border-dashed",
              "bg-muted/50 cursor-pointer p-8 text-center transition-colors",
              isDragActive && "border-primary bg-primary/10"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex items-center gap-4">
              <FileSpreadsheet className="text-muted-foreground h-10 w-10" />
              <FileText className="text-muted-foreground h-10 w-10" />
            </div>
            <p className="mt-4 text-sm font-medium">
              {dictionary?.dropzone ||
                "Drop your file here, or click to browse"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Supports CSV, Excel (.xlsx, .xls), and JSON files
            </p>
          </div>
        )}

        {/* Map Step */}
        {step === "map" && preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedFile?.name}</p>
                <p className="text-muted-foreground text-sm">
                  {preview.totalRows} rows found
                </p>
              </div>
              <Badge variant="secondary">{preview.format.toUpperCase()}</Badge>
            </div>

            {/* Column Mapping Table */}
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dictionary?.column || "File Column"}</TableHead>
                    <TableHead>{dictionary?.mapTo || "Map To"}</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.mappedColumns.map((mapping) => (
                    <TableRow key={mapping.header}>
                      <TableCell className="font-medium">
                        {mapping.header}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.mappedTo?.key || ""}
                          onValueChange={(value) => {
                            const column = config.columns.find(
                              (c) => c.key === value
                            )
                            updateMapping(mapping.header, column || null)
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Skip --</SelectItem>
                            {config.columns.map((col) => (
                              <SelectItem key={col.key} value={col.key}>
                                {col.label}
                                {col.required && " *"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {mapping.autoMatched && (
                          <Badge variant="outline" className="text-xs">
                            Auto-matched
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Preview Data */}
            <div>
              <h4 className="mb-2 text-sm font-medium">
                {dictionary?.preview || "Data Preview"}
              </h4>
              <ScrollArea className="h-[150px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {preview.headers.map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.sampleRows.map((row, idx) => (
                      <TableRow key={idx}>
                        {preview.headers.map((header) => (
                          <TableCell
                            key={header}
                            className="max-w-[200px] truncate"
                          >
                            {row[header]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="border-border rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{result.totalRows}</p>
                <p className="text-muted-foreground text-sm">Total Rows</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-900 dark:bg-green-950">
                <p className="text-2xl font-bold text-green-600">
                  {result.validRows}
                </p>
                <p className="text-sm text-green-600">Valid Rows</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950">
                <p className="text-2xl font-bold text-red-600">
                  {result.invalidRows}
                </p>
                <p className="text-sm text-red-600">Invalid Rows</p>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center dark:border-yellow-900 dark:bg-yellow-950">
                <p className="text-2xl font-bold text-yellow-600">
                  {result.duplicates}
                </p>
                <p className="text-sm text-yellow-600">Duplicates</p>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {dictionary?.errors || "Validation Errors"}
                </AlertTitle>
                <AlertDescription>
                  <ScrollArea className="mt-2 h-[150px]">
                    <ul className="space-y-1 text-sm">
                      {result.errors.slice(0, 20).map((err, idx) => (
                        <li key={idx}>
                          Row {err.row}: {err.message}
                          {err.column && ` (${err.column})`}
                        </li>
                      ))}
                      {result.errors.length > 20 && (
                        <li className="font-medium">
                          ... and {result.errors.length - 20} more errors
                        </li>
                      )}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{dictionary?.warnings || "Warnings"}</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 text-sm">
                    {result.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result.validRows === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No valid data</AlertTitle>
                <AlertDescription>
                  Please fix the errors above and try again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Import Step */}
        {step === "import" && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            {progress.status === "processing" && (
              <>
                <Loader2 className="text-primary h-12 w-12 animate-spin" />
                <p className="text-lg font-medium">
                  {dictionary?.importing || "Importing data..."}
                </p>
                <Progress
                  value={progress.progress}
                  className="w-full max-w-md"
                />
                <p className="text-muted-foreground text-sm">
                  {progress.message}
                </p>
              </>
            )}

            {progress.status === "completed" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-lg font-medium">
                  {dictionary?.complete || "Import Complete!"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {progress.message}
                </p>
              </>
            )}

            {progress.status === "error" && (
              <>
                <AlertCircle className="text-destructive h-12 w-12" />
                <p className="text-destructive text-lg font-medium">
                  Import Failed
                </p>
                <p className="text-muted-foreground text-sm">
                  {progress.error}
                </p>
              </>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && step !== "import" && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div>
          {step !== "upload" && step !== "import" && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isImporting}
            >
              {dictionary?.back || "Back"}
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isImporting}
          >
            {dictionary?.cancel || "Cancel"}
          </Button>

          {step === "map" && (
            <Button onClick={handleNext} disabled={isImporting}>
              {isImporting ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="me-2 h-4 w-4" />
              )}
              {dictionary?.next || "Validate & Continue"}
            </Button>
          )}

          {step === "review" && result && result.validRows > 0 && (
            <Button onClick={handleNext} disabled={isImporting}>
              {isImporting ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="me-2 h-4 w-4" />
              )}
              {dictionary?.import || `Import ${result.validRows} Rows`}
            </Button>
          )}

          {step === "import" && progress.status === "completed" && (
            <Button onClick={handleCancel}>Done</Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

export type { ImporterProps }
