import { test, expect } from '@playwright/test';
import { CodeMirrorHelper, NavigationHelper, AppStateHelper } from '../../utils/test-helpers';

test.describe('Flujos de Trabajo Completos', () => {
  test.beforeEach(async ({ page }) => {
    await NavigationHelper.goToHome(page);
  });

  test('flujo completo: escribir, ensamblar y ejecutar programa', async ({ page }) => {
    // 1. Escribir programa
    const program = `
mov al, 10     ; Cargar 10 en AL
mov bl, 5      ; Cargar 5 en BL
add al, bl     ; Sumar BL a AL
mov cl, al     ; Copiar resultado a CL
hlt            ; Parar
    `;
    
    await CodeMirrorHelper.setContent(page, program);
    
    // 2. Ensamblar programa
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
    
    // Verificar que se ensambló correctamente
    await NavigationHelper.expectButtonVisible(page, 'cycle-button');
    
    // 3. Ejecutar programa paso a paso
    await NavigationHelper.clickButton(page, 'cycle-button');
    await page.waitForTimeout(500);
    
    // Verificar que se ejecutó la primera instrucción
    await expect(page.locator('[data-testid="register-al"]')).toContainText('0A'); // 10 en hex
    
    // Ejecutar más ciclos
    await NavigationHelper.clickButton(page, 'cycle-button');
    await page.waitForTimeout(500);
    
    await NavigationHelper.clickButton(page, 'cycle-button');
    await page.waitForTimeout(500);
    
    // Verificar resultado final
    await expect(page.locator('[data-testid="register-cl"]')).toContainText('0F'); // 15 en hex
  });

  test('flujo completo: manejo de errores y corrección', async ({ page }) => {
    // 1. Escribir programa con error
    const invalidProgram = `
mov al, 5
invalid_instruction  ; Error aquí
hlt
    `;
    
    await CodeMirrorHelper.setContent(page, invalidProgram);
    
    // 2. Intentar ensamblar (debería fallar)
    await NavigationHelper.clickButton(page, 'assemble-button');
    
    // 3. Verificar que aparece error
    await AppStateHelper.waitForToast(page);
    
    // 4. Corregir el error
    const correctedProgram = `
mov al, 5
add al, 3      ; Corregido
hlt
    `;
    
    await CodeMirrorHelper.setContent(page, correctedProgram);
    
    // 5. Ensamblar nuevamente
    // Esperar a que el botón esté habilitado después de corregir el código
    await page.waitForSelector('[data-testid="assemble-button"]:not([disabled])', { timeout: 10000 });
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
    
    // 6. Verificar que ahora funciona
    await NavigationHelper.expectButtonVisible(page, 'cycle-button');
  });

  test('flujo completo: simulación con periféricos', async ({ page }) => {
    // 1. Escribir programa que use periféricos
    const peripheralProgram = `
in al, 00h     ; Leer del puerto 0 (teclado)
out 01h, al    ; Escribir al puerto 1 (LEDs)
hlt
    `;
    
    await CodeMirrorHelper.setContent(page, peripheralProgram);
    
    // 2. Ensamblar
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
    
    // 3. Simular entrada de teclado
    await page.click('[data-testid="keyboard-key-5"]');
    
    // 4. Ejecutar programa
    await NavigationHelper.clickButton(page, 'cycle-button');
    await page.waitForTimeout(500);
    
    // 5. Verificar que se leyó del teclado
    await expect(page.locator('[data-testid="register-al"]')).toContainText('35'); // ASCII de '5'
    
    // 6. Ejecutar siguiente instrucción
    await NavigationHelper.clickButton(page, 'cycle-button');
    await page.waitForTimeout(500);
    
    // 7. Verificar que se escribió a los LEDs
    await expect(page.locator('[data-testid="led-0"]')).toHaveClass(/active/);
  });

  test('flujo completo: configuración y personalización', async ({ page }) => {
    // 1. Abrir configuración
    await NavigationHelper.clickButton(page, 'settings-button');
    
    // 2. Cambiar velocidad de simulación
    await page.click('[data-testid="simulation-speed"]');
    await page.click('[data-testid="speed-fast"]');
    
    // 3. Cambiar tema
    await page.click('[data-testid="theme-selector"]');
    await page.click('[data-testid="theme-dark"]');
    
    // 4. Cerrar configuración
    await NavigationHelper.clickButton(page, 'settings-button');
    
    // 5. Verificar que los cambios se aplicaron
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // 6. Escribir y ejecutar programa para probar velocidad
    await CodeMirrorHelper.setContent(page, 'hlt');
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
    
    // La simulación debería ser más rápida
    const startTime = Date.now();
    await NavigationHelper.clickButton(page, 'cycle-button');
    await page.waitForTimeout(200);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(300); // Debería ser rápido
  });

  test('flujo completo: aprendizaje educativo', async ({ page }) => {
    // 1. Abrir centro de aprendizaje
    await NavigationHelper.clickButton(page, 'educational-button');
    
    // 2. Iniciar tutorial de CPU
    await page.click('[data-testid="tutorial-cpu-basics"]');
    
    // 3. Completar tutorial
    await page.click('[data-testid="tutorial-next"]');
    await page.click('[data-testid="tutorial-next"]');
    await page.click('[data-testid="tutorial-complete"]');
    
    // 4. Verificar que se registró el progreso
    await page.click('[data-testid="progress-section"]');
    await expect(page.locator('[data-testid="tutorials-completed"]')).toContainText('1');
    
    // 5. Cerrar centro de aprendizaje
    await NavigationHelper.clickButton(page, 'educational-button');
    
    // 6. Aplicar lo aprendido escribiendo un programa
    await CodeMirrorHelper.setContent(page, `
mov al, 5      ; Usar registros como aprendido
add al, 3      ; Operación aritmética
hlt
    `);
    
    // 7. Ensamblar y ejecutar
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
    await NavigationHelper.clickButton(page, 'cycle-button');
    await page.waitForTimeout(500);
    
    // 8. Verificar que se aplicó el conocimiento
    await expect(page.locator('[data-testid="register-al"]')).toContainText('08'); // 5 + 3 = 8
  });
}); 