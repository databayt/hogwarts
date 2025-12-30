/**
 * Seed Utilities
 * Helper functions for the seed system
 */

import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

// ============================================================================
// PASSWORD HASHING
// ============================================================================

let cachedPasswordHash: string | null = null

/**
 * Get cached password hash for "1234"
 * Caches to avoid repeated bcrypt calls
 */
export async function getPasswordHash(): Promise<string> {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await bcrypt.hash("1234", 10)
  }
  return cachedPasswordHash
}

// ============================================================================
// CONSOLE LOGGING (Bilingual)
// ============================================================================

const PHASE_ICONS = [
  "🏗️",
  "📚",
  "👥",
  "📖",
  "🎬",
  "📚",
  "📢",
  "📝",
  "💰",
  "💳",
  "🏦",
  "📊",
]

/**
 * Log phase header
 */
export function logPhase(
  phase: number,
  titleEn: string,
  titleAr: string
): void {
  const icon = PHASE_ICONS[phase - 1] || "📌"
  console.log(`\n${icon} PHASE ${phase}: ${titleEn}`)
  console.log(`   ${titleAr}`)
  console.log("-".repeat(50))
}

/**
 * Log success with count
 */
export function logSuccess(
  entity: string,
  count: number,
  details?: string
): void {
  const countStr = String(count).padStart(4, " ")
  console.log(`   ✅ ${entity}: ${countStr}${details ? ` (${details})` : ""}`)
}

/**
 * Log warning
 */
export function logWarning(message: string): void {
  console.log(`   ⚠️  ${message}`)
}

/**
 * Log error
 */
export function logError(message: string, error?: Error): void {
  console.log(`   ❌ ERROR: ${message}`)
  if (error) console.log(`      ${error.message}`)
}

/**
 * Log skipped (already exists)
 */
export function logSkipped(entity: string, identifier: string): void {
  console.log(`   ⏭️  ${entity} "${identifier}" already exists, skipped`)
}

/**
 * Log header for seed execution
 */
