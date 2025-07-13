import { Page, expect } from '@playwright/test';

// Utilidades para interactuar con CodeMirror
export class CodeMirrorHelper {
  static async setContent(page: Page, content: string) {
    await page.evaluate((code) => {
      const win = window as any;
      if (win.codemirror) {
        win.codemirror.dispatch({
          changes: { from: 0, to: win.codemirror.state.doc.length, insert: code }
        });
      }
    }, content);
    
    // Esperar a que el contenido se actualice
    await page.waitForFunction((expectedContent) => {
      const win = window as any;
      return win.codemirror && win.codemirror.state.doc.toString().includes(expectedContent);
    }, content);
  }

  static async getContent(page: Page): Promise<string> {
    return await page.evaluate(() => {
      const win = window as any;
      return win.codemirror ? win.codemirror.state.doc.toString() : '';
    });
  }

  static async clearContent(page: Page) {
    await this.setContent(page, '');
  }
}

// Utilidades para verificar estados de la aplicación
export class AppStateHelper {
  static async waitForAppReady(page: Page) {
    await page.waitForSelector('[data-testid="cycle-button"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="assemble-button"]', { timeout: 10000 });
  }

  static async waitForSimulationReady(page: Page) {
    await page.waitForSelector('[data-testid="save-button"]', { timeout: 10000 });
  }

  static async waitForToast(page: Page, expectedText?: string) {
    const toast = page.locator('.toast, .error-message, [role="alert"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    if (expectedText) {
      await expect(toast).toContainText(expectedText);
    }
  }

  static async waitForAssemblerSuccess(page: Page) {
    // Esperar a que aparezcan los controles de simulación
    await page.waitForSelector('[data-testid="cycle-button"]', { timeout: 5000 });
    await page.waitForSelector('[data-testid="open-button"]', { timeout: 5000 });
  }

  static async waitForAssemblerError(page: Page) {
    // Esperar a que aparezca un mensaje de error
    await this.waitForToast(page);
  }
}

// Utilidades para navegación
export class NavigationHelper {
  static async goToHome(page: Page) {
    await page.goto('/');
    await AppStateHelper.waitForAppReady(page);
  }

  static async clickButton(page: Page, testId: string) {
    await page.click(`[data-testid="${testId}"]`);
  }

  static async expectButtonVisible(page: Page, testId: string) {
    await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible();
  }

  static async expectButtonEnabled(page: Page, testId: string) {
    await expect(page.locator(`[data-testid="${testId}"]`)).toBeEnabled();
  }

  static async expectButtonDisabled(page: Page, testId: string) {
    await expect(page.locator(`[data-testid="${testId}"]`)).toBeDisabled();
  }
}

// Utilidades específicas de VonSim8
export class VonSim8Helper {
  // Simulación
  static async assembleProgram(page: Page, program: string) {
    await CodeMirrorHelper.setContent(page, program);
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(1000);
  }

  static async runCycle(page: Page) {
    await NavigationHelper.clickButton(page, 'cycle-button');
    await page.waitForTimeout(500);
  }

  static async runInstruction(page: Page) {
    await page.click('[data-testid="instruction-button"]');
    await page.waitForTimeout(500);
  }

  static async startSimulation(page: Page) {
    await NavigationHelper.clickButton(page, 'open-button');
    await AppStateHelper.waitForSimulationReady(page);
  }

  static async pauseSimulation(page: Page) {
    await NavigationHelper.clickButton(page, 'save-button');
    await page.waitForTimeout(500);
  }

  static async resetSimulation(page: Page) {
    await NavigationHelper.clickButton(page, 'assemble-button');
    await page.waitForTimeout(500);
  }

  // Registros y memoria
  static async getRegisterValue(page: Page, register: string): Promise<string> {
    return await page.locator(`[data-testid="register-${register}"]`).textContent() || '';
  }

  static async expectRegisterValue(page: Page, register: string, expectedValue: string) {
    await expect(page.locator(`[data-testid="register-${register}"]`)).toContainText(expectedValue);
  }

  static async getMemoryValue(page: Page, address: string): Promise<string> {
    return await page.locator(`[data-testid="memory-${address}"]`).textContent() || '';
  }

  static async expectMemoryValue(page: Page, address: string, expectedValue: string) {
    await expect(page.locator(`[data-testid="memory-${address}"]`)).toContainText(expectedValue);
  }

  // Periféricos
  static async clickKeyboardKey(page: Page, key: string) {
    await page.click(`[data-testid="keyboard-key-${key}"]`);
  }

  static async expectLEDState(page: Page, ledIndex: number, isActive: boolean) {
    const led = page.locator(`[data-testid="led-${ledIndex}"]`);
    if (isActive) {
      await expect(led).toHaveClass(/active/);
    } else {
      await expect(led).not.toHaveClass(/active/);
    }
  }

  static async setSwitch(page: Page, switchIndex: number, isOn: boolean) {
    const switchElement = page.locator(`[data-testid="switch-${switchIndex}"]`);
    const currentState = await switchElement.getAttribute('data-state');
    
    if ((currentState === 'on') !== isOn) {
      await switchElement.click();
    }
  }

  // Componentes educativos
  static async openEducationalCenter(page: Page) {
    await NavigationHelper.clickButton(page, 'educational-button');
    await page.waitForSelector('[data-testid="educational-menu"]', { timeout: 5000 });
  }

  static async startTutorial(page: Page, tutorialId: string) {
    await this.openEducationalCenter(page);
    await page.click(`[data-testid="tutorial-${tutorialId}"]`);
    await page.waitForSelector('[data-testid="interactive-tutorial"]', { timeout: 5000 });
  }

  static async completeTutorial(page: Page) {
    // Navegar por todos los pasos
    while (await page.locator('[data-testid="tutorial-next"]').isVisible()) {
      await page.click('[data-testid="tutorial-next"]');
      await page.waitForTimeout(500);
    }
    
    // Completar tutorial
    await page.click('[data-testid="tutorial-complete"]');
  }

  // Configuración
  static async openSettings(page: Page) {
    await NavigationHelper.clickButton(page, 'settings-button');
    await page.waitForSelector('[data-testid="settings-panel"]', { timeout: 5000 });
  }

  static async changeSimulationSpeed(page: Page, speed: 'slow' | 'normal' | 'fast') {
    await this.openSettings(page);
    await page.click('[data-testid="simulation-speed"]');
    await page.click(`[data-testid="speed-${speed}"]`);
  }

  static async changeTheme(page: Page, theme: 'light' | 'dark') {
    await this.openSettings(page);
    await page.click('[data-testid="theme-selector"]');
    await page.click(`[data-testid="theme-${theme}"]`);
  }
}

// Utilidades para debugging
export class DebugHelper {
  static async logPageState(page: Page, context: string) {
    const url = page.url();
    const title = await page.title();
    console.log(`[${context}] URL: ${url}, Title: ${title}`);
  }

  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `test-results/screenshots/${name}-${Date.now()}.png` });
  }

  static async logSimulationState(page: Page) {
    const status = await page.locator('[data-testid="simulation-status"]').textContent();
    const pc = await page.locator('[data-testid="program-counter"]').textContent();
    const al = await page.locator('[data-testid="register-al"]').textContent();
    
    console.log(`Simulation State: Status=${status}, PC=${pc}, AL=${al}`);
  }
} 