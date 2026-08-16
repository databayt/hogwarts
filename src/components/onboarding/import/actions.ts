"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
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
  // Non-fatal per-row notes — a skipped duplicate, an unmatched grade. These
  // explain the gap between the row count and `imported`, so the caller must
  // be able to show them.
  warnings?: Array<{ row: number; warning: string }>
  // Access codes generated for imported students (the "link parent" codes).
  accessCodes?: Array<{ studentId: string; code: string; expiresAt: string }>
  // Plaintext temp credentials minted for the imported users. Passwords are
  // crypto-random + single-use (mustChangePassword), so this is the only place
  // the admin can read them to distribute. Mirrors school/bulk's
  // SmartImportResult — this return type used to silently drop the field.
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
 * Bulk import mass-creates User + Student rows and mints their credentials, so
 * it is an admin-only operation. Both actions below are `"use server"`, i.e.
 * public POST endpoints — before this guard existed they accepted ANY signed-in
 * user with a schoolId, and `joinSchool` promotes USER -> STAFF
 * (`src/lib/school-access.ts`), so ordinary school members could run it.
 *
 * `requireSchoolRole` (school-dashboard/school/require-school-admin.ts) is NOT
 * reusable here: it resolves the tenant via `getTenantContext()`, and onboarding
 * runs on the main host where there is no subdomain to resolve from.
 *
 * The role is read from the DATABASE, never from `session.user.role`. School
 * creation promotes USER -> ADMIN on the User row (`school-access.ts`), but the
 * session is only documented to pick up `schoolId` immediately — trusting a
 * stale JWT role would lock the legitimate onboarding admin out of their own
 * import step, i.e. break the very flow this guard protects.
 */
async function requireOnboardingImporter(): Promise<{
  userId: string
  schoolId: string
}> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    throw new Error("Not authenticated")
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, schoolId: true },
  })

  if (user?.role !== "ADMIN" && user?.role !== "DEVELOPER") {
    throw new Error("Unauthorized")
  }

  // DEVELOPER carries no schoolId of its own (platform admin, see CLAUDE.md) —
  // fall back to the session's impersonation context for that role only.
  const schoolId =
    user.role === "DEVELOPER"
      ? (user.schoolId ?? session?.user?.schoolId)
      : user.schoolId

  if (!schoolId) {
    throw new Error("No school associated with user")
  }

  return { userId, schoolId }
}

/**
 * Phase 1: Fast parse + validate only (no DB writes).
 * Returns row counts and pre-processed CSV for Phase 2.
 * Target: <500ms for ~1000 rows.
 */
export async function parseAndValidate(
  formData: FormData
): Promise<ParseResult> {
  await requireOnboardingImporter()

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
      } else if (!isStudents && (!id || !email)) {
        // Teachers/staff still need an employeeId + email. Students do NOT need
        // a studentId here — the import engine auto-generates the per-school
        // code when absent (generateStudentUsername), so requiring it needlessly
        // rejected valid rows that /school/bulk (Path B) accepts.
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
  const { userId, schoolId } = await requireOnboardingImporter()

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
      ? await importStudents(
          csvContent,
          schoolId,
          "ONBOARDING_IMPORT",
          // Opt-in, default off. During onboarding the school is usually not
          // live yet, so silence is almost always the right default here.
          formData.get("notifyFamilies") === "true"
        )
      : await importTeachers(csvContent, schoolId)

  // Same route-pattern revalidation `/school/bulk` does. The onboarding user
  // typically lands on the dashboard listing minutes after this step, and the
  // Applications tab now lists ONBOARDING_IMPORT rows too — without this both
  // pages served the pre-import cache. Route PATTERN, not a clean URL, and the
  // `(listings)` route group is not part of the path.
  revalidatePath(
    `/[lang]/s/[subdomain]/${type === "students" ? "students" : "teachers"}`,
    "page"
  )
  if (type === "students") {
    revalidatePath("/[lang]/s/[subdomain]/admission/applications", "page")
  }

  logger.info("Smart import completed", {
    action: "smart_import",
    type,
    schoolId,
    imported: result.imported,
    failed: result.failed,
    userId,
  })

  return {
    imported: result.imported,
    failed: result.failed,
    skipped: result.skipped,
    errors: result.errors,
    credentials: result.credentials,
    // The engine computes these per row and this wrapper used to drop them on
    // the floor: `warnings` is where a skipped duplicate or an unmatched grade
    // is explained, and `accessCodes` is the only place the generated codes
    // surface. Both were invisible to whoever ran the import.
    warnings: result.warnings,
    accessCodes: result.accessCodes,
  }
}
