import { test, expect } from '@playwright/test';

test.describe('client App', () => {
  test('should display greeting heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Greeting');
  });
});
