"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
// ---------- DOCX-specific conversion (bulk only) ----------
import {
  escapeCSVValue,
  fileToCSV,
  parseCSVLine,
  preprocessCSV,
  type ImportType,
} from "@/lib/import/csv-utils"
import {
  importGuardians,
  importStaff,
  importStudents,
  importTeachers,
} from "@/components/file/import/csv-import"

async function fileToCSVWithDocx(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    return extractDocxToCSV(file)
  }
  return fileToCSV(file)
}

async function extractDocxToCSV(file: File): Promise<string> {
  const mammoth = await import("mammoth")
  const buffer = Buffer.from(await file.arrayBuffer())
  const { value: html } = await mammoth.convertToHtml({ buffer })

  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i)
  if (tableMatch) {
    return htmlTableToCSV(tableMatch[0])
  }

  const { value: text } = await mammoth.extractRawText({ buffer })
  const lines = text
    .split("\n")
    .map((l: string) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) {
    throw new Error(
      "DOCX file must contain a table or tab-separated data with headers"
    )
  }

  const firstLine = lines[0]
  const delimiter = firstLine.includes("\t") ? "\t" : ","
  return lines
    .map((line: string) =>
      line
        .split(delimiter)
        .map((v: string) => escapeCSVValue(v.trim()))
        .join(",")
    )
    .join("\n")
}

function htmlTableToCSV(html: string): string {
  const rows: string[][] = []
  const trRegex = /<tr[\s>][\s\S]*?<\/tr>/gi
  let trMatch
  while ((trMatch = trRegex.exec(html)) !== null) {
    const row: string[] = []
    const cellRegex = /<(?:td|th)[\s>][\s\S]*?<\/(?:td|th)>/gi
    let cellMatch
    while ((cellMatch = cellRegex.exec(trMatch[0])) !== null) {
      const text = cellMatch[0]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .trim()
      row.push(text)
    }
    if (row.length > 0) rows.push(row)
  }

  if (rows.length < 2) {
    throw new Error(
      "DOCX table must have at least a header row and one data row"
    )
  }

  return rows
    .map((row) => row.map((cell) => escapeCSVValue(cell)).join(","))
    .join("\n")
}

// ---------- Two-Phase Import ----------

const VALID_TYPES: ImportType[] = ["students", "teachers", "staff", "guardians"]

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
  // Plaintext temp credentials minted for the imported users. Passwords are
  // crypto-random + single-use (mustChangePassword), so this is the only place
  // the admin can read them to distribute.
  credentials?: Array<{
    row: number
    name: string
    username: string
    email: string | null
    role: string
    password: string
  }>
}

/**
 * Phase 1: Fast parse + validate (no DB writes).
 * Returns row counts and pre-processed CSV for Phase 2.
 */
export async function bulkParseAndValidate(
  formData: FormData
): Promise<ParseResult> {
  const session = await auth()
  if (!session?.user?.schoolId) {
    throw new Error("Not authenticated or missing school context")
  }

  const file = formData.get("file") as File | null
  const type = formData.get("type") as string

  if (!file) throw new Error("No file provided")
  if (!type || !VALID_TYPES.includes(type as ImportType)) {
    throw new Error("Invalid import type")
  }

  let csvContent = await fileToCSVWithDocx(file)
  csvContent = preprocessCSV(csvContent, type as ImportType)

  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim())
  const totalRows = Math.max(0, lines.length - 1)
  const invalidRows: Array<{ row: number; error: string }> = []

  if (totalRows > 0) {
    const headers = parseCSVLine(lines[0])
    const nameIdx = headers.indexOf("name")
    const firstNameIdx = headers.indexOf("firstName")

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const values = parseCSVLine(lines[i])
      const name = values[nameIdx]?.trim()
      const firstName = values[firstNameIdx]?.trim()

      if (!name && !firstName) {
        invalidRows.push({ row: i + 1, error: "Missing name" })
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
 * Accepts pre-processed csvContent from bulkParseAndValidate.
 */
export async function bulkSmartImport(
  formData: FormData
): Promise<SmartImportResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) throw new Error("Not authenticated or missing school context")

  const type = formData.get("type") as string
  if (!type || !VALID_TYPES.includes(type as ImportType)) {
    throw new Error("Invalid import type")
  }

  let csvContent = formData.get("csvContent") as string | null
  if (!csvContent) {
    const file = formData.get("file") as File | null
    if (!file) throw new Error("No file or csvContent provided")
    csvContent = await fileToCSVWithDocx(file)
    csvContent = preprocessCSV(csvContent, type as ImportType)
  }

  const result =
    type === "students"
      ? await importStudents(csvContent, schoolId, "BULK_IMPORT")
      : type === "teachers"
        ? await importTeachers(csvContent, schoolId)
        : type === "staff"
          ? await importStaff(csvContent, schoolId)
          : await importGuardians(csvContent, schoolId)

  const pathMap: Record<string, string> = {
    students: "/students",
    teachers: "/teachers",
    staff: "/staff",
    guardians: "/parents",
  }
  revalidatePath(pathMap[type] || "/school/bulk")

  return {
    imported: result.imported,
    failed: result.failed,
    skipped: result.skipped,
    errors: result.errors,
    credentials: result.credentials,
  }
}

export async function createDepartment(formData: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) throw new Error("Unauthorized")

  revalidatePath("/school/bulk")
  return { success: true, message: "Department creation coming soon" }
}

export async function createClassroom(formData: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) throw new Error("Unauthorized")

  revalidatePath("/school/bulk")
  return { success: true, message: "Classroom creation coming soon" }
}
