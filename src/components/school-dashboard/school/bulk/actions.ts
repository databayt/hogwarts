"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import * as XLSX from "xlsx"

import type { ActionResponse } from "@/lib/action-response"
import {
  importGuardians,
  importStaff,
  importStudents,
  importTeachers,
} from "@/components/file/import/csv-import"

interface BulkImportResult {
  imported: number
  failed: number
  errors: Array<{ row: number; error: string; details?: string }>
  warnings?: Array<{ row: number; warning: string }>
}

// ---------- Smart Header Maps ----------

const STUDENT_HEADER_MAP: Record<string, string[]> = {
  name: [
    "full name",
    "student name",
    "الاسم",
    "اسم الطالب",
    "fullname",
    "student",
  ],
  email: [
    "email address",
    "student email",
    "البريد",
    "البريد الإلكتروني",
    "e-mail",
    "mail",
  ],
  studentId: [
    "student id",
    "student number",
    "id",
    "student code",
    "رقم الطالب",
    "sid",
    "student_id",
    "studentnumber",
    "student no",
    "no",
    "number",
  ],
  yearLevel: [
    "grade",
    "grade level",
    "year",
    "class",
    "المرحلة",
    "الصف",
    "level",
    "year level",
    "gradelevel",
  ],
  guardianName: [
    "parent name",
    "guardian",
    "parent",
    "ولي الأمر",
    "guardian name",
    "parent full name",
  ],
  guardianEmail: [
    "parent email",
    "guardian email",
    "بريد ولي الأمر",
    "parent e-mail",
  ],
  guardianPhone: [
    "parent phone",
    "guardian phone",
    "contact number",
    "هاتف ولي الأمر",
    "parent contact",
    "parent mobile",
  ],
  dateOfBirth: [
    "dob",
    "birth date",
    "birthday",
    "تاريخ الميلاد",
    "birthdate",
    "date of birth",
    "born",
  ],
  gender: ["sex", "الجنس"],
  middleName: [
    "middle name",
    "middle",
    "الاسم الأوسط",
    "اسم الأب",
    "father name",
  ],
  section: [
    "section",
    "الشعبة",
    "الفصل",
    "homeroom",
    "class section",
    "division",
  ],
  enrollmentDate: [
    "enrollment date",
    "تاريخ التسجيل",
    "تاريخ الالتحاق",
    "admission date",
    "date enrolled",
    "join date",
  ],
  status: ["status", "الحالة", "student status", "حالة الطالب"],
}

const TEACHER_HEADER_MAP: Record<string, string[]> = {
  name: [
    "full name",
    "teacher name",
    "الاسم",
    "اسم المعلم",
    "fullname",
    "teacher",
  ],
  email: [
    "email address",
    "teacher email",
    "البريد",
    "البريد الإلكتروني",
    "e-mail",
    "mail",
  ],
  employeeId: [
    "employee id",
    "teacher id",
    "staff id",
    "id",
    "رقم الموظف",
    "emp id",
    "employee_id",
    "employee number",
    "emp no",
    "employee no",
  ],
  department: ["dept", "subject area", "القسم", "department name"],
  phoneNumber: [
    "phone",
    "phone number",
    "contact",
    "mobile",
    "الهاتف",
    "رقم الهاتف",
    "cell",
    "telephone",
  ],
  subjects: ["subject", "courses", "المواد", "teaching subjects"],
  qualification: [
    "degree",
    "المؤهل",
    "education",
    "highest degree",
    "credentials",
  ],
}

const STAFF_HEADER_MAP: Record<string, string[]> = {
  givenName: ["first name", "firstname", "given name", "الاسم الأول"],
  surname: ["last name", "lastname", "family name", "اسم العائلة"],
  emailAddress: [
    "email",
    "email address",
    "البريد",
    "البريد الإلكتروني",
    "e-mail",
  ],
  employeeId: [
    "employee id",
    "staff id",
    "id",
    "رقم الموظف",
    "emp id",
    "employee number",
  ],
  position: ["role", "job title", "الوظيفة", "المنصب", "title"],
  department: ["dept", "القسم", "department name"],
  phoneNumber: [
    "phone",
    "phone number",
    "mobile",
    "الهاتف",
    "رقم الهاتف",
    "contact",
  ],
  gender: ["sex", "الجنس"],
  employmentType: ["employment type", "type", "نوع التوظيف", "work type"],
}

