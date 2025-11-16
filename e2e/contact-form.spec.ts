import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('should display contact form', async ({ page }) => {
    await page.goto('/contact/');

    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    await page.goto('/contact/');

    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /submit|send/i });
    await submitButton.click();

    // Check HTML5 validation or error messages
    const nameInput = page.getByLabel(/name/i);
    const isInvalid = await nameInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test('should accept valid form submission', async ({ page }) => {
    await page.goto('/contact/');

    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/message/i).fill('This is a test message.');

    const submitButton = page.getByRole('button', { name: /submit|send/i });
    await submitButton.click();

    // Wait for potential success message or redirect
    await page.waitForTimeout(1000);
  });
});
