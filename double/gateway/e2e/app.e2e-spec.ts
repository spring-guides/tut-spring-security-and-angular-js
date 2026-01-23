import { test, expect } from '@playwright/test';

test.describe('client App', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });
});
