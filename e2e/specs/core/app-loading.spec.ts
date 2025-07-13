import { test, expect } from "@playwright/test";
import { NavigationHelper, AppStateHelper, DebugHelper } from "../../utils/test-helpers";

test.describe("Carga de la Aplicación", () => {
  test("debería cargar la aplicación correctamente", async ({ page }) => {
    await NavigationHelper.goToHome(page);

    // Verificar elementos principales
    await NavigationHelper.expectButtonVisible(page, "cycle-button");
    await NavigationHelper.expectButtonVisible(page, "new-button");
    await NavigationHelper.expectButtonVisible(page, "open-button");
    await NavigationHelper.expectButtonVisible(page, "assemble-button");

    // Verificar que el editor esté presente
    await expect(page.locator(".cm-editor")).toBeVisible();

    await DebugHelper.logPageState(page, "App Loaded");
  });

  test("debería cargar sin errores de JavaScript", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", err => errors.push(err.message));

    await NavigationHelper.goToHome(page);

    expect(errors).toEqual([]);
  });

  test("debería ser responsiva en dispositivos móviles", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await NavigationHelper.goToHome(page);

    // Verificar que los botones principales sean visibles en móvil
    await NavigationHelper.expectButtonVisible(page, "cycle-button");
    await NavigationHelper.expectButtonVisible(page, "assemble-button");

    await DebugHelper.takeScreenshot(page, "mobile-layout");
  });
});
