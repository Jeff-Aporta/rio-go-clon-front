/** Fondo de panel de marca con alpha vía color-mix (se adapta al --rg-bg del theme). */
export function panelBg(color: string, alphaPct = 90): string {
  const c = color.trim();
  if (!c) return `color-mix(in srgb, var(--rg-accent) ${alphaPct}%, var(--rg-bg))`;
  if (c.includes("color-mix") || c.includes("var(")) return c;
  return `color-mix(in srgb, ${c} ${alphaPct}%, var(--rg-bg))`;
}
