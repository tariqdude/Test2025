import { test, expect } from '@playwright/test';

test.describe('Landing Page Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the high-trust static ops chip', async ({ page }) => {
    const chip = page.locator('text=High-trust static ops');
    await expect(chip).toBeVisible();
  });

  test('should render the hero headline with correct H1 tag', async ({
    page,
  }) => {
    const heading = page.locator('h1');
    await expect(heading).toContainText(
      'Static intelligence for decisive operators'
    );
  });

  test('should stack layout on mobile viewports', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if the grid columns are stacked
    // The grid is defined as: grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]
    // On mobile (default), it should be 1 column.

    // We locate the containers for the two main sections
    const heroSection = page
      .locator('text=High-trust static ops')
      .locator('xpath=..');
    const signalGrid = page
      .locator('text=Confidence indicators')
      .locator('xpath=..');

    const heroBox = await heroSection.boundingBox();
    const signalBox = await signalGrid.boundingBox();

    if (heroBox && signalBox) {
      // In a stacked layout, the hero section should be above the signal grid
      expect(heroBox.y + heroBox.height).toBeLessThanOrEqual(signalBox.y + 100); // Allow some margin/gap

      // They should have similar widths (taking up full width)
      // expect(heroBox.width).toBeCloseTo(signalBox.width, -1);
    }
  });
});
