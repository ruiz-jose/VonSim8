import { test, expect } from '@playwright/test';

test.describe('VonSim8 Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    // Verificar que la página carga correctamente
    await expect(page).toHaveTitle(/VonSim/);
    // Verificar que hay un header
    const header = page.locator('[data-testid="header"]');
    await expect(header).toBeVisible();
  });

  test('should have main layout components', async ({ page }) => {
    // Verificar que están presentes los componentes principales
    const appContainer = page.locator('[data-testid="app-container"]');
    await expect(appContainer).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test básico de responsividad
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });
});
