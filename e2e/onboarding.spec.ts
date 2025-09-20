import { test, expect } from '@playwright/test';

test.describe('School Onboarding Flow', () => {
  test('should complete full 14-step onboarding process', async ({ page }) => {
    // Start onboarding
    await page.goto('/en/onboarding');

    // Step 1: About School
    await page.waitForSelector('h3:has-text("Tell us about your school")');
    await page.fill('input[name="schoolType"]', 'Private');
    await page.click('button:has-text("Next")');

    // Step 2: Title
    await page.fill('input[name="schoolName"]', 'Test Academy');
    await page.click('button:has-text("Next")');

    // Step 3: Description
    await page.fill('textarea[name="description"]', 'A premier educational institution focused on excellence');
    await page.click('button:has-text("Next")');

    // Step 4: Location
    await page.fill('input[name="address"]', '123 Education Street');
    await page.fill('input[name="city"]', 'Khartoum');
    await page.fill('input[name="country"]', 'Sudan');
    await page.click('button:has-text("Next")');

    // Step 5: Stand Out
    await page.fill('textarea[name="uniqueFeatures"]', 'STEM focus, International curriculum');
    await page.click('button:has-text("Next")');

    // Step 6: Capacity
    await page.fill('input[name="studentCapacity"]', '500');
    await page.fill('input[name="teacherCount"]', '50');
    await page.fill('input[name="classroomCount"]', '25');
    await page.click('button:has-text("Next")');

    // Step 7: Branding
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Choose file")');
    const fileChooser = await fileChooserPromise;
    // Upload a test logo (would need actual file in real test)
    // await fileChooser.setFiles('path/to/test-logo.png');
    await page.click('button:has-text("Next")');

    // Step 8: Import
    await page.click('button:has-text("Skip")'); // Skip import for now

    // Step 9: Finish Setup
    await page.click('button:has-text("Next")');

    // Step 10: Join
    await page.click('button:has-text("Next")');

    // Step 11: Visibility
    await page.click('input[value="public"]');
    await page.click('button:has-text("Next")');

    // Step 12: Price
    await page.fill('input[name="tuitionFee"]', '5000');
    await page.click('button:has-text("Next")');

    // Step 13: Discount
    await page.fill('input[name="earlyBirdDiscount"]', '10');
    await page.click('button:has-text("Next")');

    // Step 14: Legal
    await page.check('input[name="acceptTerms"]');
    await page.click('button:has-text("Complete Setup")');

    // Verify completion
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome to your school dashboard')).toBeVisible();
  });

  test('should validate required fields in onboarding', async ({ page }) => {
    await page.goto('/en/onboarding');

    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');

    // Should show validation errors
    await expect(page.locator('text=This field is required')).toBeVisible();
  });

  test('should save progress and allow resuming onboarding', async ({ page }) => {
    await page.goto('/en/onboarding');

    // Complete first few steps
    await page.fill('input[name="schoolType"]', 'Private');
    await page.click('button:has-text("Next")');

    await page.fill('input[name="schoolName"]', 'Test Academy');
    await page.click('button:has-text("Next")');

    // Navigate away
    await page.goto('/en');

    // Return to onboarding
    await page.goto('/en/onboarding');

    // Should resume from where left off
    await expect(page.locator('input[name="description"]')).toBeVisible();
  });
});