import { PrismaClient } from "@prisma/client"

/**
 * Prisma Client Singleton - Database Connection Management
 *
 * WHY GLOBAL SINGLETON:
 * In development, Next.js Hot Module Replacement (HMR) causes modules to be
 * re-imported on every file change. Without this pattern, each HMR would create
 * a new PrismaClient, exhausting the database connection pool within minutes.
 *
 * HOW IT WORKS:
 * 1. Check if PrismaClient already exists on globalThis
 * 2. If not, create new instance
 * 3. In development, attach to global so it survives HMR
 * 4. In production, skip global attachment (no HMR)
 *
 * GOTCHA: This pattern doesn't work in Edge Runtime (no globalThis).
 * Edge functions must use different connection strategies.
 *
 * See: https://pris.ly/d/help/next-js-best-practices
 */

// Models that require schoolId for tenant isolation (all business models)
const TENANT_SCOPED_MODELS = new Set([
  "Student",
  "Guardian",
  "GuardianType",
  "StudentGuardian",
  "GuardianPhoneNumber",
  "StudentYearLevel",
  "StudentBatch",
  "Batch",
  "StudentDocument",
  "HealthRecord",
  "Achievement",
  "DisciplinaryRecord",
  "LibraryRecord",
  "FeeRecord",
  "Teacher",
  "Class",
  "StudentClass",
  "Subject",
  "YearLevel",
  "SchoolYear",
  "Department",
  "Period",
  "Term",
  "Attendance",
  "AttendanceExcuse",
  "AbsenceIntention",
  "AttendanceIntervention",
  "Assignment",
  "AssignmentSubmission",
  "Exam",
  "ExamResult",
  "Result",
  "ReportCard",
  "Lesson",
  "Timetable",
  "Announcement",
  "Event",
  "Conversation",
  "Lead",
  "LeadActivity",
  "Book",
  "BorrowRecord",
  "StreamCourse",
  "StreamEnrollment",
  "UserInvoice",
  "FeeStructure",
  "FeeAssignment",
  "Payment",
  "Refund",
  "Expense",
  "Budget",
  "SalaryStructure",
  "PayrollRun",
  "StaffMember",
])

// Operations that read/write data and should include schoolId
const SCOPED_OPERATIONS = new Set([
  "findMany",
  "findFirst",
  "findUnique",
  "updateMany",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
])

// Get connection string from environment variables
const connectionString = process.env.DATABASE_URL as string

const IS_DEV = process.env.NODE_ENV !== "production"

const globalForPrisma = global as unknown as { db: PrismaClient }

function createClient(): PrismaClient {
  const client = new PrismaClient()

  if (!IS_DEV) return client

  // Dev-only: enforce schoolId on tenant-scoped queries
  // Bulk operations (findMany, deleteMany, etc.) get console.error + stack trace
  // Unique lookups (findUnique) get console.warn (may legitimately use only unique ID)
  const BULK_OPERATIONS = new Set([
    "findMany",
    "findFirst",
    "updateMany",
    "deleteMany",
    "count",
    "aggregate",
    "groupBy",
  ])

  return client.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (
          model &&
          TENANT_SCOPED_MODELS.has(model) &&
          SCOPED_OPERATIONS.has(operation)
        ) {
          const where = (args as { where?: Record<string, unknown> })?.where
          if (where && !("schoolId" in where)) {
            const msg = `[TENANT] Query without schoolId: ${model}.${operation}`
            if (BULK_OPERATIONS.has(operation)) {
              // Bulk operations MUST have schoolId — potential data leak
              console.error(msg, { where: Object.keys(where) })
              console.trace("[TENANT] Stack trace for missing schoolId")
            } else {
              // findUnique — warn only (unique ID lookups are usually safe)
              console.warn(msg, { where: Object.keys(where) })
            }
          }
        }
        return query(args)
      },
    },
  }) as unknown as PrismaClient
}

// Use existing instance if available, otherwise create new
export const db = globalForPrisma.db || createClient()

// Only attach to global in development (prevents HMR connection exhaustion)
if (IS_DEV) globalForPrisma.db = db

// For debugging Prisma issues (simplified for Edge Runtime)
export function debugPrismaEngine() {
  // Only log in development
  if (process.env.NODE_ENV !== "development") {
    return { status: "ok", note: "Debug disabled in production" }
  }

  try {
    console.log(
      "Prisma connection URL:",
      connectionString?.substring(0, 20) + "..."
    )
    console.log("NODE_ENV:", process.env.NODE_ENV)

    return { status: "ok" }
  } catch (error) {
    console.error("Failed to debug Prisma engine:", error)
    return { error: error?.toString() }
  }
}
