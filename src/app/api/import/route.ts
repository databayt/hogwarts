// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * CSV Import API - Bulk Data Import
 *
 * Enables bulk import of students and teachers from CSV files.
 *
 * ENDPOINTS:
 * - POST: Process CSV file and create records
 * - GET: Download CSV template for correct format
 *
 * SUPPORTED TYPES:
 * - students: Bulk student enrollment
 * - teachers: Bulk teacher onboarding
 *
 * PERMISSION MODEL:
 * - PRINCIPAL or DEVELOPER only
 * - WHY: Bulk operations affect many records
 * - Prevents accidental mass data corruption
 *
 * WHY PRINCIPAL (not ADMIN):
 * - Importing users is a high-impact operation
 * - Principal is the designated school leader
 * - Reduces risk of unauthorized bulk changes
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - schoolId from session (not CSV or params)
 * - All imported records scoped to user's school
 * - Cannot import into another school
 *
 * WHY GET FOR TEMPLATES:
 * - Templates are read-only resources
 * - Browser can download directly (no auth in URL)
 * - Cacheable for performance
 *
 * CSV FORMAT:
 * - Headers required on first row
 * - UTF-8 encoding (supports Arabic names)
 * - Templates show expected columns
 *
 * ERROR HANDLING:
 * - Returns imported count and failed rows
 * - Partial success allowed (imports valid rows)
 * - Failed rows returned with error details
 *
 * GOTCHAS:
 * - Large files may timeout (consider chunking)
 * - Duplicate emails handled by import functions
 * - Date formats must match template spec
 * - No rollback on partial failure
 *
 * @see /components/file/index.ts for import implementation
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import * as XLSX from "xlsx"

import { logger } from "@/lib/logger"
import {
  generateStudentTemplate,
  generateTeacherTemplate,
  importStudents,
  importTeachers,
} from "@/components/file"

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
      headers
        .map((h) => {
          const val = row[h]
          const str = val !== null && val !== undefined ? String(val) : ""
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
    return XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])
  }

  throw new Error(`Unsupported file format. Use .csv, .xlsx, .xls, or .json`)
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Allow ADMIN, PRINCIPAL, or DEVELOPER to import
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "PRINCIPAL" &&
      session.user.role !== "DEVELOPER"
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    if (!session.user.schoolId) {
      return NextResponse.json(
        { error: "No school associated with user" },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!type || !["students", "teachers"].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid import type. Use "students" or "teachers"' },
        { status: 400 }
      )
    }

    // Convert any format to CSV
    const content = await fileToCSV(file)

    let result
    if (type === "students") {
      result = await importStudents(content, session.user.schoolId)
    } else {
      result = await importTeachers(content, session.user.schoolId)
    }

    logger.info("CSV import completed", {
      action: "csv_import",
      type,
      schoolId: session.user.schoolId,
      imported: result.imported,
      failed: result.failed,
      userId: session.user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error(
      "CSV import API error",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "csv_import_api_error",
      }
    )
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

// GET endpoint to download templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (!type || !["students", "teachers"].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid template type. Use "students" or "teachers"' },
        { status: 400 }
      )
    }

    let content: string
    let filename: string

    if (type === "students") {
      content = await generateStudentTemplate()
      filename = "student_import_template.csv"
    } else {
      content = await generateTeacherTemplate()
      filename = "teacher_import_template.csv"
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error(
      "Template download error",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "template_download_error",
      }
    )
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    )
  }
}
