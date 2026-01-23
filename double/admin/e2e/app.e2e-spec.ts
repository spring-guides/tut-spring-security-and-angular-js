import { test, expect } from '@playwright/test';

test.describe('client App', () => {
  test('should display admin heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Admin');
  });
});
