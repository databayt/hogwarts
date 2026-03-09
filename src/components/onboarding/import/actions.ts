"use server"

import { auth } from "@/auth"
import * as XLSX from "xlsx"

import { logger } from "@/lib/logger"
import {
  importStudents,
  importTeachers,
} from "@/components/file/import/csv-import"

// Header alternate names for smart remapping
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

/**
 * Normalize a header string for comparison: lowercase, trim, remove extra spaces
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, " ")
}

/**
 * Remap CSV headers from arbitrary names to expected field names.
 * Also handles split first/last name columns by concatenating them.
 */
function remapCSVHeaders(
  csvContent: string,
  headerMap: Record<string, string[]>
): string {
  const lines = csvContent.split(/\r?\n/)
  if (lines.length === 0) return csvContent

  const headerLine = lines[0]
  // Parse the header line respecting CSV quoting
  const originalHeaders = parseCSVLine(headerLine)
  const normalizedHeaders = originalHeaders.map(normalizeHeader)

  // Build remap: originalIndex -> targetFieldName
  const remap = new Map<number, string>()

  for (const [targetField, alternates] of Object.entries(headerMap)) {
    // Check if already exact match
    const exactIdx = normalizedHeaders.indexOf(targetField)
    if (exactIdx !== -1) {
      remap.set(exactIdx, targetField)
      continue
    }
    // Check alternates
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

  // Build new header line
  const newHeaders: string[] = []
  const columnIndices: number[] = []

  for (const [idx, field] of remap) {
    newHeaders.push(field)
    columnIndices.push(idx)
  }

  // If we need to concat names, add "name" and remove first/last from remap if present
  if (needsNameConcat) {
    newHeaders.push("name")
    columnIndices.push(-1) // sentinel for concat
  }

  // Add any unmapped columns that aren't first/last name
  for (let i = 0; i < originalHeaders.length; i++) {
    if (remap.has(i)) continue
    if (needsNameConcat && (i === firstNameIdx || i === lastNameIdx)) continue
    // Pass through unmapped columns as-is
    newHeaders.push(originalHeaders[i])
    columnIndices.push(i)
  }

  // Build new CSV
  const newLines = [newHeaders.join(",")]

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]
    if (!line.trim()) continue
    const values = parseCSVLine(line)
    const newValues: string[] = []

    for (const colIdx of columnIndices) {
      if (colIdx === -1) {
        // Name concatenation
        const first = (values[firstNameIdx] || "").trim()
        const last =
          lastNameIdx !== -1 ? (values[lastNameIdx] || "").trim() : ""
        const fullName = last ? `${first} ${last}` : first
        newValues.push(escapeCSVValue(fullName))
      } else {
        newValues.push(escapeCSVValue(values[colIdx] || ""))
      }
    }

    newLines.push(newValues.join(","))
  }

  return newLines.join("\n")
}

/**
 * Parse a single CSV line respecting quoted fields
 */
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

function escapeCSVValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Convert uploaded file (CSV/Excel/JSON) to CSV string
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

  throw new Error(`Unsupported file format. Use .csv, .xlsx, .xls, or .json`)
}

/**
 * Normalize gender column values to match the expected enum: "male" | "female" | "other"
 * Handles: "M"/"F", "Male"/"Female", "ذكر"/"أنثى", and case variations
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

interface SmartImportResult {
  imported: number
  failed: number
  skipped: number
  errors: Array<{ row: number; error: string; details?: string }>
}

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

  const file = formData.get("file") as File | null
  const type = formData.get("type") as string

  if (!file) {
    throw new Error("No file provided")
  }

  if (!type || !["students", "teachers"].includes(type)) {
    throw new Error('Invalid import type. Use "students" or "teachers"')
  }

  // 1. Convert any format to CSV
  let csvContent = await fileToCSV(file)

  // 1b. Strip BOM if present (CSV export adds UTF-8 BOM for Excel compatibility)
  csvContent = csvContent.replace(/^\ufeff/, "")

  // 2. Smart remap headers
  const headerMap =
    type === "students" ? STUDENT_HEADER_MAP : TEACHER_HEADER_MAP
  csvContent = remapCSVHeaders(csvContent, headerMap)

  // 2b. Normalize gender values to lowercase (exports produce "Male"/"Female")
  csvContent = normalizeGenderValues(csvContent)

  // 3. Call existing import functions
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
