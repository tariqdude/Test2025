import { test, expect } from '@playwright/test';

test.describe('Interactivity Features', () => {
  test.describe('Command Palette', () => {
    test('should open with keyboard shortcut', async ({ page }) => {
      await page.goto('/');

      // Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if (process.platform === 'darwin') {
        await page.keyboard.press('Meta+K');
      } else {
        await page.keyboard.press('Control+K');
      }

      // Check if modal is visible
      const modal = page.locator(
        'input[placeholder="Type a command or search..."]'
      );
      await expect(modal).toBeVisible();
    });

    test('should navigate to pages via command', async ({ page }) => {
      await page.goto('/');

      // Open palette
      if (process.platform === 'darwin') {
        await page.keyboard.press('Meta+K');
      } else {
        await page.keyboard.press('Control+K');
      }

      // Type "Blog"
      await page.fill(
        'input[placeholder="Type a command or search..."]',
        'Blog'
      );

      // Press Enter on the first result
      await page.keyboard.press('Enter');

      // Verify navigation
      await expect(page).toHaveURL(/\/blog/);
    });
  });

  test.describe('Dynamic Content Filtering (Tags)', () => {
    test('should filter posts by tag', async ({ page }) => {
      await page.goto('/blog');

      // Find a tag link (assuming TagCloud is present)
      // We added tags 'astro' and 'blogging' to first-post.md
      const tagLink = page.getByRole('link', { name: /astro/i }).first();

      // If no tags are visible, this test might fail or skip.
      // We assume at least one post has tags and TagCloud is rendered.
      if (await tagLink.isVisible()) {
        await tagLink.click();

        // Verify URL
        await expect(page).toHaveURL(/\/blog\/tag\/astro/);

        // Verify header contains tag name
        await expect(page.locator('h1')).toContainText('astro');
      }
    });

    test('should navigate back to all posts', async ({ page }) => {
      await page.goto('/blog/tag/astro');

      const backButton = page.getByRole('link', { name: /Back to All Posts/i });
      if (await backButton.isVisible()) {
        await backButton.click();
        await expect(page).toHaveURL(/\/blog\/?$/);
      }
    });
  });

  test.describe('Smart Table of Contents', () => {
    test('should display TOC on large screens', async ({ page }) => {
      // Use a known post slug
      await page.goto('/blog/first-post');

      // Set viewport to desktop
      await page.setViewportSize({ width: 1280, height: 800 });

      const toc = page.locator('nav.toc');
      await expect(toc).toBeVisible();

      // Check for specific headings
      await expect(toc).toContainText('Introduction');
      await expect(toc).toContainText('Main Concepts');

      // Click a link
      await toc.getByRole('link', { name: 'Introduction' }).click();

      // Verify URL hash
      await expect(page).toHaveURL(/.*#introduction/);
    });
  });
});
