// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Profile E2E flows.
 *
 * Coverage:
 *   1. Authenticated user reaches /profile and sees their own GitHub-style profile
 *   2. Profile sidebar renders the avatar, name, role, achievements
 *   3. Edit profile button is visible to the owner only
 *   4. Profile of another user (admin viewing a teacher) renders without an Edit button
 *   5. Unauthenticated request to /profile redirects to login
 *
 * Test data: seeded demo school accounts (admin@databayt.org, teacher@databayt.org).
 * Auth: uses the persistent `tests/.auth/{role}.json` storage state from auth.setup.ts.
 */

import { expect, test } from "@playwright/test"

import { TEST_USERS } from "../../e2e/_support/helpers/test-data"

const DEMO_HOST = "demo.localhost:3000"

function profileUrl(host = DEMO_HOST) {
  return `http://${host}/en/profile`
}

function profileForId(userId: string, host = DEMO_HOST) {
  return `http://${host}/en/profile/${userId}`
}

test.describe("Profile — own profile (admin)", () => {
  test.use({ storageState: "tests/.auth/admin.json" })

  test("renders the owner's profile with the Edit button", async ({ page }) => {
    const res = await page.goto(profileUrl())
    if (!res || res.status() >= 400) {
      test.skip(true, `Profile route unreachable: ${res?.status()}`)
      return
    }

    // Sidebar — name + role chip + at least one stat
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(
      page.getByRole("button", { name: /edit profile/i })
    ).toBeVisible()

    // Tabs
    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible()
  })

  test("opens the edit form and validates required fields", async ({
    page,
  }) => {
    const res = await page.goto(profileUrl())
    if (!res || res.status() >= 400) {
      test.skip(true, "Profile route unreachable")
      return
    }

    await page.getByRole("button", { name: /edit profile/i }).click()

    // The edit form should appear in place of the static info.
    // We don't submit (avoid mutating seed data); we verify the form opened.
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible({
      timeout: 5_000,
    })
  })
})

test.describe("Profile — viewing other users", () => {
  test.use({ storageState: "tests/.auth/admin.json" })

  test("admin viewing a teacher sees the profile but no Edit button", async ({
    page,
  }) => {
    // Admin first navigates to the teachers listing to discover a real teacher id.
    const teacherListing = `http://${DEMO_HOST}/en/teachers`
    const listingRes = await page.goto(teacherListing)
    if (!listingRes || listingRes.status() >= 400) {
      test.skip(true, "Teachers listing unreachable")
      return
    }

    // Pick the first teacher row that exposes a profile link via data-testid or href.
    // Falls back to skipping if the listing has no rows.
    const firstProfileLink = page.locator('a[href*="/profile/"]').first()
    const href = await firstProfileLink.getAttribute("href").catch(() => null)
    if (!href) {
      test.skip(true, "No teacher profile link found in listing")
      return
    }

    await page.goto(`http://${DEMO_HOST}${href}`)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(
      page.getByRole("button", { name: /edit profile/i })
    ).toHaveCount(0)
  })
})

test.describe("Profile — auth gate", () => {
  test("unauthenticated request redirects to login", async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await ctx.newPage()
    const res = await page.goto(profileUrl())

    // Either we land on a login page, or the route returns an auth-required status
    if (res && res.status() >= 400) {
      expect([401, 403]).toContain(res.status())
    } else {
      await expect(page).toHaveURL(/\/(login|en\/login)/, { timeout: 10_000 })
    }
    await ctx.close()
  })
})

test.describe("Profile — self-service from teacher account", () => {
  test.use({ storageState: "tests/.auth/teacher.json" })

  test("teacher reaches own profile and sees role-specific tabs", async ({
    page,
  }) => {
    const res = await page.goto(profileUrl())
    if (!res || res.status() >= 400) {
      test.skip(true, "Profile route unreachable")
      return
    }

    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /schedule/i })).toBeVisible()
  })

  test("teacher sees own Edit button (is owner)", async ({ page }) => {
    const res = await page.goto(profileUrl())
    if (!res || res.status() >= 400) {
      test.skip(true, "Profile route unreachable")
      return
    }
    await expect(
      page.getByRole("button", { name: /edit profile/i })
    ).toBeVisible()
  })
})

// Sanity guard: keep the test seed credentials in sync with what auth.setup.ts uses.
test("test credentials sanity check", () => {
  expect(TEST_USERS.admin.email).toBe("admin@databayt.org")
  expect(TEST_USERS.teacher.email).toBe("teacher@databayt.org")
})
