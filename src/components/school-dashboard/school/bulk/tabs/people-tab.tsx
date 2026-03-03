"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  GraduationCap,
  Loader2,
  Shield,
  Upload,
  UserCheck,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  bulkImportGuardians,
  bulkImportStaff,
  bulkImportStudents,
  bulkImportTeachers,
} from "../actions"

interface ImportResult {
  imported: number
  failed: number
  errors: Array<{ row: number; error: string; details?: string }>
  warnings?: Array<{ row: number; warning: string }>
}

interface Props {
  dictionary: Dictionary
  lang: Locale
}

function downloadTemplate(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const STUDENT_TEMPLATE =
  "name,email,studentId,yearLevel,guardianName,guardianEmail,guardianPhone,dateOfBirth,gender\nJohn Doe,john@example.com,STD001,Grade 10,Jane Doe,jane@example.com,+1234567890,2008-05-15,male\nSarah Smith,,STD002,Grade 9,Mike Smith,mike@example.com,+0987654321,2009-03-22,female"

const TEACHER_TEMPLATE =
  'name,email,employeeId,department,phoneNumber,subjects,qualification\nDr. Alice Johnson,alice@school.edu,TCH001,Mathematics,+1234567890,"Algebra,Calculus",PhD in Mathematics\nMr. Bob Wilson,bob@school.edu,TCH002,Science,+0987654321,Physics,MSc in Physics'

const STAFF_TEMPLATE =
  "givenName,surname,emailAddress,employeeId,position,department,phoneNumber,gender,employmentType\nAhmed,Hassan,ahmed@school.edu,STF001,Accountant,Finance,+1234567890,male,FULL_TIME\nFatima,Ali,fatima@school.edu,STF002,Librarian,Library,+0987654321,female,PART_TIME"

const GUARDIAN_TEMPLATE =
  "givenName,surname,emailAddress,phoneNumber,guardianType,studentId\nMohammed,Ahmed,mohammed@example.com,+1234567890,father,STD001\nSara,Hassan,sara@example.com,+0987654321,mother,STD002"

function ImportCard({
  icon: Icon,
  title,
  description,
  templateContent,
  templateFilename,
  importAction,
  isArabic,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  templateContent: string
  templateFilename: string
  importAction: (
    formData: FormData
  ) => Promise<{ success: boolean; data?: ImportResult; error?: string }>
  isArabic: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setResult(null)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await importAction(formData)

      if (response.success && response.data) {
        setResult(response.data)
      } else {
        setError(response.error || "Import failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setUploading(false)
    }
  }

  function handleReset() {
    setFile(null)
    setResult(null)
    setError(null)
    setShowErrors(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="text-muted-foreground h-5 w-5" />
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => downloadTemplate(templateContent, templateFilename)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isArabic ? "تحميل القالب" : "Download Template"}
          </Button>
          <div className="flex-1">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null)
                setResult(null)
                setError(null)
              }}
            />
          </div>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="me-2 h-4 w-4" />
            )}
            {uploading
              ? isArabic
                ? "جاري الاستيراد..."
                : "Importing..."
              : isArabic
                ? "استيراد"
                : "Import"}
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Result display */}
        {result && (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 rounded-md p-3 ${
                result.imported > 0
                  ? "border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                  : "border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
              }`}
            >
              <CheckCircle2
                className={`h-4 w-4 shrink-0 ${
                  result.imported > 0 ? "text-green-600" : "text-yellow-600"
                }`}
              />
              <p className="text-sm">
                {isArabic
                  ? `تم استيراد ${result.imported} بنجاح، فشل ${result.failed}`
                  : `${result.imported} imported successfully, ${result.failed} failed`}
              </p>
            </div>

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
                <p className="mb-1 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {isArabic ? "تحذيرات" : "Warnings"}
                </p>
                {result.warnings.map((w, idx) => (
                  <p
                    key={idx}
                    className="text-xs text-yellow-700 dark:text-yellow-300"
                  >
                    {isArabic ? `صف ${w.row}` : `Row ${w.row}`}: {w.warning}
                  </p>
                ))}
              </div>
            )}

            {/* Error list (collapsible) */}
            {result.errors.length > 0 && (
              <div className="rounded-md border p-3">
                <button
                  type="button"
                  onClick={() => setShowErrors(!showErrors)}
                  className="flex w-full items-center justify-between text-sm font-medium"
                >
                  <span>
                    {isArabic
                      ? `${result.errors.length} أخطاء`
                      : `${result.errors.length} error${result.errors.length > 1 ? "s" : ""}`}
                  </span>
                  {showErrors ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {showErrors && (
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="rounded bg-red-50 p-2 text-xs dark:bg-red-950"
                      >
                        <span className="font-medium">
                          {isArabic ? `صف ${err.row}` : `Row ${err.row}`}:
                        </span>{" "}
                        {err.error}
                        {err.details && (
                          <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                            {err.details}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reset button */}
            <Button variant="outline" size="sm" onClick={handleReset}>
              {isArabic ? "استيراد ملف آخر" : "Import Another File"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PeopleTab({ dictionary, lang }: Props) {
  const isArabic = lang === "ar"

  return (
    <div className="space-y-4">
      <ImportCard
        icon={GraduationCap}
        title={isArabic ? "استيراد الطلاب" : "Import Students"}
        description={
          isArabic
            ? "استيراد بيانات الطلاب من ملف CSV أو Excel أو JSON"
            : "Bulk import student data from CSV, Excel, or JSON file"
        }
        templateContent={STUDENT_TEMPLATE}
        templateFilename="students-template.csv"
        importAction={bulkImportStudents}
        isArabic={isArabic}
      />

      <ImportCard
        icon={UserCheck}
        title={isArabic ? "استيراد المعلمين" : "Import Teachers"}
        description={
          isArabic
            ? "استيراد بيانات المعلمين من ملف CSV أو Excel أو JSON"
            : "Bulk import teacher data from CSV, Excel, or JSON file"
        }
        templateContent={TEACHER_TEMPLATE}
        templateFilename="teachers-template.csv"
        importAction={bulkImportTeachers}
        isArabic={isArabic}
      />

      <ImportCard
        icon={Users}
        title={isArabic ? "استيراد الموظفين" : "Import Staff"}
        description={
          isArabic
            ? "استيراد بيانات الموظفين من ملف CSV أو Excel أو JSON"
            : "Bulk import staff data from CSV, Excel, or JSON file"
        }
        templateContent={STAFF_TEMPLATE}
        templateFilename="staff-template.csv"
        importAction={bulkImportStaff}
        isArabic={isArabic}
      />

      <ImportCard
        icon={Shield}
        title={isArabic ? "استيراد أولياء الأمور" : "Import Guardians"}
        description={
          isArabic
            ? "استيراد بيانات أولياء الأمور من ملف CSV أو Excel أو JSON"
            : "Bulk import guardian data from CSV, Excel, or JSON file"
        }
        templateContent={GUARDIAN_TEMPLATE}
        templateFilename="guardians-template.csv"
        importAction={bulkImportGuardians}
        isArabic={isArabic}
      />
    </div>
  )
}
