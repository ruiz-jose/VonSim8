import { test, expect } from '@playwright/test';

test('la app carga y muestra el header y el footer', async ({ page }) => {
  // Asume que el servidor corre en localhost:5173 (ajusta si usas otro puerto)
  await page.goto('http://localhost:5173');

  // Verifica que el header esté visible
  await expect(page.getByTestId('header')).toBeVisible();

  // Verifica que el footer esté visible
  await expect(page.getByTestId('footer')).toBeVisible();

  // Verifica que el contenedor principal esté visible
  await expect(page.getByTestId('app-container')).toBeVisible();
});
