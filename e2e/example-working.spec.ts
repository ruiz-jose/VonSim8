import { test, expect } from '@playwright/test';

test.describe('Ejemplo E2E funcional', () => {
  test('debe mostrar el header y el contenedor principal', async ({ page }) => {
    await page.goto('/');
    // Verifica que el header existe y es visible
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    // Verifica que el contenedor principal existe y es visible
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
  });
});
