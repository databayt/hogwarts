/**
 * Lifecycle State Management
 *
 * Persists shared state across sequential lifecycle test files.
 * State is stored as JSON at playwright/.lifecycle-state.json.
 *
 * Usage:
 *   saveState({ schoolSubdomain: "test-abc" })
 *   const state = loadState()
 *   clearState() // before a fresh run
 */

import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import type { Page } from "@playwright/test"

import { LoginPage } from "../page-objects"

const STATE_FILE = path.join(
  process.cwd(),
  "playwright",
  ".lifecycle-state.json"
)

export interface LifecycleState {
  schoolId: string | null
  schoolSubdomain: string | null
  teacherIds: string[]
  studentCount: number
  teacherCount: number
  phase:
    | "reset"
    | "onboarded"
    | "provisioned"
    | "configured"
    | "expertise"
    | "timetable"
    | "attendance"
}

const DEFAULT_STATE: LifecycleState = {
  schoolId: null,
  schoolSubdomain: null,
  teacherIds: [],
  studentCount: 0,
  teacherCount: 0,
  phase: "reset",
}

/**
 * Load lifecycle state from disk. Returns defaults if file doesn't exist.
 */
export function loadState(): LifecycleState {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf-8")
    return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

/**
 * Merge partial state and write to disk.
 */
export function saveState(partial: Partial<LifecycleState>): void {
  const current = loadState()
  const merged = { ...current, ...partial }
  const dir = path.dirname(STATE_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(merged, null, 2), "utf-8")
}

/**
 * Delete the state file for a fresh run.
 */
export function clearState(): void {
  try {
    fs.unlinkSync(STATE_FILE)
  } catch {
    // File doesn't exist, that's fine
  }
}

/**
 * Resolve the actual school subdomain (domain) from DB using schoolId.
 * Falls back to the state file value if the query fails.
 */
export function resolveSubdomain(schoolId: string): string | null {
  try {
    const script = [
      "const { PrismaClient } = require('@prisma/client');",
      "const db = new PrismaClient();",
      "const id = process.env.__SCHOOL_ID__;",
      "db.school.findUnique({ where: { id }, select: { domain: true } })",
      "  .then(s => { console.log(s?.domain || ''); process.exit(0); })",
      "  .catch(() => process.exit(1));",
    ].join(" ")
    const result = execSync(`node -e "${script}"`, {
      cwd: process.cwd(),
      encoding: "utf-8",
      timeout: 15_000,
      env: { ...process.env, __SCHOOL_ID__: schoolId },
    }).trim()
    return result || null
  } catch {
    return loadState().schoolSubdomain
  }
}

// ============================================================================
// SHARED LOGIN HELPERS
// ============================================================================

/**
 * Login as the lifecycle test user. Returns false if chrome-error detected.
 * Waits for session to be fully established before returning.
 */
export async function loginAsLifecycleUser(page: Page): Promise<boolean> {
  await page.context().clearCookies()
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login("user@databayt.org", "1234")

  if (page.url().startsWith("chrome-error://")) {
    return false
  }

  // Wait for session cookie to be fully established after login redirect
  await page.waitForLoadState("domcontentloaded")
  await page.waitForTimeout(2000)
  return true
}

/**
 * Login and navigate to a school dashboard path.
 */
export async function loginAndNavigateLifecycle(
  page: Page,
  subdomain: string,
  dashboardPath: string
): Promise<boolean> {
  const ok = await loginAsLifecycleUser(page)
  if (!ok) return false

  await page.goto(`http://localhost:3000/en/s/${subdomain}${dashboardPath}`)
  await page.waitForLoadState("domcontentloaded")
  await page.waitForTimeout(3000)
  return true
}
