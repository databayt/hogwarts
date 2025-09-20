import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to sign in with email and password', async ({ page }) => {
    // Navigate to login page
    await page.goto('/en/login');

    // Fill in credentials
    await page.fill('input[name="email"]', 'test@school.edu');
    await page.fill('input[name="password"]', 'TestPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');

    // Verify user is logged in
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/en/login');

    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should allow user to sign out', async ({ page, context }) => {
    // First sign in
    await page.goto('/en/login');
    await page.fill('input[name="email"]', 'test@school.edu');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Sign out
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Sign out');

    // Verify redirect to home page
    await expect(page).toHaveURL('/en');
  });

  test('should enforce role-based access control', async ({ page }) => {
    // Sign in as teacher
    await page.goto('/en/login');
    await page.fill('input[name="email"]', 'teacher@school.edu');
    await page.fill('input[name="password"]', 'TeacherPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Try to access admin-only page
    await page.goto('/en/s/school/settings/billing');

    // Should be redirected or show access denied
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/en/login');

    // Click forgot password
    await page.click('text=Forgot Password?');

    // Enter email
    await page.fill('input[name="email"]', 'test@school.edu');
    await page.click('button:has-text("Send Reset Link")');

    // Verify success message
    await expect(page.locator('text=Reset link sent')).toBeVisible();
  });
});