export function logHeader(): void {
  console.log("\n" + "=".repeat(60))
  console.log("  🏫 HOGWARTS ACADEMY - SEED SYSTEM")
  console.log("  🏫 أكاديمية هوجورتس - نظام البيانات التجريبية")
  console.log("=".repeat(60))
  console.log(`\n📅 Date: ${new Date().toLocaleDateString()}`)
  console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`)
}

/**
 * Measure duration of async operation
 */
export async function measureDuration<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  const result = await operation()
  const duration = ((Date.now() - start) / 1000).toFixed(2)
  console.log(`   ⏱️  ${label}: ${duration}s`)
  return result
}

/**
 * Log duration
 */
export function logDuration(label: string, startTime: number): void {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`   ⏱️  ${label}: ${duration}s`)
}

/**
 * Log final summary
 */
export function logSummary(
  startTime: number,
  stats: Record<string, number>
): void {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)

  console.log("\n" + "=".repeat(60))
  console.log("  ✅ SEED COMPLETED SUCCESSFULLY")
  console.log("  ✅ تم إنشاء البيانات التجريبية بنجاح")
  console.log("=".repeat(60))
  console.log("\n📊 Data Summary | ملخص البيانات:")
  console.log("┌─────────────────────────────────────────────┐")

  for (const [entity, count] of Object.entries(stats)) {
    const paddedEntity = entity.padEnd(25, " ")
    const paddedCount = String(count).padStart(8, " ")
    console.log(`│ ${paddedEntity} │ ${paddedCount} │`)
  }

  console.log("└─────────────────────────────────────────────┘")
  console.log(`\n⏱️  Total Time: ${elapsed}s`)
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Check if error is a unique constraint violation
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
}

/**
 * Check if error is a foreign key constraint violation
 */
export function isForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  )
}

/**
 * Safe execution wrapper - logs errors but doesn't throw
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  entityName: string,
  identifier: string
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      logSkipped(entityName, identifier)
      return null
    }
    if (isForeignKeyError(error)) {
      logError(
        `${entityName} "${identifier}" missing dependency`,
        error as Error
      )
      return null
    }
    throw error
  }
}

// ============================================================================
// EMAIL GENERATORS
// ============================================================================

const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]

/**
 * Generate personal email
 */
export function generatePersonalEmail(
  givenName: string,
  surname: string,
  index: number
): string {
  const domain = EMAIL_DOMAINS[index % EMAIL_DOMAINS.length]
  const cleanGivenName = givenName.toLowerCase().replace(/[^a-z]/g, "")
  const cleanSurname = surname.toLowerCase().replace(/[^a-z]/g, "")
  return `${cleanGivenName}.${cleanSurname}${index > 0 ? index : ""}@${domain}`
}

/**
 * Generate school email
 */
export function generateSchoolEmail(
  role: "teacher" | "student" | "parent" | "admin",
  index: number
): string {
  if (index === 0) {
    return `${role}@databayt.org`
  }
  return `${role}${index}@databayt.org`
}

// ============================================================================
// PHONE GENERATORS
// ============================================================================

/**
 * Generate Sudanese phone number
 */
export function generatePhone(index: number): string {
  const prefix = ["091", "092", "093", "099"][index % 4]
  const number = String(1000000 + ((index * 7919) % 9000000)).padStart(7, "0")
  return `${prefix}${number}`
}

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Get current school year dates
 */
export function getSchoolYearDates(): {
  start: Date
  end: Date
  yearName: string
} {
  const now = new Date()
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return {
    start: new Date(year, 8, 1), // September 1
    end: new Date(year + 1, 5, 30), // June 30
    yearName: `${year}-${year + 1}`,
  }
}

/**
 * Get term dates
 */
export function getTermDates(yearStart: Date): {
  term1: { start: Date; end: Date }
  term2: { start: Date; end: Date }
} {
  const year = yearStart.getFullYear()
  return {
    term1: {
      start: new Date(year, 8, 1), // September 1
      end: new Date(year, 11, 20), // December 20
    },
    term2: {
      start: new Date(year + 1, 0, 10), // January 10
      end: new Date(year + 1, 5, 30), // June 30
    },
  }
}

/**
 * Get random date in range
 */
export function getRandomDate(start: Date, end: Date): Date {
  const startTime = start.getTime()
  const endTime = end.getTime()
  const randomTime = startTime + Math.random() * (endTime - startTime)
  return new Date(randomTime)
}

/**
 * Get working days in range (Sun-Thu for Sudan)
 */
export function getWorkingDays(start: Date, end: Date, limit?: number): Date[] {
  const days: Date[] = []
  const current = new Date(start)

  while (current <= end && (!limit || days.length < limit)) {
    const dayOfWeek = current.getDay()
    // Sunday = 0, Monday = 1, ..., Thursday = 4
    if (dayOfWeek >= 0 && dayOfWeek <= 4) {
      days.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }

  return days
}

// ============================================================================
// ID GENERATORS
// ============================================================================

/**
 * Generate student GR number
 */
export function generateGrNumber(index: number): string {
  return `GR${String(index + 1).padStart(4, "0")}`
}

/**
 * Generate employee ID
 */
export function generateEmployeeId(index: number): string {
  return `EMP${String(index + 1).padStart(4, "0")}`
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(index: number, year: number): string {
  return `INV-${year}-${String(index + 1).padStart(5, "0")}`
}

/**
 * Generate receipt number
 */
export function generateReceiptNumber(index: number, year: number): string {
  return `RCP-${year}-${String(index + 1).padStart(5, "0")}`
}

// ============================================================================
// RANDOM HELPERS
// ============================================================================

/**
 * Get random element from array
 */
export function randomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Get random number in range
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Get random percentage (0-100)
 */
export function randomPercentage(): number {
  return Math.floor(Math.random() * 101)
}

/**
 * Get random score based on grade distribution
 * Returns score weighted toward passing grades
 */
export function getRandomScore(maxScore: number): number {
  // Weight distribution: 10% fail, 20% D, 30% C, 25% B, 15% A
  const rand = Math.random()
  let percentage: number

  if (rand < 0.1) {
    percentage = randomNumber(30, 59) // Fail
  } else if (rand < 0.3) {
    percentage = randomNumber(60, 69) // D
  } else if (rand < 0.6) {
    percentage = randomNumber(70, 79) // C
  } else if (rand < 0.85) {
    percentage = randomNumber(80, 89) // B
  } else {
    percentage = randomNumber(90, 100) // A
  }

  return Math.round((percentage / 100) * maxScore)
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process items in batches
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((item, batchIndex) => processor(item, i + batchIndex))
    )
    results.push(...batchResults)
  }

  return results
}

// ============================================================================
// SLUGIFY
// ============================================================================

/**
 * Convert string to slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// ============================================================================
// TIME HELPERS
// ============================================================================

/**
 * Parse time string (HH:MM) to Date
 */
export function parseTime(timeStr: string, baseDate: Date = new Date()): Date {
  const [hours, minutes] = timeStr.split(":").map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
