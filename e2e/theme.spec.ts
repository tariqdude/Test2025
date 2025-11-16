import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test('should toggle between light and dark themes', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.locator('#theme-toggle').first();
    await expect(themeToggle).toBeVisible();

    // Get initial theme
    const htmlElement = page.locator('html');
    const initialClass = await htmlElement.getAttribute('class');

    // Toggle theme
    await themeToggle.click();
    await page.waitForTimeout(300); // Wait for transition

    // Check theme changed
    const newClass = await htmlElement.getAttribute('class');
    expect(newClass).not.toBe(initialClass);
  });

  test('should persist theme preference', async ({ page, context }) => {
    await page.goto('/');

    // Set theme
    const themeToggle = page.locator('#theme-toggle').first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    const theme = await page.locator('html').getAttribute('class');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check theme persisted
    const persistedTheme = await page.locator('html').getAttribute('class');
    expect(persistedTheme).toBe(theme);
  });
});
