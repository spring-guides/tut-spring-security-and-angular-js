import { test, expect } from '@playwright/test';

test.describe('client App', () => {
  test('should display welcome message', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-root h1')).toHaveText('Welcome Demo!');
  });
});
