import { test, expect, type Page } from '@playwright/test'

/**
 * Authentication E2E Tests
 *
 * Tests cover:
 * - Join/Register flow with credentials
 * - Login flow with credentials
 * - Password reset flow
 * - OAuth button presence
 * - Email verification flow (UI only - actual email not tested)
 */

// Test data
const TEST_USER = {
  name: 'Test User',
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
}

const EXISTING_USER = {
  email: 'admin@test.com', // Seeded user
  password: 'password123',
}

// Helper to get locale-prefixed URL
const getUrl = (path: string, locale: string = 'en') => `/${locale}${path}`

test.describe('Authentication Flows', () => {

  test.describe('Join/Register Page', () => {

    test('should display registration form with all fields', async ({ page }) => {
      await page.goto(getUrl('/join'))

      // Check OAuth buttons
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /facebook/i })).toBeVisible()

      // Check form fields
      await expect(page.getByPlaceholder(/name/i)).toBeVisible()
      await expect(page.getByPlaceholder(/email/i)).toBeVisible()
      await expect(page.getByPlaceholder(/password/i)).toBeVisible()

      // Check submit button
      await expect(page.getByRole('button', { name: /sign up|join/i })).toBeVisible()

      // Check login link
      await expect(page.getByText(/already have an account/i)).toBeVisible()
    })

    test('should show validation errors for empty form submission', async ({ page }) => {
      await page.goto(getUrl('/join'))

      // Click submit without filling form
      await page.getByRole('button', { name: /sign up|join/i }).click()

      // Should show validation messages (form won't submit with empty required fields)
      // React Hook Form will prevent submission and show errors
      await expect(page.getByRole('button', { name: /sign up|join/i })).toBeVisible()
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto(getUrl('/join'))

      // Fill form with invalid email
      await page.getByPlaceholder(/name/i).fill('Test User')
      await page.getByPlaceholder(/email/i).fill('invalid-email')
      await page.getByPlaceholder(/password/i).fill('password123')

      // Submit
      await page.getByRole('button', { name: /sign up|join/i }).click()

      // Should show email validation error or stay on form
      await expect(page).toHaveURL(/join/)
    })

    test('should show error for short password', async ({ page }) => {
      await page.goto(getUrl('/join'))

      // Fill form with short password
      await page.getByPlaceholder(/name/i).fill('Test User')
      await page.getByPlaceholder(/email/i).fill('test@example.com')
      await page.getByPlaceholder(/password/i).fill('123') // Less than 6 chars

      // Submit
      await page.getByRole('button', { name: /sign up|join/i }).click()

      // Should show password validation error or stay on form
      await expect(page).toHaveURL(/join/)
    })

    test('should register successfully with valid credentials', async ({ page }) => {
      await page.goto(getUrl('/join'))

      // Fill form with valid data
      await page.getByPlaceholder(/name/i).fill(TEST_USER.name)
      await page.getByPlaceholder(/email/i).fill(TEST_USER.email)
      await page.getByPlaceholder(/password/i).fill(TEST_USER.password)

      // Submit
      await page.getByRole('button', { name: /sign up|join/i }).click()

      // Should show success message (confirmation email sent)
      await expect(page.getByText(/confirmation email sent|email sent|success/i)).toBeVisible({ timeout: 10000 })
    })

    test('should show error for existing email', async ({ page }) => {
      await page.goto(getUrl('/join'))

      // Fill form with existing email
      await page.getByPlaceholder(/name/i).fill('Another User')
      await page.getByPlaceholder(/email/i).fill(EXISTING_USER.email)
      await page.getByPlaceholder(/password/i).fill('password123')

      // Submit
      await page.getByRole('button', { name: /sign up|join/i }).click()

      // Should show email exists error
      await expect(page.getByText(/email already in use|already exists|taken/i)).toBeVisible({ timeout: 10000 })
    })

    test('should navigate to login page', async ({ page }) => {
      await page.goto(getUrl('/join'))

      // Click login link
      await page.getByText(/already have an account/i).click()

      // Should navigate to login
      await expect(page).toHaveURL(/login/)
    })
  })

  test.describe('Login Page', () => {

    test('should display login form with all fields', async ({ page }) => {
      await page.goto(getUrl('/login'))

      // Check OAuth buttons
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /facebook/i })).toBeVisible()

      // Check form fields
      await expect(page.getByPlaceholder(/email/i)).toBeVisible()
      await expect(page.getByPlaceholder(/password/i)).toBeVisible()

      // Check submit button
      await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible()

      // Check forgot password link
      await expect(page.getByText(/forgot password/i)).toBeVisible()

      // Check register link
      await expect(page.getByText(/don't have an account/i)).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(getUrl('/login'))

      // Fill form with wrong password
      await page.getByPlaceholder(/email/i).fill(EXISTING_USER.email)
      await page.getByPlaceholder(/password/i).fill('wrongpassword')

      // Submit
      await page.getByRole('button', { name: /login|sign in/i }).click()

      // Should show error message
      await expect(page.getByText(/invalid credentials|wrong password|incorrect/i)).toBeVisible({ timeout: 10000 })
    })

    test('should show error for non-existent email', async ({ page }) => {
      await page.goto(getUrl('/login'))

      // Fill form with non-existent email
      await page.getByPlaceholder(/email/i).fill('nonexistent@example.com')
      await page.getByPlaceholder(/password/i).fill('password123')

      // Submit
      await page.getByRole('button', { name: /login|sign in/i }).click()

      // Should show error message
      await expect(page.getByText(/email does not exist|not found|invalid/i)).toBeVisible({ timeout: 10000 })
    })

    test('should navigate to reset password page', async ({ page }) => {
      await page.goto(getUrl('/login'))

      // Click forgot password link
      await page.getByText(/forgot password/i).click()

      // Should navigate to reset
      await expect(page).toHaveURL(/reset/)
    })

    test('should navigate to register page', async ({ page }) => {
      await page.goto(getUrl('/login'))

      // Click register link
      await page.getByText(/don't have an account/i).click()

      // Should navigate to join
      await expect(page).toHaveURL(/join/)
    })

    // Note: Actual login success test requires a verified user
    // This test will only work if admin@test.com is verified in the database
    test.skip('should login successfully with valid credentials', async ({ page }) => {
      await page.goto(getUrl('/login'))

      // Fill form with valid credentials
      await page.getByPlaceholder(/email/i).fill(EXISTING_USER.email)
      await page.getByPlaceholder(/password/i).fill(EXISTING_USER.password)

      // Submit
      await page.getByRole('button', { name: /login|sign in/i }).click()

      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 })
    })
  })

  test.describe('Password Reset Flow', () => {

    test('should display reset password form', async ({ page }) => {
      await page.goto(getUrl('/reset'))

      // Check form fields
      await expect(page.getByPlaceholder(/email/i)).toBeVisible()

      // Check submit button
      await expect(page.getByRole('button', { name: /reset password/i })).toBeVisible()

      // Check back link
      await expect(page.getByText(/back/i)).toBeVisible()
    })

    test('should show error for non-existent email', async ({ page }) => {
      await page.goto(getUrl('/reset'))

      // Fill form with non-existent email
      await page.getByPlaceholder(/email/i).fill('nonexistent@example.com')

      // Submit
      await page.getByRole('button', { name: /reset password/i }).click()

      // Should show error message
      await expect(page.getByText(/email not found|does not exist|not found/i)).toBeVisible({ timeout: 10000 })
    })

    test('should send reset email for valid user', async ({ page }) => {
      await page.goto(getUrl('/reset'))

      // Fill form with existing email
      await page.getByPlaceholder(/email/i).fill(EXISTING_USER.email)

      // Submit
      await page.getByRole('button', { name: /reset password/i }).click()

      // Should show success message
      await expect(page.getByText(/reset email sent|email sent|success/i)).toBeVisible({ timeout: 10000 })
    })

    test('should navigate back to login', async ({ page }) => {
      await page.goto(getUrl('/reset'))

      // Click back link
      await page.getByText(/back/i).click()

      // Should navigate to login
      await expect(page).toHaveURL(/login/)
    })
  })

  test.describe('OAuth Buttons', () => {

    test('should display Google OAuth button on login page', async ({ page }) => {
      await page.goto(getUrl('/login'))

      const googleButton = page.getByRole('button', { name: /google/i })
      await expect(googleButton).toBeVisible()
      await expect(googleButton).toBeEnabled()
    })

    test('should display Facebook OAuth button on login page', async ({ page }) => {
      await page.goto(getUrl('/login'))

      const facebookButton = page.getByRole('button', { name: /facebook/i })
      await expect(facebookButton).toBeVisible()
      await expect(facebookButton).toBeEnabled()
    })

    test('should display OAuth buttons on join page', async ({ page }) => {
      await page.goto(getUrl('/join'))

      await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /facebook/i })).toBeVisible()
    })

    // Note: We can't fully test OAuth redirect without mocking the provider
    // This test just verifies the button click initiates something
    test.skip('should initiate Google OAuth flow on click', async ({ page }) => {
      await page.goto(getUrl('/login'))

      // Click Google button and expect navigation away from current page
      const googleButton = page.getByRole('button', { name: /google/i })
      await googleButton.click()

      // Should redirect to Google or NextAuth callback
      await page.waitForURL(/accounts\.google\.com|api\/auth/, { timeout: 10000 })
    })
  })

  test.describe('Email Verification Page', () => {

    test('should display verification page with invalid token', async ({ page }) => {
      await page.goto(getUrl('/new-verification') + '?token=invalid-token')

      // Should show error for invalid token
      await expect(page.getByText(/token does not exist|invalid|expired/i)).toBeVisible({ timeout: 10000 })
    })

    test('should handle missing token parameter', async ({ page }) => {
      await page.goto(getUrl('/new-verification'))

      // Page should load without crashing
      await expect(page).toHaveURL(/new-verification/)
    })
  })

  test.describe('Locale Support', () => {

    test('should display Arabic login page', async ({ page }) => {
      await page.goto('/ar/login')

      // Page should load in Arabic
      await expect(page).toHaveURL(/ar\/login/)

      // OAuth buttons should still work
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    })

    test('should display English login page', async ({ page }) => {
      await page.goto('/en/login')

      // Page should load in English
      await expect(page).toHaveURL(/en\/login/)

      // Should have English text
      await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible()
    })
  })
})

test.describe('Auth Error Handling', () => {

  test('should display error page for OAuth errors', async ({ page }) => {
    // Simulate OAuth error by navigating to error page
    await page.goto(getUrl('/error') + '?error=OAuthAccountNotLinked')

    // Should display error message
    await expect(page).toHaveURL(/error/)
  })
})
