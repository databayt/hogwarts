/**
 * Bulk Attendance Upload Content
 *
 * CSV-based bulk attendance import with validation and preview:
 * - Handles CSV parsing with field extraction (Student ID, Name, Date, Status, Times, Notes)
 * - Validates status values (PRESENT, ABSENT, LATE, EXCUSED, SICK)
 * - Shows parse errors inline before upload (row-level feedback)
 * - Displays upload history (recent uploads with success/failure counts)
 * - Requires class selection and date before processing
 * - Optional check-in/check-out times and notes fields
 *
 * Client-side responsibilities:
 * - CSV parsing and validation (fast feedback without server roundtrip)
 * - Form state for class/date selection
 * - Upload result handling and display
 * - Recent uploads history from server
 *
 * Server-side (bulkUploadAttendance action):
 * - Re-validates each record with fresh student/class data
 * - Checks schoolId scoping and student enrollment
 * - Batch creates AttendanceRecord rows atomically
 * - Returns summary: total, successful, failed with error details
 *
 * Multi-tenant: Implicitly scoped by auth context in server action
 * Design rationale: Parse client-side for UX speed, validate server-side for security
 */
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { AttendanceStatus } from "@prisma/client"
import {
  Calendar,
  CircleAlert,
  CircleCheck,
  Download,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Upload,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ACCEPT_DOCUMENTS,
  FileUploader,
  type UploadedFileResult,
} from "@/components/file"

import {
  bulkUploadAttendance,
  getClassesForSelection,
  getRecentBulkUploads,
} from "../actions"
import { useAttendanceContext } from "../core/attendance-context"

interface BulkUploadContentProps {
  dictionary?: any
}

interface ParsedRecord {
  studentId: string
  status: AttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  notes?: string
}

interface RecentUpload {
  date: Date
  classId: string
  className: string
  total: number
  successful: number
  failed: number
}

