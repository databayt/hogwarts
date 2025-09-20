import { test, expect } from '@playwright/test';

test.describe('Multi-Tenant Isolation', () => {
  test('should isolate data between different schools', async ({ browser }) => {
    // Create two browser contexts for different schools
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login to School 1
    await page1.goto('http://school1.localhost:3000/en/login');
    await page1.fill('input[name="email"]', 'admin@school1.edu');
    await page1.fill('input[name="password"]', 'School1Pass123!');
    await page1.click('button[type="submit"]');
    await page1.waitForURL('**/dashboard');

    // Login to School 2
    await page2.goto('http://school2.localhost:3000/en/login');
    await page2.fill('input[name="email"]', 'admin@school2.edu');
    await page2.fill('input[name="password"]', 'School2Pass123!');
    await page2.click('button[type="submit"]');
    await page2.waitForURL('**/dashboard');

    // Create announcement in School 1
    await page1.goto('http://school1.localhost:3000/en/s/school1/announcements');
    await page1.click('button:has-text("New Announcement")');
    await page1.fill('input[name="title"]', 'School 1 Only Announcement');
    await page1.fill('textarea[name="content"]', 'This should only be visible in School 1');
    await page1.click('button:has-text("Publish")');

    // Try to access School 1 announcement from School 2
    await page2.goto('http://school2.localhost:3000/en/s/school2/announcements');

    // Verify School 1 announcement is NOT visible in School 2
    await expect(page2.locator('text=School 1 Only Announcement')).not.toBeVisible();

    // Verify School 2 sees only its own announcements
    const announcements = await page2.locator('[data-testid="announcement-item"]').count();
    for (let i = 0; i < announcements; i++) {
      const announcement = page2.locator('[data-testid="announcement-item"]').nth(i);
      await expect(announcement).not.toContainText('School 1');
    }

    await context1.close();
    await context2.close();
  });

  test('should prevent cross-tenant API access', async ({ page, request }) => {
    // Login to School 1
    await page.goto('http://school1.localhost:3000/en/login');
    await page.fill('input[name="email"]', 'admin@school1.edu');
    await page.fill('input[name="password"]', 'School1Pass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Get cookies from School 1 session
    const cookies = await page.context().cookies();

    // Try to access School 2 data with School 1 session
    const response = await request.get('http://school2.localhost:3000/api/students', {
      headers: {
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; ')
      }
    });

    // Should be denied or return empty
    expect(response.status()).toBe(403); // Forbidden
  });

  test('should maintain separate user sessions per subdomain', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login to School 1
    await page.goto('http://school1.localhost:3000/en/login');
    await page.fill('input[name="email"]', 'teacher@school1.edu');
    await page.fill('input[name="password"]', 'Teacher1Pass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Verify logged in to School 1
    await expect(page.locator('text=School 1')).toBeVisible();

    // Navigate to School 2 subdomain
    await page.goto('http://school2.localhost:3000/en/dashboard');

    // Should be redirected to login (not logged in to School 2)
    await expect(page).toHaveURL(/.*login/);

    await context.close();
  });

  test('should scope database queries by schoolId', async ({ page }) => {
    // Login as admin
    await page.goto('/en/login');
    await page.fill('input[name="email"]', 'admin@school.edu');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navigate to students page
    await page.goto('/en/s/school/students');

    // All students should belong to current school
    const students = page.locator('[data-testid="student-row"]');
    const studentCount = await students.count();

    for (let i = 0; i < studentCount; i++) {
      const student = students.nth(i);
      const schoolId = await student.getAttribute('data-school-id');

      // Verify all students have same schoolId
      expect(schoolId).toBeTruthy();
      if (i > 0) {
        const firstSchoolId = await students.first().getAttribute('data-school-id');
        expect(schoolId).toBe(firstSchoolId);
      }
    }
  });
});