# E2E Command - End-to-End Test Generation

Generate comprehensive E2E tests for user workflows using Playwright

## Usage

```bash
/e2e [workflow|page|feature] [options]
```

## Examples

```bash
/e2e student-enrollment           # Generate enrollment flow tests
/e2e /lab                   # Generate lab interaction tests
/e2e login --multi-tenant         # Test multi-tenant login flows
/e2e payment --all-scenarios      # Generate payment scenarios
```

## Process

### 1. Workflow Analysis

- Identify user journey steps
- Map page transitions
- Detect form interactions
- Find API calls
- Determine assertions needed

### 2. Test Generation Strategy

#### User Flow Template

```typescript
// e2e/student-enrollment.spec.ts
import { expect, test } from "@playwright/test"

import { loginAs } from "./helpers/auth"
import { fillStudentForm } from "./helpers/forms"

test.describe("Student Enrollment Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as admin
    await loginAs(page, "admin")
    await page.goto("/students")
  })

  test("should enroll new student successfully", async ({ page }) => {
    // Step 1: Navigate to enrollment
    await page.click("text=Add Student")
    await expect(page).toHaveURL("/students/new")

    // Step 2: Fill student information
    await fillStudentForm(page, {
      name: "Harry Potter",
      email: "harry@hogwarts.edu",
      dateOfBirth: "1980-07-31",
      yearLevel: "1",
      guardianEmail: "petunia@privet.com",
    })

    // Step 3: Submit and verify
    await page.click('button:has-text("Enroll Student")')

    // Wait for success message
    await expect(page.locator('[role="alert"]')).toContainText(
      "Student enrolled successfully"
    )

    // Verify redirect
    await expect(page).toHaveURL(/\/students\/[a-z0-9]+/)

    // Verify student appears in list
    await page.goto("/students")
    await expect(page.locator("text=Harry Potter")).toBeVisible()
  })

  test("should validate required fields", async ({ page }) => {
    await page.click("text=Add Student")

    // Submit empty form
    await page.click('button:has-text("Enroll Student")')

    // Check validation messages
    await expect(page.locator("text=Name is required")).toBeVisible()
    await expect(page.locator("text=Email is required")).toBeVisible()
    await expect(page.locator("text=Year level is required")).toBeVisible()
  })

  test("should handle duplicate email", async ({ page }) => {
    // Attempt to enroll with existing email
    await page.click("text=Add Student")
    await fillStudentForm(page, {
      name: "Ron Weasley",
      email: "existing@hogwarts.edu", // Already exists
      yearLevel: "1",
    })

    await page.click('button:has-text("Enroll Student")')

    // Check error message
    await expect(page.locator('[role="alert"]')).toContainText(
      "Email already registered"
    )
  })
})
```

### 3. Page Object Model

#### Generate Page Objects

```typescript
// pages/StudentPage.ts
export class StudentPage {
  constructor(private page: Page) {}

  async navigateToList() {
    await this.page.goto("/students")
  }

  async clickAddStudent() {
    await this.page.click("text=Add Student")
  }

  async fillForm(data: StudentData) {
    await this.page.fill('[name="name"]', data.name)
    await this.page.fill('[name="email"]', data.email)
    await this.page.selectOption('[name="yearLevel"]', data.yearLevel)

    if (data.guardianEmail) {
      await this.page.fill('[name="guardianEmail"]', data.guardianEmail)
    }
  }

  async submitForm() {
    await this.page.click('button[type="submit"]')
  }

  async verifyStudentInList(name: string) {
    await expect(this.page.locator(`text=${name}`)).toBeVisible()
  }

  async searchStudent(query: string) {
    await this.page.fill('[placeholder="Search students..."]', query)
    await this.page.press('[placeholder="Search students..."]', "Enter")
  }
}
```

### 4. Multi-Tenant E2E Tests

```typescript
test.describe("Multi-Tenant Student Management", () => {
  test("should isolate data between schools", async ({ browser }) => {
    // Create two contexts for different schools
    const school1Context = await browser.newContext({
      baseURL: "https://gryffindor.databayt.org",
    })
    const school2Context = await browser.newContext({
      baseURL: "https://slytherin.databayt.org",
    })

    const page1 = await school1Context.newPage()
    const page2 = await school2Context.newPage()

    // Login to both schools
    await loginAs(page1, "admin@gryffindor.edu")
    await loginAs(page2, "admin@slytherin.edu")

    // Create student in school1
    await page1.goto("/students/new")
    await fillStudentForm(page1, {
      name: "Harry Potter",
      email: "harry@student.com",
    })
    await page1.click('button:has-text("Enroll")')

    // Verify student NOT visible in school2
    await page2.goto("/students")
    await expect(page2.locator("text=Harry Potter")).not.toBeVisible()

    // Verify same email can be used in school2
    await page2.goto("/students/new")
    await fillStudentForm(page2, {
      name: "Draco Malfoy",
      email: "harry@student.com", // Same email, different school
    })
    await page2.click('button:has-text("Enroll")')
    await expect(page2.locator('[role="alert"]')).toContainText(
      "Student enrolled successfully"
    )
  })
})
```