const GUARDIAN_HEADER_MAP: Record<string, string[]> = {
  givenName: ["first name", "firstname", "given name", "الاسم الأول"],
  surname: ["last name", "lastname", "family name", "اسم العائلة"],
  emailAddress: [
    "email",
    "email address",
    "البريد",
    "البريد الإلكتروني",
    "e-mail",
  ],
  phoneNumber: [
    "phone",
    "phone number",
    "mobile",
    "الهاتف",
    "رقم الهاتف",
    "contact",
  ],
  guardianType: [
    "type",
    "relation",
    "relationship",
    "النوع",
    "صلة القرابة",
    "parent type",
  ],
  studentId: [
    "student id",
    "student number",
    "رقم الطالب",
    "linked student",
    "student",
  ],
}

// Split name columns to detect
const FIRST_NAME_ALIASES = [
  "first name",
  "firstname",
  "given name",
  "givenname",
  "fname",
  "الاسم الأول",
]
const LAST_NAME_ALIASES = [
  "last name",
  "lastname",
  "surname",
  "family name",
  "familyname",
  "lname",
  "اسم العائلة",
]

// ---------- Utilities ----------

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, " ")
}

function escapeCSVValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ",") {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Smart remap CSV headers from arbitrary names to expected field names.
 * Handles split first/last name columns by concatenating them into "name".
 */
function remapCSVHeaders(
  csvContent: string,
  headerMap: Record<string, string[]>
): string {
  const lines = csvContent.split(/\r?\n/)
  if (lines.length === 0) return csvContent

  const originalHeaders = parseCSVLine(lines[0])
  const normalizedHeaders = originalHeaders.map(normalizeHeader)

  const remap = new Map<number, string>()

  for (const [targetField, alternates] of Object.entries(headerMap)) {
    const exactIdx = normalizedHeaders.indexOf(targetField)
    if (exactIdx !== -1) {
      remap.set(exactIdx, targetField)
      continue
    }
    for (const alt of alternates) {
      const altNorm = normalizeHeader(alt)
      const idx = normalizedHeaders.indexOf(altNorm)
      if (idx !== -1) {
        remap.set(idx, targetField)
        break
      }
    }
  }

  // Detect split first/last name columns
  let firstNameIdx = -1
  let lastNameIdx = -1
  const hasNameField = Array.from(remap.values()).includes("name")

  if (!hasNameField) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      if (FIRST_NAME_ALIASES.includes(normalizedHeaders[i])) firstNameIdx = i
      if (LAST_NAME_ALIASES.includes(normalizedHeaders[i])) lastNameIdx = i
    }
  }

  const needsNameConcat = !hasNameField && firstNameIdx !== -1

  const newHeaders: string[] = []
  const columnIndices: number[] = []

  for (const [idx, field] of remap) {
    newHeaders.push(field)
    columnIndices.push(idx)
  }

  if (needsNameConcat) {
    newHeaders.push("name")
    columnIndices.push(-1)
  }

  // Pass through unmapped columns
  for (let i = 0; i < originalHeaders.length; i++) {
    if (remap.has(i)) continue
    if (needsNameConcat && (i === firstNameIdx || i === lastNameIdx)) continue
    newHeaders.push(originalHeaders[i])
    columnIndices.push(i)
  }

  const newLines = [newHeaders.join(",")]

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]
    if (!line.trim()) continue
    const values = parseCSVLine(line)
    const newValues: string[] = []

    for (const colIdx of columnIndices) {
      if (colIdx === -1) {
        const first = (values[firstNameIdx] || "").trim()
        const last =
          lastNameIdx !== -1 ? (values[lastNameIdx] || "").trim() : ""
        newValues.push(escapeCSVValue(last ? `${first} ${last}` : first))
      } else {
        newValues.push(escapeCSVValue(values[colIdx] || ""))
      }
    }

    newLines.push(newValues.join(","))
  }

  return newLines.join("\n")
}

/**
 * Normalize gender column values: "M"/"F", "Male"/"Female", "ذكر"/"أنثى" → "male"/"female"
 */
function normalizeGenderValues(csvContent: string): string {
  const lines = csvContent.split(/\r?\n/)
  if (lines.length === 0) return csvContent

  const headers = parseCSVLine(lines[0])
  const genderIdx = headers.findIndex(
    (h) => h.toLowerCase().trim() === "gender"
  )
  if (genderIdx === -1) return csvContent

  const GENDER_MAP: Record<string, string> = {
    m: "male",
    male: "male",
    ذكر: "male",
    f: "female",
    female: "female",
    أنثى: "female",
    other: "other",
    أخرى: "other",
  }

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCSVLine(lines[i])
    if (values[genderIdx]) {
      const normalized = values[genderIdx].toLowerCase().trim()
      values[genderIdx] = GENDER_MAP[normalized] || normalized
    }
    lines[i] = values.map(escapeCSVValue).join(",")
  }

  return lines.join("\n")
}

// ---------- File Conversion ----------

