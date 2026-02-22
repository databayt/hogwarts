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
    await page.goto("/en/login")

    // Fill in credentials
    await page.getByLabel(/email/i).fill(credentials.email)
    await page.getByLabel(/password/i).fill(credentials.password)

    // Submit
    await page.getByRole("button", { name: /sign in|login|log in/i }).click()

    // Wait for navigation away from login page
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

    // Save storage state for reuse
    await page.context().storageState({ path: `playwright/.auth/${role}.json` })
  })
}
