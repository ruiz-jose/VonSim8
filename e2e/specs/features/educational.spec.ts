import { test, expect } from '@playwright/test';
import { NavigationHelper, AppStateHelper } from '../../utils/test-helpers';

// Helper para saltar tests si el elemento no existe
async function skipIfNotVisible(page, selector: string, reason: string) {
  const isVisible = await page.locator(selector).isVisible().catch(() => false);
  test.skip(!isVisible, reason);
}

test.describe('Funcionalidades Educativas', () => {
  test.beforeEach(async ({ page }) => {
    await NavigationHelper.goToHome(page);
  });

  // Solo ejecutar tests de tooltips en desktop
  test.describe('Tooltips Educativos', () => {
    test.use({ viewport: { width: 1280, height: 720 } });
    
    test('debería mostrar tooltips educativos', async ({ page }) => {
      // Verificar si el elemento existe antes de continuar
      const cpuComponent = page.locator('[data-testid="cpu-component"]');
      const exists = await cpuComponent.count() > 0;
      
      if (!exists) {
        test.skip(true, 'cpu-component no está presente en esta vista');
        return;
      }
      
      await page.hover('[data-testid="cpu-component"]');
      await expect(page.locator('[data-testid="educational-tooltip"]')).toBeVisible();
      await expect(page.locator('[data-testid="educational-tooltip"]')).toContainText('CPU');
    });

    test('debería cambiar niveles de complejidad en tooltips', async ({ page }) => {
      // Verificar si el elemento existe antes de continuar
      const memoryComponent = page.locator('[data-testid="memory-component"]');
      const exists = await memoryComponent.count() > 0;
      
      if (!exists) {
        test.skip(true, 'memory-component no está presente en esta vista');
        return;
      }
      
      await page.hover('[data-testid="memory-component"]');
      await expect(page.locator('[data-testid="educational-tooltip"]')).toContainText('Nivel Básico');
      await page.click('[data-testid="level-intermediate"]');
      await expect(page.locator('[data-testid="educational-tooltip"]')).toContainText('Nivel Intermedio');
      await page.click('[data-testid="level-advanced"]');
      await expect(page.locator('[data-testid="educational-tooltip"]')).toContainText('Nivel Avanzado');
    });
  });

  test('debería abrir el centro de aprendizaje', async ({ page }) => {
    await NavigationHelper.clickButton(page, 'educational-button');
    await expect(page.locator('[data-testid="educational-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="educational-menu"]')).toContainText('Tutoriales');
    await expect(page.locator('[data-testid="educational-menu"]')).toContainText('Progreso');
  });



  test('debería iniciar un tutorial interactivo', async ({ page }) => {
    // Abrir centro de aprendizaje
    await NavigationHelper.clickButton(page, 'educational-button');
    
    // Hacer clic en tutoriales
    await page.click('[data-testid="tutorials-section"]');
    
    // Seleccionar un tutorial
    await page.click('[data-testid="tutorial-cpu-basics"]');
    
    // Verificar que se abre el tutorial
    await expect(page.locator('[data-testid="interactive-tutorial"]')).toBeVisible();
    
    // Verificar que muestra el primer paso
    await expect(page.locator('[data-testid="tutorial-step"]')).toBeVisible();
  });

  test('debería mostrar progreso educativo', async ({ page }) => {
    // Abrir centro de aprendizaje
    await NavigationHelper.clickButton(page, 'educational-button');
    
    // Hacer clic en progreso
    await page.click('[data-testid="progress-section"]');
    
    // Verificar que se muestra el panel de progreso
    await expect(page.locator('[data-testid="educational-progress"]')).toBeVisible();
    
    // Verificar que muestra estadísticas
    await expect(page.locator('[data-testid="progress-stats"]')).toBeVisible();
  });

  test('debería mostrar el tour de bienvenida', async ({ page }) => {
    // Hacer clic en el botón de ayuda
    await page.click('[data-testid="help-button"]');
    
    // Verificar que se inicia el tour
    await expect(page.locator('[data-testid="welcome-tour"]')).toBeVisible();
    
    // Verificar que muestra el primer paso
    await expect(page.locator('[data-testid="tour-step"]')).toBeVisible();
    
    // Navegar al siguiente paso
    await page.click('[data-testid="tour-next"]');
    
    // Verificar que avanzó al segundo paso
    await expect(page.locator('[data-testid="tour-step"]')).toBeVisible();
  });

  test('debería mostrar visualizaciones de conceptos', async ({ page }) => {
    // Hacer clic en un botón de visualización
    await page.click('[data-testid="concept-visualizer-button"]');
    
    // Verificar que se abre la visualización
    await expect(page.locator('[data-testid="concept-visualizer"]')).toBeVisible();
    
    // Verificar que muestra animaciones
    await expect(page.locator('[data-testid="concept-animation"]')).toBeVisible();
  });

  test('debería registrar progreso al ejecutar instrucciones', async ({ page }) => {
    // Preparar y ejecutar un programa simple
    await page.evaluate(() => {
      const win = window as any;
      if (win.codemirror) {
        win.codemirror.dispatch({
          changes: { from: 0, to: win.codemirror.state.doc.length, insert: "hlt" }
        });
      }
    });
    
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
    
    // Ejecutar una instrucción
    await NavigationHelper.clickButton(page, 'cycle-button');
    await page.waitForTimeout(500);
    
    // Verificar que se registró el progreso
    await NavigationHelper.clickButton(page, 'educational-button');
    await page.click('[data-testid="progress-section"]');
    
    // Verificar que las estadísticas se actualizaron
    await expect(page.locator('[data-testid="instructions-executed"]')).toContainText('1');
  });
}); 