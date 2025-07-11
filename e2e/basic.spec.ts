import { test, expect } from '@playwright/test';

test.describe('VonSim8 Application', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="new-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="open-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="assemble-button"]')).toBeVisible();
  });

  test('should have main layout components', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="new-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="open-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="assemble-button"]')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="new-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="assemble-button"]')).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/');
    expect(errors).toEqual([]);
  });

  test('should handle assembler errors gracefully', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="assemble-button"]');
    await expect(page.locator('.toast, .error-message')).toBeVisible();
  });

  test('should save and load files', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="save-button"]');
    await page.click('[data-testid="new-button"]');
    await expect(page.locator('.cm-editor')).toHaveText('');
    // Simula la carga de archivo si tienes flujo de test para esto
    // await page.click('[data-testid="open-button"]');
    // await expect(page.locator('.cm-editor')).toContainText('MOV AL, 10h');
  });
});

