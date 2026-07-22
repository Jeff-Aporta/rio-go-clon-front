import { storageKey } from "./config";
import type { BrandIdentity, ThemeMode, ThemePalette } from "./types";

const PALETTE_TO_CSS: Record<keyof ThemePalette, string> = {
  bg: "--rg-bg",
  surface: "--rg-surface",
  surface2: "--rg-surface-2",
  line: "--rg-line",
  text: "--rg-text",
  muted: "--rg-muted",
  accent: "--rg-accent",
  accent2: "--rg-accent-2",
  ok: "--rg-ok",
  danger: "--rg-danger",
  headerBg: "--rg-header-bg",
  priceBar: "--rg-price-bar",
  heroCaption: "--rg-hero-caption",
};

/** Paletas base (= CSS actual). Se usan si el worker no manda themes. */
export const BASE_THEMES: Record<ThemeMode, ThemePalette> = {
  dark: {
    bg: "#0c0f14",
    surface: "#141a22",
    surface2: "#1b2330",
    line: "rgba(255, 255, 255, 0.08)",
    text: "#f3f5f8",
    muted: "#9aa6b5",
    accent: "#f5a623",
    accent2: "#ff6b4a",
    ok: "#3dd68c",
    danger: "#ff6b6b",
    headerBg: "rgba(12, 15, 20, 0.82)",
    priceBar: "linear-gradient(90deg, #2a313c, #1e2530)",
    heroCaption: "rgba(8, 10, 14, 0.78)",
  },
  light: {
    bg: "#f4f1ea",
    surface: "#ffffff",
    surface2: "#ebe6dc",
    line: "rgba(20, 24, 32, 0.1)",
    text: "#1a1f29",
    muted: "#667084",
    accent: "#f5a623",
    accent2: "#ff6b4a",
    ok: "#3dd68c",
    danger: "#ff6b6b",
    headerBg: "rgba(244, 241, 234, 0.9)",
    priceBar: "linear-gradient(90deg, #2f3540, #232933)",
    heroCaption: "rgba(255, 255, 255, 0.92)",
  },
};

function isPalette(v: unknown): v is ThemePalette {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.bg === "string" && typeof o.accent === "string" && typeof o.text === "string";
}

/** Completa huecos con la paleta base del modo. */
export function resolvePalette(
  brand: BrandIdentity | null | undefined,
  mode: ThemeMode,
): ThemePalette {
  const base = BASE_THEMES[mode];
  const raw = brand?.themes?.[mode] ?? brand?.themes?.dark ?? brand?.themes?.light;
  if (!isPalette(raw)) return { ...base };
  return { ...base, ...raw };
}

export function clearInlinePalette(): void {
  const root = document.documentElement;
  for (const cssVar of Object.values(PALETTE_TO_CSS)) root.style.removeProperty(cssVar);
  root.style.removeProperty("--sl-color-primary-600");
  root.style.removeProperty("--sl-color-primary-500");
}

export function applyPalette(palette: ThemePalette): void {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(PALETTE_TO_CSS) as [keyof ThemePalette, string][]) {
    const val = palette[key];
    if (val) root.style.setProperty(cssVar, val);
  }
  if (palette.accent) {
    root.style.setProperty("--sl-color-primary-600", palette.accent);
    root.style.setProperty("--sl-color-primary-500", palette.accent);
  }
}

export function applyModeClasses(mode: ThemeMode): void {
  document.documentElement.classList.toggle("sl-theme-dark", mode === "dark");
  document.documentElement.classList.toggle("sl-theme-light", mode === "light");
  document.documentElement.style.colorScheme = mode;
}

function isBrandIdentity(v: unknown): v is BrandIdentity {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.name === "string" && typeof o.id === "string";
}

/** Última identidad de marca vista (evita FOUC mientras llega /api/brand). */
export function readCachedBrand(): BrandIdentity | null {
  try {
    const raw =
      localStorage.getItem(storageKey("brand")) ||
      localStorage.getItem("storefront:brand") ||
      localStorage.getItem("riogo:brand");
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isBrandIdentity(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedBrand(brand: BrandIdentity): void {
  try {
    localStorage.setItem(storageKey("brand"), JSON.stringify(brand));
  } catch {
    /* ignore quota / private mode */
  }
}

export function readStoredThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(storageKey("theme")) || localStorage.getItem("riogo:theme");
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return "dark";
}

/** Aplica marca si trae themes; si no, usa estilos base de la app. */
export function applyBrandTheme(brand: BrandIdentity | null | undefined, mode: ThemeMode): void {
  const hasApiThemes = isPalette(brand?.themes?.dark) || isPalette(brand?.themes?.light);
  applyModeClasses(mode);

  if (!hasApiThemes) {
    // Deja ganar el CSS base (sin overrides inline viejos)
    clearInlinePalette();
    const base = BASE_THEMES[mode];
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", base.bg);
  } else {
    const palette = resolvePalette(brand, mode);
    applyPalette(palette);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", palette.bg);
  }

  if (brand?.name) document.title = `${brand.name} — Pedidos`;
}

/** Primera pintura: cache LS → CSS vars (antes de React / fetch). */
export function hydrateBrandFromCache(mode: ThemeMode = readStoredThemeMode()): BrandIdentity | null {
  const brand = readCachedBrand();
  applyBrandTheme(brand, mode);
  return brand;
}
