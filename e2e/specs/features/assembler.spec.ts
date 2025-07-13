import { test, expect } from "@playwright/test";
import { CodeMirrorHelper, NavigationHelper, AppStateHelper } from "../../utils/test-helpers";
import { readFileSync } from "fs";
import path from "path";

test.describe("Funcionalidad del Ensamblador", () => {
  test.beforeEach(async ({ page }) => {
    await NavigationHelper.goToHome(page);
  });

  test("debería ensamblar un programa válido correctamente", async ({ page }) => {
    // Cargar programa válido desde fixtures
    const validProgram = readFileSync(
      path.join(__dirname, "../../fixtures/programs/valid-program.asm"),
      "utf-8",
    );

    await CodeMirrorHelper.setContent(page, validProgram);

    // Verificar que el botón de ensamblar esté habilitado
    await NavigationHelper.expectButtonEnabled(page, "assemble-button");

    // Ensamblar el programa
    await NavigationHelper.clickButton(page, "assemble-button");

    // Verificar que no hay errores
    await page.waitForTimeout(1000); // Esperar procesamiento

    // Verificar que aparecen los controles de simulación
    await NavigationHelper.expectButtonVisible(page, "cycle-button");
    await NavigationHelper.expectButtonVisible(page, "open-button");
  });

  test("debería mostrar errores para código inválido", async ({ page }) => {
    // Cargar programa inválido
    const invalidProgram = readFileSync(
      path.join(__dirname, "../../fixtures/programs/invalid-program.asm"),
      "utf-8",
    );

    await CodeMirrorHelper.setContent(page, invalidProgram);

    // Ensamblar el programa
    await NavigationHelper.clickButton(page, "assemble-button");

    // Verificar que aparece un mensaje de error
    await AppStateHelper.waitForToast(page);

    // Verificar que el botón de ensamblar sigue habilitado para corregir errores
    await NavigationHelper.expectButtonEnabled(page, "assemble-button");
  });

  test("debería mostrar el dropdown de archivos al hacer click en new-button", async ({ page }) => {
    // Verificar que el botón existe
    await expect(page.locator('[data-testid="new-button"]')).toBeVisible();

    // Hacer click en el botón para abrir el dropdown
    await NavigationHelper.clickButton(page, "new-button");

    // Esperar a que aparezca el dropdown
    await page.waitForTimeout(500);

    // Verificar que aparece al menos la opción de abrir archivo
    await expect(page.locator('[data-testid="open-button"]')).toBeVisible();
  });

  test("debería manejar sintaxis de ensamblador correctamente", async ({ page }) => {
    const testProgram = `
mov al, 5      ; Cargar 5 en AL
add al, 3      ; Sumar 3 a AL
mov bl, al     ; Copiar resultado a BL
hlt            ; Parar
    `;

    await CodeMirrorHelper.setContent(page, testProgram);

    // Ensamblar
    await NavigationHelper.clickButton(page, "assemble-button");

    // Verificar que se ensambló correctamente
    await page.waitForTimeout(1000);
    await NavigationHelper.expectButtonVisible(page, "cycle-button");
  });
});
