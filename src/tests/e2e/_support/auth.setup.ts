import { expect, test as setup } from "@playwright/test"

const TEST_USERS = {
  admin: {
    email: "admin@databayt.org",
    password: "1234",
  },
  teacher: {
    email: "teacher@databayt.org",
    password: "1234",
  },
  student: {
    email: "student@databayt.org",
    password: "1234",
  },
  developer: {
    email: "dev@databayt.org",
    password: "1234",
  },
  guardian: {
    email: "parent@databayt.org",
    password: "1234",
  },
  accountant: {
    email: "accountant@databayt.org",
    password: "1234",
  },
  staff: {
    email: "staff@databayt.org",
    password: "1234",
  },
} as const

for (const [role, credentials] of Object.entries(TEST_USERS)) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await page.goto("/en/login", { timeout: 30_000 })

    // Wait for React to fully hydrate — the login button must be interactive
    await page.waitForLoadState("load")
    const loginButton = page.getByRole("button", {
      name: /sign in|login|log in/i,
    })
    await loginButton.waitFor({ state: "visible", timeout: 15_000 })

    // Ensure React hydration is complete by waiting for the button to respond
    // to focus events (a proxy for event handlers being attached)
    await page.waitForTimeout(1_000)

    // Fill credentials using fill() — works with React controlled inputs
    // after hydration is complete
    const emailInput = page.locator('input[name="email"]')
    await emailInput.fill(credentials.email)
    await expect(emailInput).toHaveValue(credentials.email, { timeout: 5_000 })

    await page.locator('input[name="password"]').fill(credentials.password)

    // Submit
    await loginButton.click()

    // Wait for navigation away from login page
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })

    // Save storage state for reuse
    await page.context().storageState({ path: `playwright/.auth/${role}.json` })
  })
}
