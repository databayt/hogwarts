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

/**
 * Convert uploaded file (CSV/Excel/JSON) to CSV string for import functions.
 * The import functions in csv-import.ts use csv-parse internally,
 * so we normalize everything to CSV format.
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
      headers
        .map((h) => {
          const val = row[h]
          const str = val !== null && val !== undefined ? String(val) : ""
          // Escape CSV values with commas or quotes
          return str.includes(",") || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(",")
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
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])
    return csv
  }

  throw new Error(
    `Unsupported file format: ${name}. Use .csv, .xlsx, .xls, or .json`
  )
}

export async function bulkImportStudents(
  formData: FormData
): Promise<ActionResponse<BulkImportResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return { success: false, error: "Missing school context" }

    const file = formData.get("file") as File | null
    if (!file) return { success: false, error: "No file provided" }

    const csvContent = await fileToCSV(file)
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

    const csvContent = await fileToCSV(file)
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

    const csvContent = await fileToCSV(file)
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

    const csvContent = await fileToCSV(file)
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
