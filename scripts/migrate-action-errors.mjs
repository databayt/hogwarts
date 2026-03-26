#!/usr/bin/env node
/**
 * Migrates action files from hardcoded English error strings to actionError() pattern.
 * Run: node scripts/migrate-action-errors.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { join, relative } from "path"

const BASE = "src/components/school-dashboard"
const IMPORT_LINE = `import { actionError, ACTION_ERRORS } from "@/lib/action-errors"`

// Pattern: { success: false, error: "English string" } or { success: false as const, error: "English string" }
// Maps common English error messages to ACTION_ERRORS codes
const ERROR_MAP = [
  // Auth/tenant
  [
    /error:\s*"Not authenticated"/g,
    "actionError(ACTION_ERRORS.NOT_AUTHENTICATED)",
  ],
  [
    /error:\s*"Authentication required"/g,
    "actionError(ACTION_ERRORS.NOT_AUTHENTICATED)",
  ],
  [
    /error:\s*"Missing school context"/g,
    "actionError(ACTION_ERRORS.MISSING_SCHOOL)",
  ],
  [
    /error:\s*"School context not found"/g,
    "actionError(ACTION_ERRORS.MISSING_SCHOOL)",
  ],
  [/error:\s*"School not found"/g, "actionError(ACTION_ERRORS.MISSING_SCHOOL)"],
  [
    /error:\s*"No school context"/g,
    "actionError(ACTION_ERRORS.MISSING_SCHOOL)",
  ],
  [/error:\s*"Unauthorized"/g, "actionError(ACTION_ERRORS.UNAUTHORIZED)"],
  [/error:\s*"Not authorized"/g, "actionError(ACTION_ERRORS.UNAUTHORIZED)"],
  [/error:\s*"Permission denied"/g, "actionError(ACTION_ERRORS.UNAUTHORIZED)"],
  [/error:\s*"Access denied"/g, "actionError(ACTION_ERRORS.UNAUTHORIZED)"],
  [
    /error:\s*"Insufficient permissions"/g,
    "actionError(ACTION_ERRORS.UNAUTHORIZED)",
  ],

  // Generic CRUD
  [/error:\s*"Not found"/g, "actionError(ACTION_ERRORS.NOT_FOUND)"],
  [/error:\s*"Record not found"/g, "actionError(ACTION_ERRORS.NOT_FOUND)"],
  [/error:\s*"Item not found"/g, "actionError(ACTION_ERRORS.NOT_FOUND)"],
  [
    /error:\s*"Validation error"/g,
    "actionError(ACTION_ERRORS.VALIDATION_ERROR)",
  ],
  [/error:\s*"Invalid input"/g, "actionError(ACTION_ERRORS.VALIDATION_ERROR)"],
  [/error:\s*"Invalid data"/g, "actionError(ACTION_ERRORS.VALIDATION_ERROR)"],
  [/error:\s*"Already exists"/g, "actionError(ACTION_ERRORS.ALREADY_EXISTS)"],
  [/error:\s*"Duplicate entry"/g, "actionError(ACTION_ERRORS.ALREADY_EXISTS)"],
  [/error:\s*"Rate limited"/g, "actionError(ACTION_ERRORS.RATE_LIMITED)"],

  // CRUD operations
  [
    /error:\s*"Failed to create[^"]*"/g,
    "actionError(ACTION_ERRORS.CREATE_FAILED)",
  ],
  [
    /error:\s*"Failed to update[^"]*"/g,
    "actionError(ACTION_ERRORS.UPDATE_FAILED)",
  ],
  [
    /error:\s*"Failed to delete[^"]*"/g,
    "actionError(ACTION_ERRORS.DELETE_FAILED)",
  ],
  [/error:\s*"Failed to save[^"]*"/g, "actionError(ACTION_ERRORS.SAVE_FAILED)"],
  [/error:\s*"Create failed"/g, "actionError(ACTION_ERRORS.CREATE_FAILED)"],
  [/error:\s*"Update failed"/g, "actionError(ACTION_ERRORS.UPDATE_FAILED)"],
  [/error:\s*"Delete failed"/g, "actionError(ACTION_ERRORS.DELETE_FAILED)"],
  [/error:\s*"Save failed"/g, "actionError(ACTION_ERRORS.SAVE_FAILED)"],

  // Feature-specific not found
  [
    /error:\s*"Student not found"/g,
    "actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)",
  ],
  [
    /error:\s*"Teacher not found"/g,
    "actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)",
  ],
  [/error:\s*"Class not found"/g, "actionError(ACTION_ERRORS.CLASS_NOT_FOUND)"],
  [
    /error:\s*"Subject not found"/g,
    "actionError(ACTION_ERRORS.SUBJECT_NOT_FOUND)",
  ],
  [
    /error:\s*"Classroom not found"/g,
    "actionError(ACTION_ERRORS.CLASSROOM_NOT_FOUND)",
  ],
  [
    /error:\s*"Parent not found"/g,
    "actionError(ACTION_ERRORS.PARENT_NOT_FOUND)",
  ],
  [
    /error:\s*"Guardian not found"/g,
    "actionError(ACTION_ERRORS.PARENT_NOT_FOUND)",
  ],
  [/error:\s*"Exam not found"/g, "actionError(ACTION_ERRORS.EXAM_NOT_FOUND)"],
  [
    /error:\s*"Question not found"/g,
    "actionError(ACTION_ERRORS.QUESTION_NOT_FOUND)",
  ],
  [
    /error:\s*"Invoice not found"/g,
    "actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)",
  ],
  [
    /error:\s*"Receipt not found"/g,
    "actionError(ACTION_ERRORS.RECEIPT_NOT_FOUND)",
  ],
  [
    /error:\s*"Assignment not found"/g,
    "actionError(ACTION_ERRORS.ASSIGNMENT_NOT_FOUND)",
  ],
  [/error:\s*"Event not found"/g, "actionError(ACTION_ERRORS.EVENT_NOT_FOUND)"],
  [
    /error:\s*"Announcement not found"/g,
    "actionError(ACTION_ERRORS.ANNOUNCEMENT_NOT_FOUND)",
  ],
  [/error:\s*"Grade not found"/g, "actionError(ACTION_ERRORS.GRADE_NOT_FOUND)"],
  [
    /error:\s*"Certificate not found"/g,
    "actionError(ACTION_ERRORS.CERTIFICATE_NOT_FOUND)",
  ],
  [
    /error:\s*"Application not found"/g,
    "actionError(ACTION_ERRORS.ADMISSION_NOT_FOUND)",
  ],
  [
    /error:\s*"Campaign not found"/g,
    "actionError(ACTION_ERRORS.ADMISSION_NOT_FOUND)",
  ],
  [
    /error:\s*"Conversation not found"/g,
    "actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)",
  ],
  [
    /error:\s*"Message not found"/g,
    "actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)",
  ],
  [
    /error:\s*"Notification not found"/g,
    "actionError(ACTION_ERRORS.NOTIFICATION_SEND_FAILED)",
  ],
  [/error:\s*"Template not found"/g, "actionError(ACTION_ERRORS.NOT_FOUND)"],
  [/error:\s*"Profile not found"/g, "actionError(ACTION_ERRORS.NOT_FOUND)"],
  [/error:\s*"User not found"/g, "actionError(ACTION_ERRORS.NOT_FOUND)"],
  [
    /error:\s*"Wallet not found"/g,
    "actionError(ACTION_ERRORS.WALLET_TRANSACTION_FAILED)",
  ],
  [/error:\s*"Account not found"/g, "actionError(ACTION_ERRORS.NOT_FOUND)"],
  [
    /error:\s*"Budget not found"/g,
    "actionError(ACTION_ERRORS.BUDGET_CREATE_FAILED)",
  ],
  [/error:\s*"Staff not found"/g, "actionError(ACTION_ERRORS.STAFF_NOT_FOUND)"],
  [
    /error:\s*"Salary not found"/g,
    "actionError(ACTION_ERRORS.SALARY_PROCESS_FAILED)",
  ],
  [
    /error:\s*"Timetable not found"/g,
    "actionError(ACTION_ERRORS.TIMETABLE_CONFLICT)",
  ],
  [
    /error:\s*"Slot not found"/g,
    "actionError(ACTION_ERRORS.TIMETABLE_CONFLICT)",
  ],

  // Feature-specific failures
  [/error:\s*"Payment failed"/g, "actionError(ACTION_ERRORS.PAYMENT_FAILED)"],
  [/error:\s*"Upload failed"/g, "actionError(ACTION_ERRORS.UPLOAD_FAILED)"],
  [/error:\s*"Export failed"/g, "actionError(ACTION_ERRORS.EXPORT_FAILED)"],
  [/error:\s*"Import failed"/g, "actionError(ACTION_ERRORS.IMPORT_FAILED)"],
  [/error:\s*"Send failed"/g, "actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)"],

  // Attendance specific
  [
    /error:\s*"Attendance not found"/g,
    "actionError(ACTION_ERRORS.ATTENDANCE_NOT_FOUND)",
  ],
  [
    /error:\s*"Attendance record not found"/g,
    "actionError(ACTION_ERRORS.ATTENDANCE_NOT_FOUND)",
  ],

  // Catch-all: any remaining "error: "Some string"" that starts with a capital letter
  // These will be mapped to UNKNOWN - but only if nothing above matched
]

// Second pass patterns for { success: false, error: ... } or { success: false as const, error: ... }
// that return the entire object (needs full-line replacement)
const RETURN_PATTERNS = [
  // return { success: false, error: "..." }
  [
    /return\s*\{\s*success:\s*false(?:\s+as\s+const)?,\s*error:\s*"Not authenticated"\s*\}/g,
    "return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)",
  ],
  [
    /return\s*\{\s*success:\s*false(?:\s+as\s+const)?,\s*error:\s*"Authentication required"\s*\}/g,
    "return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)",
  ],
  [
    /return\s*\{\s*success:\s*false(?:\s+as\s+const)?,\s*error:\s*"(?:Missing school context|School context not found|School not found|No school context)"\s*\}/g,
    "return actionError(ACTION_ERRORS.MISSING_SCHOOL)",
  ],
  [
    /return\s*\{\s*success:\s*false(?:\s+as\s+const)?,\s*error:\s*"(?:Unauthorized|Not authorized|Permission denied|Access denied|Insufficient permissions)"\s*\}/g,
    "return actionError(ACTION_ERRORS.UNAUTHORIZED)",
  ],
  [
    /return\s*\{\s*success:\s*false(?:\s+as\s+const)?,\s*error:\s*"(?:Not found|Record not found|Item not found)"\s*\}/g,
    "return actionError(ACTION_ERRORS.NOT_FOUND)",
  ],
  [
    /return\s*\{\s*success:\s*false(?:\s+as\s+const)?,\s*error:\s*"(?:Validation error|Invalid input|Invalid data)"\s*\}/g,
    "return actionError(ACTION_ERRORS.VALIDATION_ERROR)",
  ],
  [
    /return\s*\{\s*success:\s*false(?:\s+as\s+const)?,\s*error:\s*"(?:Already exists|Duplicate entry)"\s*\}/g,
    "return actionError(ACTION_ERRORS.ALREADY_EXISTS)",
  ],
]

function findActionFiles(dir) {
  const results = []
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        results.push(...findActionFiles(full))
      } else if (entry === "actions.ts") {
        results.push(full)
      }
    }
  } catch {
    // Skip inaccessible directories
  }
  return results
}

function migrateFile(filePath) {
  let content = readFileSync(filePath, "utf-8")
  const original = content

  // Check if file has any hardcoded error strings
  if (!content.match(/error:\s*"[A-Z]/)) {
    return { changed: false, reason: "no hardcoded errors" }
  }

  // Add import if missing
  if (!content.includes("actionError") || !content.includes("ACTION_ERRORS")) {
    // Find the last import line
    const lines = content.split("\n")
    let lastImportIdx = -1
    for (let i = 0; i < lines.length; i++) {
      if (
        lines[i].startsWith("import ") ||
        lines[i].startsWith("} from ") ||
        lines[i].match(/^\s*\} from "/)
      ) {
        lastImportIdx = i
      }
    }

    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, IMPORT_LINE)
      content = lines.join("\n")
    }
  }

  // Apply full return-statement replacements first
  for (const [pattern, replacement] of RETURN_PATTERNS) {
    content = content.replace(pattern, replacement)
  }

  // Apply error field replacements
  for (const [pattern, replacement] of ERROR_MAP) {
    content = content.replace(pattern, replacement)
  }

  // Handle remaining { success: false as const, error: "..." } patterns
  // Match: return { success: false as const, error: "..." }
  content = content.replace(
    /return\s*\{\s*success:\s*false\s+as\s+const,\s*error:\s*"([^"]+)"\s*\}/g,
    (match, errorMsg) => {
      // Try to determine the best error code from the message
      const code = guessErrorCode(errorMsg, filePath)
      return `return actionError(ACTION_ERRORS.${code})`
    }
  )

  // Handle: return { success: false, error: "..." }
  content = content.replace(
    /return\s*\{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*\}/g,
    (match, errorMsg) => {
      const code = guessErrorCode(errorMsg, filePath)
      return `return actionError(ACTION_ERRORS.${code})`
    }
  )

  // Handle: { error: "..." } (without success field, common in catch blocks)
  // Only if it's clearly an error return pattern
  content = content.replace(
    /return\s*\{\s*error:\s*"([^"]+)"\s*\}/g,
    (match, errorMsg) => {
      const code = guessErrorCode(errorMsg, filePath)
      return `return actionError(ACTION_ERRORS.${code})`
    }
  )

  if (content === original) {
    return { changed: false, reason: "no patterns matched" }
  }

  writeFileSync(filePath, content, "utf-8")
  return { changed: true }
}

function guessErrorCode(message, filePath) {
  const msg = message.toLowerCase()
  const path = filePath.toLowerCase()

  // Auth
  if (msg.includes("not authenticated") || msg.includes("authentication"))
    return "NOT_AUTHENTICATED"
  if (
    msg.includes("school context") ||
    msg.includes("school not found") ||
    msg.includes("missing school")
  )
    return "MISSING_SCHOOL"
  if (
    msg.includes("unauthorized") ||
    msg.includes("permission") ||
    msg.includes("access denied")
  )
    return "UNAUTHORIZED"

  // Not found patterns
  if (msg.includes("student not found")) return "STUDENT_NOT_FOUND"
  if (msg.includes("teacher not found")) return "TEACHER_NOT_FOUND"
  if (msg.includes("class not found")) return "CLASS_NOT_FOUND"
  if (msg.includes("subject not found")) return "SUBJECT_NOT_FOUND"
  if (msg.includes("classroom not found")) return "CLASSROOM_NOT_FOUND"
  if (msg.includes("parent not found") || msg.includes("guardian not found"))
    return "PARENT_NOT_FOUND"
  if (msg.includes("exam not found")) return "EXAM_NOT_FOUND"
  if (msg.includes("question not found")) return "QUESTION_NOT_FOUND"
  if (msg.includes("invoice not found")) return "INVOICE_NOT_FOUND"
  if (msg.includes("receipt not found")) return "RECEIPT_NOT_FOUND"
  if (msg.includes("attendance") && msg.includes("not found"))
    return "ATTENDANCE_NOT_FOUND"
  if (msg.includes("not found")) return "NOT_FOUND"

  // Create/Update/Delete failures
  if (
    msg.includes("failed to create") ||
    msg.includes("create failed") ||
    msg.includes("creation failed")
  )
    return "CREATE_FAILED"
  if (msg.includes("failed to update") || msg.includes("update failed"))
    return "UPDATE_FAILED"
  if (
    msg.includes("failed to delete") ||
    msg.includes("delete failed") ||
    msg.includes("deletion failed")
  )
    return "DELETE_FAILED"
  if (msg.includes("failed to save") || msg.includes("save failed"))
    return "SAVE_FAILED"

  // Feature-specific from path
  if (path.includes("attendance")) {
    if (msg.includes("mark") || msg.includes("record"))
      return "ATTENDANCE_MARK_FAILED"
    return "ATTENDANCE_MARK_FAILED"
  }
  if (
    path.includes("exam") ||
    path.includes("quiz") ||
    path.includes("qbank")
  ) {
    if (msg.includes("create")) return "EXAM_CREATE_FAILED"
    if (msg.includes("update") || msg.includes("save"))
      return "EXAM_UPDATE_FAILED"
    if (msg.includes("delete")) return "EXAM_DELETE_FAILED"
    return "EXAM_UPDATE_FAILED"
  }
  if (
    path.includes("finance") ||
    path.includes("fee") ||
    path.includes("payment")
  ) {
    if (msg.includes("payment")) return "PAYMENT_FAILED"
    if (msg.includes("invoice")) return "INVOICE_CREATE_FAILED"
    return "PAYMENT_FAILED"
  }
  if (path.includes("admission")) return "ADMISSION_UPDATE_FAILED"
  if (path.includes("timetable")) return "TIMETABLE_CONFLICT"
  if (path.includes("messaging") || path.includes("message"))
    return "MESSAGE_SEND_FAILED"
  if (path.includes("notification")) return "NOTIFICATION_SEND_FAILED"

  // Upload/Export/Import
  if (msg.includes("upload")) return "UPLOAD_FAILED"
  if (msg.includes("export")) return "EXPORT_FAILED"
  if (msg.includes("import")) return "IMPORT_FAILED"

  // Generic failure from message content
  if (msg.includes("failed") || msg.includes("error") || msg.includes("unable"))
    return "SAVE_FAILED"
  if (msg.includes("invalid")) return "VALIDATION_ERROR"
  if (
    msg.includes("already") ||
    msg.includes("duplicate") ||
    msg.includes("exists")
  )
    return "ALREADY_EXISTS"

  return "UNKNOWN"
}

// Main
const files = findActionFiles(BASE)
let migrated = 0
let skipped = 0
let errors = 0

for (const file of files) {
  try {
    const result = migrateFile(file)
    if (result.changed) {
      migrated++
      console.log(`✓ ${relative(".", file)}`)
    } else {
      skipped++
    }
  } catch (err) {
    errors++
    console.error(`✗ ${relative(".", file)}: ${err.message}`)
  }
}

console.log(
  `\nDone: ${migrated} migrated, ${skipped} skipped, ${errors} errors`
)
console.log(`Total files scanned: ${files.length}`)
