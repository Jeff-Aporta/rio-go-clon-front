import type { BrandIdentity, Product, SiteConfig, SiteTab } from "./types";

export type { SiteConfig, SiteTab, SiteLocation, LandingSection } from "./types";

export function defaultTabs(): SiteTab[] {
  return [{ id: "menu", label: "Menú", driver: "catalog-rows", icon: "mdi:food" }];
}

export function resolveSite(raw: SiteConfig | null | undefined, brand?: BrandIdentity | null): SiteConfig {
  const tabs = raw?.tabs?.length ? raw.tabs : defaultTabs();
  return {
    brand: { ...(brand || {}), ...(raw?.brand || {}) },
    tabs,
    landing: { sections: raw?.landing?.sections || [{ type: "carousel" }] },
    locations: raw?.locations || [],
    categoryImages: raw?.categoryImages || {},
    defaultTab: raw?.defaultTab || tabs[0]?.id || "menu",
  };
}

export function popularProducts(products: Product[], limit = 8): Product[] {
  return [...products]
    .sort((a, b) => (b.timesOrdered || 0) - (a.timesOrdered || 0) || a.nombre.localeCompare(b.nombre))
    .slice(0, limit);
}
