import { test, expect } from '@playwright/test';

test.describe('Attendance Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher
    await page.goto('/en/login');
    await page.fill('input[name="email"]', 'teacher@school.edu');
    await page.fill('input[name="password"]', 'TeacherPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should mark attendance for a class', async ({ page }) => {
    // Navigate to attendance
    await page.goto('/en/s/school/attendance');

    // Select class
    await page.selectOption('select[name="classId"]', { label: 'Grade 10A' });

    // Select date (today)
    await page.click('button[aria-label="Select date"]');
    await page.click('button[aria-label="Today"]');

    // Mark students
    const students = page.locator('[data-testid="student-row"]');
    const studentCount = await students.count();

    for (let i = 0; i < Math.min(studentCount, 3); i++) {
      const student = students.nth(i);

      // Mark first student present
      if (i === 0) {
        await student.locator('button[aria-label="Present"]').click();
      }
      // Mark second student absent
      else if (i === 1) {
        await student.locator('button[aria-label="Absent"]').click();
      }
      // Mark third student late
      else if (i === 2) {
        await student.locator('button[aria-label="Late"]').click();
      }
    }

    // Save attendance
    await page.click('button:has-text("Save Attendance")');

    // Verify success message
    await expect(page.locator('text=Attendance saved successfully')).toBeVisible();
  });

  test('should use keyboard shortcuts for quick marking', async ({ page }) => {
    await page.goto('/en/s/school/attendance');

    // Select class
    await page.selectOption('select[name="classId"]', { label: 'Grade 10A' });

    // Focus on first student row
    const firstStudent = page.locator('[data-testid="student-row"]').first();
    await firstStudent.click();

    // Use keyboard shortcuts
    await page.keyboard.press('p'); // Present
    await page.keyboard.press('ArrowDown'); // Move to next student
    await page.keyboard.press('a'); // Absent
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('l'); // Late

    // Save
    await page.keyboard.press('Control+s');

    // Verify
    await expect(page.locator('text=Attendance saved successfully')).toBeVisible();
  });

  test('should generate attendance report', async ({ page }) => {
    await page.goto('/en/s/school/attendance/reports');

    // Select class
    await page.selectOption('select[name="classId"]', { label: 'Grade 10A' });

    // Select date range
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-01-31');

    // Generate report
    await page.click('button:has-text("Generate Report")');

    // Wait for report to load
    await page.waitForSelector('[data-testid="attendance-report"]');

    // Verify report contains data
    await expect(page.locator('[data-testid="attendance-stats"]')).toBeVisible();
    await expect(page.locator('text=Present')).toBeVisible();
    await expect(page.locator('text=Absent')).toBeVisible();
    await expect(page.locator('text=Late')).toBeVisible();
  });

  test('should export attendance to CSV', async ({ page }) => {
    await page.goto('/en/s/school/attendance/reports');

    // Select class
    await page.selectOption('select[name="classId"]', { label: 'Grade 10A' });

    // Click export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export CSV")');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('attendance');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});