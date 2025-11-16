import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to all main pages', async ({ page }) => {
    await page.goto('/');

    // About page
    await page.click('text=/about/i');
    await expect(page).toHaveURL(/.*about/);
    await expect(page.locator('h1')).toBeVisible();

    // Services page
    await page.goto('/');
    await page.click('text=/services/i');
    await expect(page).toHaveURL(/.*services/);

    // Pricing page
    await page.goto('/');
    await page.click('text=/pricing/i');
    await expect(page).toHaveURL(/.*pricing/);

    // Blog page
    await page.goto('/');
    await page.click('text=/blog/i');
    await expect(page).toHaveURL(/.*blog/);
  });

  test('should handle mobile menu', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    await page.goto('/');

    // Open mobile menu
    const menuButton = page.locator('#mobile-menu-button');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Check menu is visible
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();

    // Close menu
    await menuButton.click();
    await expect(mobileMenu).not.toBeVisible();
  });
});
