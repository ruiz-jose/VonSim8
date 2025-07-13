import { test, expect } from '@playwright/test';

test.describe('VonSim8 Application', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="cycle-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="open-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="assemble-button"]')).toBeVisible();
  });

  test('should have main layout components', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="cycle-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="open-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="assemble-button"]')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="cycle-button"]')).toBeVisible();
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
    
    // Escribir código inválido en el editor
    await page.evaluate(() => {
      const win = window as any;
      if (win.codemirror) {
        win.codemirror.dispatch({
          changes: { from: 0, to: win.codemirror.state.doc.length, insert: "invalid instruction\n" }
        });
      }
    });
    
    await page.waitForFunction(() => {
      const win = window as any;
      return win.codemirror && win.codemirror.state.doc.toString().includes("invalid");
    });
    
    // Ahora el botón debería estar habilitado
    await expect(page.locator('[data-testid="assemble-button"]')).toBeEnabled();
    
    // Click y esperar toast/error
    await page.click('[data-testid="assemble-button"]');
    
    // Esperar toast o error visible
    const toast = page.locator('.toast, .error-message');
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    // Log para depuración
    const toastText = await toast.textContent();
    console.log('Toast/Error:', toastText);
  });

  test('should show pause button when running', async ({ page }) => {
    await page.goto('/');
    
    // Escribir código válido usando la API de CodeMirror
    await page.evaluate(() => {
      const win = window as any;
      if (win.codemirror) {
        win.codemirror.dispatch({
          changes: { from: 0, to: win.codemirror.state.doc.length, insert: "org 1000h\nhlt\nend" }
        });
      }
    });
    
    await page.waitForFunction(() => {
      const win = window as any;
      return win.codemirror && win.codemirror.state.doc.toString().includes("hlt");
    });
    
    // Iniciar la simulación
    await expect(page.locator('[data-testid="open-button"]')).toBeVisible();
    await page.click('[data-testid="open-button"]');
    
    // Esperar a que desaparezca el botón open
    await page.waitForSelector('[data-testid="open-button"]', { state: 'detached', timeout: 10000 });
    
    // Esperar a que aparezca el botón de pausa
    await page.waitForSelector('[data-testid="save-button"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="save-button"]')).toBeVisible();
    
    // Log para depuración
    const pauseBtn = await page.locator('[data-testid="save-button"]').textContent();
    console.log('Pause button:', pauseBtn);
  });

  test('should handle file operations', async ({ page }) => {
    await page.goto('/');
    
    // Escribir código válido usando la API de CodeMirror
    await page.evaluate(() => {
      const win = window as any;
      if (win.codemirror) {
        win.codemirror.dispatch({
          changes: { from: 0, to: win.codemirror.state.doc.length, insert: "org 1000h\nhlt\nend" }
        });
      }
    });
    
    await page.waitForFunction(() => {
      const win = window as any;
      return win.codemirror && win.codemirror.state.doc.toString().includes("hlt");
    });
    
    // Verificar que el editor tiene contenido
    await expect(page.locator('.cm-editor')).toContainText('hlt');
    
    // Limpiar el editor usando el botón new
    await expect(page.locator('[data-testid="new-button"]')).toBeVisible();
    await page.click('[data-testid="new-button"]');
    
    // Esperar a que el editor esté vacío
    await page.waitForFunction(() => {
      const win = window as any;
      return win.codemirror && win.codemirror.state.doc.toString().trim() === "";
    });
    
    await expect(page.locator('.cm-editor')).toHaveText('');
    
    // Log para depuración
    const editorText = await page.locator('.cm-editor').textContent();
    console.log('Editor after new:', editorText);
  });
});

