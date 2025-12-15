/**
 * Import Template Download API - CSV/Excel Template Generator
 *
 * Generates downloadable templates for bulk data import.
 *
 * USE CASES:
 * - Download empty template with correct headers
 * - Fill template with data in Excel/Google Sheets
 * - Upload completed template via /api/import
 *
 * SUPPORTED FORMATS:
 * - CSV (default): Universal compatibility, smaller
 * - Excel (xlsx): Better for complex data, multi-sheet
 *
 * SUPPORTED DATA TYPES:
 * - students: Student roster import
 * - teachers: Teacher records import
 * - classes: Class/section setup
 *
 * WHY EXCEL FALLBACK TO CSV:
 * - Excel generation uses xlsx library (memory intensive)
 * - If Excel fails, CSV fallback ensures download works
 * - CSV is simpler and more reliable
 *
 * TEMPLATE CONTENTS:
 * - Header row with all required/optional fields
 * - Example data row (commented or sample)
 * - Field validation notes
 *
 * WHY NO SCHOOLID IN TEMPLATE:
 * - schoolId injected during import (from session)
 * - Prevents users from importing to wrong school
 * - Multi-tenant safety through server-side injection
 *
 * RESPONSE HEADERS:
 * - Content-Type: text/csv or xlsx MIME type
 * - Content-Disposition: attachment with filename
 *   (triggers browser download vs display)
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { generateCsvTemplate, generateExcelTemplate } from "@/lib/import-parser"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const dataType = url.searchParams.get("type") || "students"
    const format = url.searchParams.get("format") || "csv"

    // Validate data type
    if (!["students", "teachers", "classes"].includes(dataType)) {
      return NextResponse.json({ error: "Invalid data type" }, { status: 400 })
    }

    // Generate template based on format
    if (format === "excel" || format === "xlsx") {
      try {
        const buffer = await generateExcelTemplate(dataType)

        // Convert Buffer to Uint8Array for NextResponse compatibility
        const uint8Array = new Uint8Array(buffer)

        return new NextResponse(uint8Array, {
          status: 200,
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${dataType}-template.xlsx"`,
          },
        })
      } catch (error) {
        logger.error(
          "Failed to generate Excel template",
          error instanceof Error ? error : new Error("Unknown error")
        )

        // Fallback to CSV if Excel generation fails
        const csvContent = generateCsvTemplate(dataType)

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${dataType}-template.csv"`,
          },
        })
      }
    } else {
      // Generate CSV template
      const csvContent = generateCsvTemplate(dataType)

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${dataType}-template.csv"`,
        },
      })
    }
  } catch (error) {
    logger.error(
      "Template generation error",
      error instanceof Error ? error : new Error("Unknown error")
    )

    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    )
  }
}
