import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Elite Project|Static intelligence/i);
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();
    await expect(hero).toContainText(/Static intelligence/i);
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Check main nav links
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /services/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /pricing/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /demo/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /blog/i })).toBeVisible();
  });

  test('should navigate to demo page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=/Try Interactive Demo/i');
    await expect(page).toHaveURL(/.*demo/);
    await expect(page.locator('h1')).toContainText(/Demo/i);
  });
});