/**
 * Convert uploaded file (CSV/Excel/JSON/DOCX) to CSV string.
 * Supports: .csv, .xlsx, .xls, .json, .docx
 */
async function fileToCSV(file: File): Promise<string> {
  const name = file.name.toLowerCase()

  if (name.endsWith(".csv")) {
    return file.text()
  }

  if (name.endsWith(".json")) {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("JSON file must contain a non-empty array of objects")
    }
    const headers = Object.keys(data[0])
    const rows = data.map((row: Record<string, unknown>) =>
      headers.map((h) => escapeCSVValue(String(row[h] ?? ""))).join(",")
    )
    return [headers.join(","), ...rows].join("\n")
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName || !workbook.Sheets[sheetName]) {
      throw new Error("Excel file has no sheets")
    }
    return XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])
  }

  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    return extractDocxToCSV(file)
  }

  throw new Error(
    `Unsupported file format: ${name}. Use .csv, .xlsx, .xls, .json, or .docx`
  )
}

/**
 * Extract tabular data from DOCX files using mammoth.
 * Parses HTML tables from the document; falls back to line-based extraction.
 */
async function extractDocxToCSV(file: File): Promise<string> {
  const mammoth = await import("mammoth")
  const buffer = Buffer.from(await file.arrayBuffer())
  const { value: html } = await mammoth.convertToHtml({ buffer })

  // Try to extract tables from HTML
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i)
  if (tableMatch) {
    return htmlTableToCSV(tableMatch[0])
  }

  // Fallback: extract text lines and try to parse as tab/comma-separated
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

  // Detect delimiter: tab or comma
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

/**
 * Convert an HTML table string to CSV
 */
function htmlTableToCSV(html: string): string {
  const rows: string[][] = []

  // Extract all <tr> blocks
  const trRegex = /<tr[\s>][\s\S]*?<\/tr>/gi
  let trMatch
  while ((trMatch = trRegex.exec(html)) !== null) {
    const row: string[] = []
    // Extract <td> and <th> cells
    const cellRegex = /<(?:td|th)[\s>][\s\S]*?<\/(?:td|th)>/gi
    let cellMatch
    while ((cellMatch = cellRegex.exec(trMatch[0])) !== null) {
      // Strip HTML tags and decode entities
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

// ---------- Smart Import Pipeline ----------

/**
 * Process file through the smart import pipeline:
 * 1. Convert any format to CSV
 * 2. Smart remap headers (EN/AR aliases)
 * 3. Normalize gender values
 * 4. Import with auto-generated IDs for missing fields
 */
async function smartFileToCSV(
  file: File,
  headerMap: Record<string, string[]>
): Promise<string> {
  let csv = await fileToCSV(file)
  csv = csv.replace(/^\ufeff/, "") // Remove BOM
  csv = remapCSVHeaders(csv, headerMap)
  csv = normalizeGenderValues(csv)
  return csv
}

// ---------- Export Actions ----------

export async function bulkImportStudents(
  formData: FormData
): Promise<ActionResponse<BulkImportResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return { success: false, error: "Missing school context" }

    const file = formData.get("file") as File | null
    if (!file) return { success: false, error: "No file provided" }

    const csvContent = await smartFileToCSV(file, STUDENT_HEADER_MAP)
    const result = await importStudents(csvContent, schoolId)

    revalidatePath("/students")
    return { success: result.success, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    }
  }
}

export async function bulkImportTeachers(
  formData: FormData
): Promise<ActionResponse<BulkImportResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return { success: false, error: "Missing school context" }

    const file = formData.get("file") as File | null
    if (!file) return { success: false, error: "No file provided" }

    const csvContent = await smartFileToCSV(file, TEACHER_HEADER_MAP)
    const result = await importTeachers(csvContent, schoolId)

    revalidatePath("/teachers")
    return { success: result.success, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    }
  }
}

export async function bulkImportStaff(
  formData: FormData
): Promise<ActionResponse<BulkImportResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return { success: false, error: "Missing school context" }

    const file = formData.get("file") as File | null
    if (!file) return { success: false, error: "No file provided" }

    const csvContent = await smartFileToCSV(file, STAFF_HEADER_MAP)
    const result = await importStaff(csvContent, schoolId)

    revalidatePath("/staff")
    return { success: result.success, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    }
  }
}

export async function bulkImportGuardians(
  formData: FormData
): Promise<ActionResponse<BulkImportResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return { success: false, error: "Missing school context" }

    const file = formData.get("file") as File | null
    if (!file) return { success: false, error: "No file provided" }

    const csvContent = await smartFileToCSV(file, GUARDIAN_HEADER_MAP)
    const result = await importGuardians(csvContent, schoolId)

    revalidatePath("/parents")
    return { success: result.success, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    }
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
