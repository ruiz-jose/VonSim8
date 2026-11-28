/**
 * Evento para pedirle al panel de la computadora que centre la vista
 * (pan/zoom) en un componente. Uso:
 *
 *   window.dispatchEvent(new CustomEvent(COMPUTER_FOCUS_EVENT, { detail: { selector } }));
 */
export const COMPUTER_FOCUS_EVENT = "vonsim:computer-focus";
