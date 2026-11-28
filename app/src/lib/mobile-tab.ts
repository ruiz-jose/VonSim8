/**
 * Evento para cambiar la pestaña visible del diseño móvil (Editor / Computadora).
 * En escritorio no tiene efecto. Uso:
 *
 *   window.dispatchEvent(new CustomEvent(MOBILE_TAB_EVENT, { detail: { tab: "computer" } }));
 */
export const MOBILE_TAB_EVENT = "vonsim:mobile-tab";

export type MobileTab = "editor" | "computer";
