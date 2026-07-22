/** Texto legible sobre un fondo sólido, usando luminosidad OKLCH. */

const LIGHT = "#ffffff";
const DARK = "#14110f";
/** Por encima → fondo claro → tipografía oscura. */
const L_THRESHOLD = 0.65;

function parseCssColor(input: string): [number, number, number] | null {
  const s = input.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const h = hex[1]!;
    if (h.length === 3) {
      return [parseInt(h[0]! + h[0]!, 16), parseInt(h[1]! + h[1]!, 16), parseInt(h[2]! + h[2]!, 16)];
    }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i.exec(s);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

function srgbChannelToLinear(c: number): number {
  const s = Math.min(255, Math.max(0, c)) / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Luminosidad L de OKLCH (0–1). Björn Ottosson. */
export function oklchL(bg: string): number | null {
  const rgb = parseCssColor(bg);
  if (!rgb) return null;
  const r = srgbChannelToLinear(rgb[0]!);
  const g = srgbChannelToLinear(rgb[1]!);
  const b = srgbChannelToLinear(rgb[2]!);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
}

/**
 * Color de fuente que contrasta con `bg`.
 * Fondos claros (L OKLCH alta) → oscuro; oscuros → blanco.
 */
export function bg2font(
  bg: string,
  opts?: { light?: string; dark?: string; threshold?: number },
): string {
  const L = oklchL(bg);
  if (L == null) return opts?.light ?? LIGHT;
  const thr = opts?.threshold ?? L_THRESHOLD;
  return L > thr ? (opts?.dark ?? DARK) : (opts?.light ?? LIGHT);
}