export function BulkUploadContent({ dictionary }: BulkUploadContentProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileResult | null>(
    null
  )
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    details?: {
      total: number
      successful: number
      failed: number
      errors?: { studentId: string; error: string }[]
    }
  } | null>(null)

  // Class and date selection
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const { stats, refreshStats } = useAttendanceContext()

  // Dictionary shorthand
  const d = dictionary?.school?.attendance?.bulkUpload

  // Fetch classes and recent uploads on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesResult, uploadsResult] = await Promise.all([
          getClassesForSelection(),
          getRecentBulkUploads(5),
        ])
        if (classesResult.success && classesResult.data)
          setClasses(classesResult.data.classes)
        // uploadsResult returns raw data on success
        if (
          !("success" in uploadsResult && !uploadsResult.success) &&
          "uploads" in uploadsResult
        ) {
          setRecentUploads(uploadsResult.uploads)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])

  // Parse CSV content client-side with row-level validation
  // Fast feedback without server roundtrip - improves perceived performance
  // Uses regex to handle quoted fields properly (e.g., "Smith, Jr." doesn't break parsing)
  const parseCSV = useCallback(
    (content: string): { records: ParsedRecord[]; errors: string[] } => {
      const lines = content.trim().split("\n")
      const records: ParsedRecord[] = []
      const errors: string[] = []

      // Skip header row (i = 1)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Regex handles quoted fields: "Last, First" is a single field, not split by comma
        const values =
          line
            .match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
            ?.map((v) => v.replace(/^"|"$/g, "").trim()) || []

        // Minimum fields: Student ID, Name, Date, Status
        if (values.length < 4) {
          errors.push(
            `Row ${i + 1}: Missing required fields (expected: Student ID, Student Name, Date, Status)`
          )
          continue
        }

        // Destructure with optional fields (checkInTime, checkOutTime, notes)
        const [studentId, , , statusRaw, checkInTime, checkOutTime, notes] =
          values

        if (!studentId) {
          errors.push(`Row ${i + 1}: Missing student ID`)
          continue
        }

        const statusUpper = statusRaw?.toUpperCase() || "PRESENT"
        const validStatuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "SICK"]

        // Validate status against allowed enum values
        if (!validStatuses.includes(statusUpper)) {
          errors.push(
            `Row ${i + 1}: Invalid status "${statusRaw}" (valid: ${validStatuses.join(", ")})`
          )
          continue
        }

        records.push({
          studentId,
          status: statusUpper as AttendanceStatus,
          checkInTime: checkInTime || undefined,
          checkOutTime: checkOutTime || undefined,
          notes: notes || undefined,
        })
      }

      return { records, errors }
    },
    []
  )

  const handleUploadComplete = useCallback(
    async (files: UploadedFileResult[]) => {
      if (files.length > 0) {
        const file = files[0]
        setUploadedFile(file)
        setShowUploader(false)
        setUploadResult(null)
        setParsedRecords([])
        setParseErrors([])

        // Fetch and parse the CSV file
        try {
          const fileUrl = file.cdnUrl || (file as any).url
          if (fileUrl) {
            const response = await fetch(fileUrl)
            const content = await response.text()
            const { records, errors } = parseCSV(content)
            setParsedRecords(records)
            setParseErrors(errors)

            if (records.length > 0) {
              toast.success(`Parsed ${records.length} records from file`)
            }
            if (errors.length > 0) {
              toast.warning(`${errors.length} rows had issues`)
            }
          }
        } catch (error) {
          console.error("Error parsing file:", error)
          toast.error("Failed to parse file")
        }
      }
    },
    [parseCSV]
  )

  const handleUploadError = useCallback((error: string) => {
    toast.error(error)
  }, [])

  const handleProcess = useCallback(async () => {
    if (parsedRecords.length === 0) {
      toast.error("No valid records to process")
      return
    }

    if (!selectedClass) {
      toast.error("Please select a class")
      return
    }

    if (!selectedDate) {
      toast.error("Please select a date")
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const result = await bulkUploadAttendance({
        classId: selectedClass,
        date: selectedDate,
        method: "BULK_UPLOAD",
        records: parsedRecords,
      })

      setUploadResult({
        success: true,
        message:
          d?.results?.success || "Attendance records processed successfully!",
        details: {
          total: parsedRecords.length,
          successful: result.successful,
          failed: result.failed,
          errors: result.errors,
        },
      })

      // Clear the file and records after successful upload
      setUploadedFile(null)
      setParsedRecords([])
      setParseErrors([])

      // Refresh data
      refreshStats?.()

      // Refresh recent uploads
      const uploadsResult = await getRecentBulkUploads(5)
      setRecentUploads(uploadsResult.uploads)

      toast.success(`Processed ${result.successful} records`)
    } catch (error) {
      console.error("Error processing bulk upload:", error)
      setUploadResult({
        success: false,
        message: d?.results?.failed || "Processing failed. Please try again.",
      })
      toast.error("Processing failed")
    } finally {
      setIsUploading(false)
    }
  }, [parsedRecords, selectedClass, selectedDate, refreshStats, d])

  const downloadTemplate = useCallback(() => {
    // In real implementation, this would download a template file
    const csvContent =
      "Student ID,Student Name,Date,Status,Time In,Time Out,Notes\n" +
      "STU001,John Doe,2024-01-15,PRESENT,08:00,15:00,\n" +
      "STU002,Jane Smith,2024-01-15,PRESENT,08:15,15:00,Late arrival\n" +
      "STU003,Bob Johnson,2024-01-15,ABSENT,,,Sick leave"

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "attendance_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }, [])

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {d?.instructions?.title || "Instructions"}
          </CardTitle>
          <CardDescription>
            {d?.instructions?.description ||
              "Follow these steps to bulk upload attendance records"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2">
            <li>
              {d?.instructions?.step1 ||
                "Download the template file using the button below"}
            </li>
            <li>
              {d?.instructions?.step2 ||
                "Fill in the attendance data following the format in the template"}
            </li>
            <li>
              {d?.instructions?.step3 || "Save the file as CSV or Excel format"}
            </li>
            <li>
              {d?.instructions?.step4 ||
                "Upload the completed file using the upload section"}
            </li>
            <li>
              {d?.instructions?.step5 ||
                "Review the upload results and fix any errors if needed"}
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {d?.template?.title || "Download Template"}
          </CardTitle>
          <CardDescription>
            {d?.template?.description ||
              "Get a pre-formatted template to fill in attendance data"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {d?.template?.download || "Download CSV Template"}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {d?.upload?.title || "Upload Attendance File"}
          </CardTitle>
          <CardDescription>
            {d?.upload?.description ||
              "Select and upload your completed attendance file"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Class and Date Selection */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="class-select">
                {d?.upload?.selectClass || "Select Class"}
              </Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-select">
                  <SelectValue
                    placeholder={
                      d?.upload?.selectClassPlaceholder || "Choose a class..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingData ? (
                    <SelectItem value="_loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : classes.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      No classes found
                    </SelectItem>
                  ) : (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-input">
                {d?.upload?.selectDate || "Date"}
              </Label>
              <Input
                id="date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {uploadedFile ? (
            <div className="space-y-4">
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <span>{d?.upload?.fileUploaded || "File uploaded: "}</span>
                    <span className="font-medium">{uploadedFile.fileId}</span>
                    {parsedRecords.length > 0 && (
                      <span className="ml-2 text-green-600">
                        ({parsedRecords.length} records parsed)
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploader(true)}
                  >
                    {d?.upload?.changeFile || "Change File"}
                  </Button>
                </AlertDescription>
              </Alert>

              {/* Parse Errors */}
              {parseErrors.length > 0 && (
                <Alert variant="destructive">
                  <CircleAlert className="h-4 w-4" />
                  <AlertDescription>
                    <p className="mb-2 font-medium">
                      {d?.upload?.parseErrors || "Parse warnings:"}
                    </p>
                    <ul className="max-h-32 list-inside list-disc overflow-y-auto text-sm">
                      {parseErrors.slice(0, 10).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {parseErrors.length > 10 && (
                        <li>...and {parseErrors.length - 10} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleProcess}
                disabled={
                  isUploading || parsedRecords.length === 0 || !selectedClass
                }
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    {d?.upload?.processing || "Processing..."}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {d?.upload?.processButton || "Process Attendance Data"}
                    {parsedRecords.length > 0 &&
                      ` (${parsedRecords.length} records)`}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <FileSpreadsheet className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-4 text-sm">
                {d?.upload?.selectFile ||
                  "Upload your completed attendance file (CSV or Excel)"}
              </p>
              <Button
                variant="outline"
                onClick={() => setShowUploader(true)}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {d?.upload?.selectButton || "Select File"}
              </Button>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <Alert variant={uploadResult.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {uploadResult.success ? (
                  <CircleCheck className="mt-0.5 h-4 w-4" />
                ) : (
                  <CircleAlert className="mt-0.5 h-4 w-4" />
                )}
                <div className="space-y-2">
                  <AlertDescription>{uploadResult.message}</AlertDescription>
                  {uploadResult.details && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <p>
                          {(
                            d?.results?.total || "Total records: {count}"
                          ).replace(
                            "{count}",
                            uploadResult.details.total.toString()
                          )}
                        </p>
                        <p className="text-green-600">
                          {(
                            d?.results?.successful || "Successful: {count}"
                          ).replace(
                            "{count}",
                            uploadResult.details.successful.toString()
                          )}
                        </p>
                        <p className="text-red-600">
                          {(
                            d?.results?.failedCount || "Failed: {count}"
                          ).replace(
                            "{count}",
                            uploadResult.details.failed.toString()
                          )}
                        </p>
                      </div>
                      {uploadResult.details.errors &&
                        uploadResult.details.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-semibold">
                              {d?.results?.errors || "Errors:"}
                            </p>
                            <ul className="max-h-32 list-inside list-disc overflow-y-auto text-sm">
                              {uploadResult.details.errors.map(
                                (error, index) => (
                                  <li key={index}>
                                    {error.studentId}: {error.error}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {d?.recentUploads?.title || "Recent Bulk Uploads"}
          </CardTitle>
          <CardDescription>
            {d?.recentUploads?.description ||
              "History of your recent bulk attendance uploads"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : recentUploads.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <FileSpreadsheet className="mx-auto mb-2 h-10 w-10 opacity-50" />
              <p>{d?.recentUploads?.noUploads || "No bulk uploads yet"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUploads.map((upload, index) => {
                const uploadDate = new Date(upload.date)
                const now = new Date()
                const diffDays = Math.floor(
                  (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24)
                )
                let timeAgo = ""
                if (diffDays === 0) timeAgo = d?.recentUploads?.today || "Today"
                else if (diffDays === 1)
                  timeAgo = d?.recentUploads?.yesterday || "Yesterday"
                else
                  timeAgo = `${diffDays} ${d?.recentUploads?.daysAgo || "days ago"}`

                const successRate =
                  upload.total > 0
                    ? (upload.successful / upload.total) * 100
                    : 0
                const rateColor =
                  successRate >= 95
                    ? "text-green-600"
                    : successRate >= 80
                      ? "text-yellow-600"
                      : "text-red-600"

                return (
                  <div
                    key={index}
                    className="bg-muted flex items-center justify-between rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">
                          {upload.className}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {uploadDate.toLocaleDateString()} • {timeAgo}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${rateColor}`}>
                        {upload.successful}/{upload.total}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {d?.results?.recordsProcessed || "Records processed"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {d?.summary?.title || "Current Attendance Summary"}
            </CardTitle>
            <CardDescription>
              {d?.summary?.description ||
                "Overall attendance statistics after bulk uploads"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-sm">
                  {dictionary?.school?.attendance?.stats?.totalStudents ||
                    "Total Students"}
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {dictionary?.school?.attendance?.present || "Present Today"}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.present}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {dictionary?.school?.attendance?.absent || "Absent Today"}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.absent}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {dictionary?.school?.attendance?.late || "Late Today"}
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.late}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {d?.upload?.dialogTitle || "Upload Attendance File"}
            </DialogTitle>
          </DialogHeader>
          <FileUploader
            category="DOCUMENT"
            folder="attendance/bulk-uploads"
            accept={{
              ...ACCEPT_DOCUMENTS,
              "text/csv": [".csv"],
              "application/vnd.ms-excel": [".xls"],
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                [".xlsx"],
            }}
            maxFiles={1}
            multiple={false}
            maxSize={100 * 1024 * 1024} // 100MB for bulk data
            optimizeImages={false}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
