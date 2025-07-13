import { test, expect } from '@playwright/test';
import { CodeMirrorHelper, NavigationHelper, AppStateHelper } from '../../utils/test-helpers';

test.describe('Funcionalidad de Simulación', () => {
  test.beforeEach(async ({ page }) => {
    await NavigationHelper.goToHome(page);
  });

  test('debería ejecutar un ciclo de simulación', async ({ page }) => {
    // Preparar programa simple
    await CodeMirrorHelper.setContent(page, 'hlt');
    
    // Ensamblar
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
    
    // Ejecutar un ciclo
    await NavigationHelper.clickButton(page, 'cycle-button');
    
    // Verificar que la simulación está activa
    await page.waitForTimeout(500);
    
    // Verificar que aparecen los controles de pausa
    await NavigationHelper.expectButtonVisible(page, 'save-button');
  });

  test('debería ejecutar una instrucción completa', async ({ page }) => {
    // Preparar programa con múltiples instrucciones
    await CodeMirrorHelper.setContent(page, `
mov al, 5
add al, 3
hlt
    `);
    
    // Ensamblar
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
    
    // Ejecutar instrucción completa
    await page.click('[data-testid="instruction-button"]');
    
    // Verificar que se ejecutó la instrucción
    await page.waitForTimeout(500);
    
    // Verificar que el contador de programa avanzó
    const pcValue = await page.locator('[data-testid="program-counter"]').textContent();
    expect(pcValue).not.toBe('0000');
  });

  test('debería pausar y reanudar la simulación', async ({ page }) => {
    // Preparar programa
    await CodeMirrorHelper.setContent(page, 'hlt');
    
    // Ensamblar
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
    
    // Iniciar simulación
    await NavigationHelper.clickButton(page, 'open-button');
    
    // Verificar que aparece el botón de pausa
    await NavigationHelper.expectButtonVisible(page, 'save-button');
    
    // Pausar simulación
    await NavigationHelper.clickButton(page, 'save-button');
    
    // Verificar que vuelven los controles normales
    await NavigationHelper.expectButtonVisible(page, 'cycle-button');
  });

  test('debería resetear la simulación', async ({ page }) => {
    // Preparar programa
    await CodeMirrorHelper.setContent(page, 'hlt');
    
    // Ensamblar
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
    
    // Ejecutar un ciclo
    await NavigationHelper.clickButton(page, 'cycle-button');
    await page.waitForTimeout(500);
    
    // Resetear
    await NavigationHelper.clickButton(page, 'assemble-button');
    
    // Verificar que el contador de programa se reseteó
    const pcValue = await page.locator('[data-testid="program-counter"]').textContent();
    expect(pcValue).toBe('0000');
  });

  test('debería mostrar el estado de la simulación correctamente', async ({ page }) => {
    await NavigationHelper.goToHome(page);
    
    // Verificar estado inicial
    await expect(page.locator('[data-testid="simulation-status"]')).toContainText('Detenido');
    
    // Preparar y ensamblar programa
    await CodeMirrorHelper.setContent(page, 'hlt');
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
    
    // Verificar estado después de ensamblar
    await expect(page.locator('[data-testid="simulation-status"]')).toContainText('Listo');
    
    // Ejecutar ciclo
    await NavigationHelper.clickButton(page, 'cycle-button');
    await page.waitForTimeout(500);
    
    // Verificar estado durante ejecución
    await expect(page.locator('[data-testid="simulation-status"]')).toContainText('Ejecutando');
  });
}); 