"use server"

import { auth } from "@/auth"

import {
  fileToCSV,
  parseCSVLine,
  preprocessCSV,
  STUDENT_HEADER_MAP,
  TEACHER_HEADER_MAP,
} from "@/lib/import/csv-utils"
import { logger } from "@/lib/logger"
import {
  importStudents,
  importTeachers,
} from "@/components/file/import/csv-import"

// ---------- Types ----------

interface ParseResult {
  totalRows: number
  validRows: number
  invalidRows: Array<{ row: number; error: string }>
  csvContent: string
}

interface SmartImportResult {
  imported: number
  failed: number
  skipped: number
  errors: Array<{ row: number; error: string; details?: string }>
}

/**
 * Phase 1: Fast parse + validate only (no DB writes).
 * Returns row counts and pre-processed CSV for Phase 2.
 * Target: <500ms for ~1000 rows.
 */
export async function parseAndValidate(
  formData: FormData
): Promise<ParseResult> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Not authenticated")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) {
    throw new Error("No school associated with user")
  }

  const file = formData.get("file") as File | null
  const type = formData.get("type") as string

  if (!file) {
    throw new Error("No file provided")
  }

  if (!type || !["students", "teachers"].includes(type)) {
    throw new Error('Invalid import type. Use "students" or "teachers"')
  }

  // 1. Convert any format to CSV and preprocess
  let csvContent = await fileToCSV(file)
  csvContent = preprocessCSV(csvContent, type as "students" | "teachers")

  // 3. Count and validate rows (no DB)
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim())
  const totalRows = Math.max(0, lines.length - 1) // exclude header
  const invalidRows: Array<{ row: number; error: string }> = []

  // Quick validation: check required fields exist in each row
  if (totalRows > 0) {
    const headers = parseCSVLine(lines[0])
    const isStudents = type === "students"
    const nameIdx = headers.indexOf("name")
    const idIdx = isStudents
      ? headers.indexOf("studentId")
      : headers.indexOf("employeeId")
    const emailIdx = headers.indexOf("email")

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const values = parseCSVLine(lines[i])
      const name = values[nameIdx]?.trim()
      const id = values[idIdx]?.trim()
      const email = values[emailIdx]?.trim()

      if (!name) {
        invalidRows.push({ row: i + 1, error: "Missing name" })
      } else if (isStudents && !id) {
        invalidRows.push({ row: i + 1, error: "Missing studentId" })
      } else if (!isStudents && (!id || !email)) {
        invalidRows.push({
          row: i + 1,
          error: !id ? "Missing employeeId" : "Missing email",
        })
      }
    }
  }

  return {
    totalRows,
    validRows: totalRows - invalidRows.length,
    invalidRows,
    csvContent,
  }
}

/**
 * Phase 2: Actual DB import.
 * Accepts either a file or pre-processed csvContent from parseAndValidate.
 */
export async function smartImport(
  formData: FormData
): Promise<SmartImportResult> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Not authenticated")
  }

  const schoolId = session.user.schoolId
  if (!schoolId) {
    throw new Error("No school associated with user")
  }

  const type = formData.get("type") as string

  if (!type || !["students", "teachers"].includes(type)) {
    throw new Error('Invalid import type. Use "students" or "teachers"')
  }

  // Accept pre-processed CSV from parseAndValidate, or parse from file
  let csvContent = formData.get("csvContent") as string | null

  if (!csvContent) {
    const file = formData.get("file") as File | null
    if (!file) {
      throw new Error("No file or csvContent provided")
    }

    csvContent = await fileToCSV(file)
    csvContent = preprocessCSV(csvContent, type as "students" | "teachers")
  }

  // Call existing import functions
  const result =
    type === "students"
      ? await importStudents(csvContent, schoolId)
      : await importTeachers(csvContent, schoolId)

  logger.info("Smart import completed", {
    action: "smart_import",
    type,
    schoolId,
    imported: result.imported,
    failed: result.failed,
    userId: session.user.id,
  })

  return {
    imported: result.imported,
    failed: result.failed,
    skipped: result.skipped,
    errors: result.errors,
  }
}
