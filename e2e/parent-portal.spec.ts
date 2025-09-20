import { test, expect } from '@playwright/test';

test.describe('Parent Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as parent
    await page.goto('/en/login');
    await page.fill('input[name="email"]', 'parent@school.edu');
    await page.fill('input[name="password"]', 'ParentPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/parent/dashboard');
  });

  test('should display parent dashboard with student information', async ({ page }) => {
    // Verify parent dashboard elements
    await expect(page.locator('h1:has-text("Parent Dashboard")')).toBeVisible();

    // Check for student cards
    const studentCards = page.locator('[data-testid="student-card"]');
    await expect(studentCards).toHaveCount(2); // Assuming parent has 2 children

    // Verify student information is displayed
    const firstStudent = studentCards.first();
    await expect(firstStudent.locator('[data-testid="student-name"]')).toBeVisible();
    await expect(firstStudent.locator('[data-testid="student-class"]')).toBeVisible();
    await expect(firstStudent.locator('[data-testid="student-id"]')).toBeVisible();
  });

  test('should view student attendance', async ({ page }) => {
    // Navigate to attendance view
    await page.click('[data-testid="student-card"]:first-child');
    await page.click('text=View Attendance');

    // Wait for attendance data to load
    await page.waitForSelector('[data-testid="attendance-calendar"]');

    // Verify attendance statistics
    await expect(page.locator('[data-testid="attendance-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-present"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-absent"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-late"]')).toBeVisible();

    // Switch to list view
    await page.click('button:has-text("List View")');
    await expect(page.locator('[data-testid="attendance-list"]')).toBeVisible();
  });

  test('should view announcements filtered by student classes', async ({ page }) => {
    // Navigate to announcements
    await page.goto('/en/parent/announcements');

    // Verify announcements are loaded
    await page.waitForSelector('[data-testid="announcement-item"]');

    // Check that announcements are filtered
    const announcements = page.locator('[data-testid="announcement-item"]');
    const count = await announcements.count();

    for (let i = 0; i < count; i++) {
      const announcement = announcements.nth(i);
      const scope = await announcement.locator('[data-testid="announcement-scope"]').textContent();

      // Should be either school-wide or for student's class
      expect(['School-wide', 'Grade 10A', 'Grade 8B']).toContain(scope);
    }
  });

  test('should export student attendance report', async ({ page }) => {
    // Navigate to student attendance
    await page.click('[data-testid="student-card"]:first-child');
    await page.click('text=View Attendance');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Report")');

    // Select PDF format
    await page.click('text=PDF');

    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('attendance');
    expect(download.suggestedFilename()).toMatch(/\.(pdf|csv)$/);
  });

  test('should switch between multiple children', async ({ page }) => {
    // Select first child
    await page.click('[data-testid="student-selector"]');
    await page.click('text=John Doe - Grade 10A');

    // Verify first child's data is displayed
    await expect(page.locator('[data-testid="selected-student-name"]')).toContainText('John Doe');

    // Switch to second child
    await page.click('[data-testid="student-selector"]');
    await page.click('text=Jane Doe - Grade 8B');

    // Verify second child's data is displayed
    await expect(page.locator('[data-testid="selected-student-name"]')).toContainText('Jane Doe');

    // Verify data changes when switching students
    const attendanceRate = await page.locator('[data-testid="attendance-rate"]').textContent();
    expect(attendanceRate).toBeTruthy();
  });

  test('should not have access to edit functionality', async ({ page }) => {
    // Navigate to student details
    await page.click('[data-testid="student-card"]:first-child');

    // Verify no edit buttons are present
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Add")')).not.toBeVisible();

    // Try to navigate to admin pages directly
    await page.goto('/en/s/school/students/edit');

    // Should be redirected or show access denied
    await expect(page).toHaveURL(/.*parent.*/);
  });
});