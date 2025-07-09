import { test, expect } from '@playwright/test';

test.describe('VonSim8 Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    // Verificar que la página carga correctamente
    await expect(page).toHaveTitle(/VonSim/);
    
    // Verificar que hay un header
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should have main layout components', async ({ page }) => {
    // Verificar que están presentes los componentes principales
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test básico de responsividad
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Esperar un momento para que se cargue completamente
    await page.waitForTimeout(2000);
    
    // Verificar que no hay errores de JavaScript críticos
    expect(errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404')
    )).toHaveLength(0);
  });
});
