// Cálculo de la posición del resaltado y de la tarjeta de la guía de primeros pasos

export type Placement = "top" | "bottom" | "left" | "right";

export type Rect = { top: number; left: number; width: number; height: number };

export const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (!!a &&
    !!b &&
    Math.abs(a.top - b.top) < 1 &&
    Math.abs(a.left - b.left) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1);

/** Rectángulo visible del objetivo (recortado a la ventana), o null si no existe. */
export function measureTarget(selector?: string): Rect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  // Algunos contenedores tienen tamaño 0 y sus hijos están posicionados en
  // forma absoluta: en ese caso se usa la unión de los rectángulos de sus descendientes.
  let r: {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0 && el.children.length > 0) {
    const rects = Array.from(el.querySelectorAll("*"))
      .map(c => c.getBoundingClientRect())
      .filter(x => x.width > 0 && x.height > 0);
    if (rects.length === 0) return null;
    const top = Math.min(...rects.map(x => x.top));
    const left = Math.min(...rects.map(x => x.left));
    const right = Math.max(...rects.map(x => x.right));
    const bottom = Math.max(...rects.map(x => x.bottom));
    r = { top, left, right, bottom, width: right - left, height: bottom - top };
  }
  if (r.width === 0 && r.height === 0) return null;
  const pad = 6;
  const top = Math.max(r.top - pad, 4);
  const left = Math.max(r.left - pad, 4);
  const bottom = Math.min(r.bottom + pad, window.innerHeight - 4);
  const right = Math.min(r.right + pad, window.innerWidth - 4);
  if (bottom <= top || right <= left) return null;
  return { top, left, width: right - left, height: bottom - top };
}

const GAP = 14;
const MARGIN = 12;

export function placeCard(
  target: Rect | null,
  card: { width: number; height: number },
  preferred: Placement,
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  if (!target) {
    return { top: (vh - card.height) / 2, left: (vw - card.width) / 2 };
  }

  const candidates: Record<Placement, { top: number; left: number; fits: boolean }> = {
    bottom: {
      top: target.top + target.height + GAP,
      left: target.left + target.width / 2 - card.width / 2,
      fits: target.top + target.height + GAP + card.height <= vh - MARGIN,
    },
    top: {
      top: target.top - GAP - card.height,
      left: target.left + target.width / 2 - card.width / 2,
      fits: target.top - GAP - card.height >= MARGIN,
    },
    right: {
      top: target.top + target.height / 2 - card.height / 2,
      left: target.left + target.width + GAP,
      fits: target.left + target.width + GAP + card.width <= vw - MARGIN,
    },
    left: {
      top: target.top + target.height / 2 - card.height / 2,
      left: target.left - GAP - card.width,
      fits: target.left - GAP - card.width >= MARGIN,
    },
  };

  const order: Placement[] = [
    preferred,
    ...(["bottom", "right", "left", "top"] as Placement[]).filter(p => p !== preferred),
  ];
  const chosen = order.map(p => candidates[p]).find(c => c.fits);

  // Si no entra en ningún lado (objetivo muy grande), la tarjeta va abajo a la derecha.
  const pos = chosen ?? { top: vh - card.height - MARGIN, left: vw - card.width - MARGIN };

  return {
    top: clamp(pos.top, MARGIN, Math.max(MARGIN, vh - card.height - MARGIN)),
    left: clamp(pos.left, MARGIN, Math.max(MARGIN, vw - card.width - MARGIN)),
  };
}
