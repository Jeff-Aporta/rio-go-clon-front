import type { BrandIdentity, CarouselSlide, Product, SiteConfig, SiteTab } from "./types";

export type { SiteConfig, SiteTab, SiteLocation, LandingSection, CarouselSlide, SocialLink, FooterSocialProps, LocationsHub } from "./types";

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
    locationsHub: raw?.locationsHub,
    categoryImages: raw?.categoryImages || {},
    defaultTab: raw?.defaultTab || tabs[0]?.id || "menu",
  };
}

export function popularProducts(products: Product[], limit = 8): Product[] {
  return [...products]
    .sort((a, b) => (b.timesOrdered || 0) - (a.timesOrdered || 0) || a.nombre.localeCompare(b.nombre))
    .slice(0, limit);
}

/** Slides del carrusel: props.slides (banners) o productos vía índices CAROUSEL. */
export function resolveCarouselSlides(
  sectionProps: Record<string, unknown> | undefined,
  products: Product[],
  carouselIdx: unknown,
): CarouselSlide[] {
  const raw = sectionProps?.slides;
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((s, i): CarouselSlide | null => {
        if (!s || typeof s !== "object") return null;
        const o = s as Record<string, unknown>;
        const imageUrl = String(o.imageUrl || "").trim();
        if (!imageUrl) return null;
        return {
          id: String(o.id || `slide-${i}`),
          imageUrl,
          alt: typeof o.alt === "string" ? o.alt : undefined,
          overlayImageUrl: typeof o.overlayImageUrl === "string" ? o.overlayImageUrl : undefined,
          eyebrow: typeof o.eyebrow === "string" ? o.eyebrow : undefined,
          title: typeof o.title === "string" ? o.title : undefined,
          subtitle: typeof o.subtitle === "string" ? o.subtitle : undefined,
          ctaLabel: typeof o.ctaLabel === "string" ? o.ctaLabel : undefined,
          align: o.align === "left" || o.align === "right" || o.align === "center" ? o.align : undefined,
          valign: o.valign === "top" || o.valign === "bottom" || o.valign === "center" ? o.valign : undefined,
          codigoAb: typeof o.codigoAb === "string" ? o.codigoAb : undefined,
          hrefTab: typeof o.hrefTab === "string" ? o.hrefTab : undefined,
          hrefUrl: typeof o.hrefUrl === "string" ? o.hrefUrl : undefined,
        };
      })
      .filter((s): s is CarouselSlide => !!s);
  }

  const idxs = Array.isArray(carouselIdx) ? carouselIdx.map((n) => Number(n)).filter((n) => Number.isFinite(n)) : [];
  const fromIdx = idxs.map((i) => products[i]).filter((p): p is Product => !!p);
  const list = (fromIdx.length ? fromIdx : products.slice(0, 6)).filter(
    (p, i, arr) => arr.findIndex((x) => x.codigoAb === p.codigoAb) === i,
  );
  return list.map((p) => ({
    id: p.codigoAb,
    imageUrl: p.imagenMiniUrl || p.imagenUrl || "",
    alt: p.nombre,
    codigoAb: p.codigoAb,
  })).filter((s) => s.imageUrl);
}