### 5. API Integration Tests

```typescript
test.describe("API Integration", () => {
  test("should sync UI with API", async ({ page, request }) => {
    // Create student via API
    const response = await request.post("/api/students", {
      data: {
        name: "Hermione Granger",
        email: "hermione@hogwarts.edu",
        yearLevel: 1,
      },
    })

    const student = await response.json()

    // Verify student appears in UI
    await page.goto("/students")
    await expect(page.locator(`text=${student.name}`)).toBeVisible()

    // Edit via UI
    await page.click(`[data-student-id="${student.id}"] >> text=Edit`)
    await page.fill('[name="yearLevel"]', "2")
    await page.click("text=Save")

    // Verify via API
    const getResponse = await request.get(`/api/students/${student.id}`)
    const updated = await getResponse.json()
    expect(updated.yearLevel).toBe(2)
  })
})
```

### 6. Accessibility E2E Tests

```typescript
test.describe("Accessibility", () => {
  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/students")

    // Tab through interactive elements
    await page.keyboard.press("Tab")
    await expect(page.locator(":focus")).toHaveAttribute(
      "href",
      "/students/new"
    )

    await page.keyboard.press("Tab")
    await expect(page.locator(":focus")).toHaveAttribute(
      "placeholder",
      "Search students..."
    )

    // Activate with Enter
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL("/students/new")

    // Navigate form with keyboard
    await page.keyboard.press("Tab")
    await page.keyboard.type("Test Student")
    await page.keyboard.press("Tab")
    await page.keyboard.type("test@example.com")
  })

  test("should work with screen reader", async ({ page }) => {
    await page.goto("/students")

    // Check ARIA labels
    await expect(page.locator('[role="navigation"]')).toHaveAttribute(
      "aria-label",
      "Main navigation"
    )
    await expect(page.locator('[role="table"]')).toHaveAttribute(
      "aria-label",
      "Students list"
    )
    await expect(page.locator('[role="button"]')).toHaveAttribute(
      "aria-label",
      /Add new student/
    )
  })
})
```

## Test Data Management

### Fixtures

```typescript
// fixtures/students.ts
export const testStudents = {
  valid: {
    name: "Test Student",
    email: "test@example.com",
    yearLevel: "10",
  },
  invalid: {
    name: "",
    email: "invalid-email",
    yearLevel: "13", // Out of range
  },
}
```

### Database Seeding

```typescript
// helpers/seed.ts
export async function seedTestData() {
  await prisma.student.createMany({
    data: [
      { name: "Harry Potter", schoolId: "test-school" },
      { name: "Hermione Granger", schoolId: "test-school" },
      { name: "Ron Weasley", schoolId: "test-school" },
    ],
  })
}
```

### Cleanup

```typescript
test.afterEach(async () => {
  // Clean up test data
  await prisma.student.deleteMany({
    where: { email: { contains: "@test.com" } },
  })
})
```

## Configuration

### Playwright Config

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["json", { outputFile: "test-results.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
    },
  ],
})
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm build
      - run: pnpm db:seed
      - run: pnpm dev &
      - run: npx playwright install
      - run: npx playwright test

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging

### Interactive Mode

```bash
# Run tests in headed mode
npx playwright test --headed

# Debug specific test
npx playwright test --debug student-enrollment

# Use Playwright Inspector
PWDEBUG=1 npx playwright test
```

### Trace Viewer

```bash
# View trace
npx playwright show-trace trace.zip
```

## Performance Considerations

### Parallel Execution

```typescript
// Run tests in parallel
test.describe.parallel("Student Tests", () => {
  // Tests run simultaneously
})
```

### Test Isolation

```typescript
// Use separate contexts
test.describe("Isolated Tests", () => {
  test.use({ storageState: undefined }) // Fresh state
})
```

## Success Metrics

- 100% critical path coverage
- <5 min total execution time
- Zero flaky tests
- Cross-browser compatibility
- Automated on every PR

## Related Commands

- `/test`: Unit test generation
- `/snapshot`: Visual testing
- `/benchmark`: Performance testing
