// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { chromium, type Browser } from "playwright"

import type { ClaimedSubmission } from "./api-client.js"
import type { WorkerConfig } from "./config.js"

export interface SubmitOutcome {
  status: "SUBMITTED" | "ACCEPTED" | "REJECTED" | "FAILED"
  receiptId?: string | null
  errorCode?: string | null
  errorMessage?: string | null
}

interface EsisCreds {
  username: string
  password: string
  esisLoginUrl?: string
}

/**
 * Run a Playwright browser session against esis.adek.gov.ae:
 *   1. Log in with the supplied credentials
 *   2. Navigate to the daily-attendance upload form
 *   3. Upload the CSV
 *   4. Capture the receipt number (if shown)
 *
 * This implementation is a SCAFFOLD — selectors must be adjusted once we have
 * access to the eSIS portal (pending Aldar approval). The function is wired so
 * the worker loop is functional end-to-end; the actual DOM interactions are
 * marked with TODO comments.
 */
export async function submitToEsis(
  config: WorkerConfig,
  submission: ClaimedSubmission,
  creds: EsisCreds
): Promise<SubmitOutcome> {
  // Persist the CSV to a temp file — Playwright `setInputFiles` needs a path
  const csvPath = join(
    tmpdir(),
    `esis-${submission.schoolId}-${submission.id}.csv`
  )
  await writeFile(csvPath, submission.csv, "utf8")

  let browser: Browser | null = null
  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      locale: "en-AE",
      timezoneId: "Asia/Dubai",
    })
    const page = await context.newPage()

    const loginUrl = creds.esisLoginUrl ?? config.esisLoginUrl
    await page.goto(loginUrl, { waitUntil: "networkidle", timeout: 30_000 })

    // TODO: confirm selectors against eSIS portal once credentials land.
    // Placeholder shape — replace with the real form's `name`/`id` attrs.
    await page.fill('input[name="username"]', creds.username)
    await page.fill('input[name="password"]', creds.password)
    await page.click('button[type="submit"]')
    await page.waitForLoadState("networkidle", { timeout: 30_000 })

    // TODO: navigate to /attendance/upload route in eSIS, upload CSV
    // await page.click('a[href="/attendance/upload"]')
    // await page.setInputFiles('input[type="file"]', csvPath)
    // await page.click('button[name="submit-attendance"]')
    // await page.waitForSelector("[data-receipt-id]", { timeout: 60_000 })
    // const receiptId = await page.getAttribute("[data-receipt-id]", "data-value")

    // Until the real flow is wired, fail closed with a recognizable code so
    // the row stays auditable (no false-positive ACCEPTED).
    return {
      status: "FAILED",
      errorCode: "RPA_FLOW_NOT_IMPLEMENTED",
      errorMessage:
        "Playwright scaffold has no production selectors yet — see TODO in submit-esis.ts",
    }
  } catch (error) {
    return {
      status: "FAILED",
      errorCode: "RPA_BROWSER_ERROR",
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  } finally {
    if (browser) await browser.close().catch(() => {})
    await unlink(csvPath).catch(() => {})
  }
}
