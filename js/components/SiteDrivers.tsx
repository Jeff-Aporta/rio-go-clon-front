import type { CarouselSlide, LocationsHub, Product } from "../types";
import type { SiteConfig, SiteLocation } from "../site";
import { popularProducts, resolveCarouselSlides } from "../site";
import { ProductCard } from "./ProductCard";

type Props = {
  site: SiteConfig;
  products: Product[];
  categorias: string[];
  carouselIdx: unknown;
  qtyByCode: Map<string, number>;
  onGoTab: (tab: string) => void;
  onOpenProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
  onSetQty: (codigoAb: string, qty: number) => void;
};

function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function slideHasOverlay(slide: CarouselSlide): boolean {
  return !!(slide.overlayImageUrl || slide.title || slide.eyebrow || slide.subtitle || slide.ctaLabel);
}

function SlideContent({ slide }: { slide: CarouselSlide }) {
  const align = slide.align || "left";
  const valign = slide.valign || "center";
  const hasOverlay = slideHasOverlay(slide);
  return (
    <>
      <img className="hero-slide-bg" src={slide.imageUrl} alt={slide.alt || ""} />
      {hasOverlay ? (
        <div className={`hero-slide-overlay align-${align} valign-${valign}`}>
          <div className="hero-slide-copy">
            {slide.overlayImageUrl ? (
              <img className="hero-slide-graphic" src={slide.overlayImageUrl} alt="" />
            ) : null}
            {slide.eyebrow ? <p className="hero-slide-eyebrow">{slide.eyebrow}</p> : null}
            {slide.title ? <h2 className="hero-slide-title">{slide.title}</h2> : null}
            {slide.subtitle ? <p className="hero-slide-sub">{slide.subtitle}</p> : null}
            {slide.ctaLabel ? <span className="hero-slide-cta">{slide.ctaLabel}</span> : null}
          </div>
        </div>
      ) : slide.codigoAb && slide.alt ? (
        <span className="hero-cap">{slide.alt}</span>
      ) : null}
    </>
  );
}

function onSlideClick(
  slide: CarouselSlide,
  products: Product[],
  onGoTab: (tab: string) => void,
  onOpenProduct: (p: Product) => void,
) {
  if (slide.hrefUrl) {
    window.open(slide.hrefUrl, "_blank", "noopener,noreferrer");
    return;
  }
  if (slide.hrefTab) {
    onGoTab(slide.hrefTab);
    return;
  }
  if (slide.codigoAb) {
    const p = products.find((x) => x.codigoAb === slide.codigoAb);
    if (p) onOpenProduct(p);
  }
}

/** Landing declarativa — secciones desde SITE.landing.sections. */
export function LandingDriver({
  site,
  products,
  categorias,
  carouselIdx,
  qtyByCode,
  onGoTab,
  onOpenProduct,
  onAdd,
  onSetQty,
}: Props) {
  const sections = site.landing?.sections?.length
    ? site.landing.sections
    : [{ type: "carousel" }, { type: "popular-products", props: { limit: 8 } }];
  const catImgs = site.categoryImages || {};

  return (
    <div className="landing">
      {sections.map((sec, idx) => {
        const props = (sec.props || {}) as Record<string, unknown>;
        switch (sec.type) {
          case "carousel": {
            const slides = resolveCarouselSlides(props, products, carouselIdx);
            if (!slides.length) return null;
            return (
              <section key={idx} className="landing-block landing-carousel">
                <sl-carousel navigation pagination autoplay className="hero-carousel">
                  {slides.map((slide) => {
                    const clickable = !!(slide.hrefUrl || slide.hrefTab || slide.codigoAb);
                    const kind = slide.codigoAb ? "hero-slide--product" : "hero-slide--banner";
                    return (
                      <sl-carousel-item key={slide.id || slide.imageUrl}>
                        {clickable ? (
                          <button
                            type="button"
                            className={`hero-slide ${kind}`}
                            onClick={() => onSlideClick(slide, products, onGoTab, onOpenProduct)}
                          >
                            <SlideContent slide={slide} />
                          </button>
                        ) : (
                          <div className={`hero-slide ${kind}`}>
                            <SlideContent slide={slide} />
                          </div>
                        )}
                      </sl-carousel-item>
                    );
                  })}
                </sl-carousel>
              </section>
            );
          }

          case "category-tiles":
            return (
              <section key={idx} className="landing-block landing-padded">
                <p className="landing-kicker">Colecciones</p>
                {asStr(props.title) ? <h2 className="landing-title">{asStr(props.title)}</h2> : null}
                <div className="cat-tiles">
                  {categorias.map((c) => (
                    <button key={c} type="button" className="cat-tile" onClick={() => onGoTab("menu")}>
                      {catImgs[c] ? <img src={catImgs[c]} alt="" /> : <iconify-icon icon="mdi:food" width="36" height="36"></iconify-icon>}
                      <span>{c}</span>
                    </button>
                  ))}
                </div>
              </section>
            );

          case "hero":
            return (
              <section key={idx} className="landing-block landing-hero">
                <div className="landing-hero-inner">
                  <p className="landing-kicker">Pedido online</p>
                  <h2>{asStr(props.title)}</h2>
                  {asStr(props.body) ? <p>{asStr(props.body)}</p> : null}
                  {asStr(props.ctaLabel) ? (
                    <button type="button" className="landing-cta" onClick={() => onGoTab(asStr(props.ctaTab) || "menu")}>
                      {asStr(props.ctaLabel)}
                    </button>
                  ) : null}
                </div>
              </section>
            );

          case "popular-products": {
            const limit = Number(props.limit) || 8;
            const list = popularProducts(products, limit);
            return (
              <section key={idx} className="landing-block landing-padded">
                <p className="landing-kicker">Destacados</p>
                <h2 className="landing-title">{asStr(props.title) || "Populares"}</h2>
                <div className="product-grid uninterrupted">
                  {list.map((p) => (
                    <ProductCard
                      key={p.codigoAb}
                      p={p}
                      layout="grid"
                      qty={qtyByCode.get(p.codigoAb) ?? 0}
                      onOpen={onOpenProduct}
                      onAdd={onAdd}
                      onSetQty={onSetQty}
                    />
                  ))}
                </div>
              </section>
            );
          }

          case "rich-text": {
            const layout = asStr(props.layout) || (asStr(props.image) ? "split" : "plain");
            const image = asStr(props.image);
            const title = asStr(props.title);
            const body = asStr(props.body);
            const signature = asStr(props.signature);
            const logoUrl = asStr(props.logoUrl);
            const tone = asStr(props.tone) || (layout === "split" ? "brand" : "surface");
            const imageRight = asStr(props.imageSide) === "right";

            if (layout === "split" && image) {
              const panelColor = asStr(props.panelColor);
              return (
                <section
                  key={idx}
                  className={`landing-block landing-rich landing-rich--split tone-${tone}${imageRight ? " image-right" : ""}`}
                >
                  <div className="landing-rich-media">
                    <img src={image} alt={asStr(props.imageAlt) || title || ""} />
                  </div>
                  <div className="landing-rich-panel" style={panelColor ? { background: panelColor } : undefined}>
                    <div className="landing-rich-panel-inner">
                      {title ? <h2>{title}</h2> : null}
                      {body ? <p>{body}</p> : null}
                      {signature ? <span className="landing-rich-sign">{signature}</span> : null}
                      {logoUrl ? <img className="landing-rich-logo" src={logoUrl} alt="" /> : null}
                      <hr className="landing-rich-rule" />
                    </div>
                  </div>
                </section>
              );
            }

            return (
              <section key={idx} className={`landing-block landing-padded landing-rich ${asStr(props.align) === "center" ? "center" : ""}`}>
                {title ? <h2>{title}</h2> : null}
                {body ? <p>{body}</p> : null}
              </section>
            );
          }

          case "video":
            return (
              <section key={idx} className="landing-block landing-padded landing-video">
                {asStr(props.title) ? <h2 className="landing-title">{asStr(props.title)}</h2> : null}
                {asStr(props.url) ? (
                  <div className="video-frame">
                    <iframe title={asStr(props.title) || "video"} src={asStr(props.url)} allowFullScreen loading="lazy" />
                  </div>
                ) : asStr(props.poster) ? (
                  <div className="video-poster">
                    <img src={asStr(props.poster)} alt="" />
                    {asStr(props.body) ? <p>{asStr(props.body)}</p> : null}
                  </div>
                ) : asStr(props.body) ? (
                  <p>{asStr(props.body)}</p>
                ) : null}
              </section>
            );

          case "feature-cards": {
            const items = Array.isArray(props.items) ? (props.items as Array<Record<string, string>>) : [];
            return (
              <section key={idx} className="landing-block landing-padded">
                {asStr(props.title) ? <h2 className="landing-title">{asStr(props.title)}</h2> : null}
                <div className="feature-cards">
                  {items.map((it, i) => (
                    <button key={i} type="button" className="feature-card" onClick={() => onGoTab(it.hrefTab || "menu")}>
                      {it.image ? <img src={it.image} alt="" /> : null}
                      <strong>{it.title}</strong>
                      {it.body ? <span>{it.body}</span> : null}
                      {it.priceHint ? <em>{it.priceHint}</em> : null}
                    </button>
                  ))}
                </div>
              </section>
            );
          }

          case "footer-social": {
            const links = Array.isArray(props.links) ? (props.links as Array<Record<string, string>>) : [];
            const title = asStr(props.title);
            const tagline = asStr(props.tagline);
            const logoUrl = asStr(props.logoUrl);
            const legal = asStr(props.legal);
            return (
              <footer key={idx} className="landing-block landing-social">
                <div className="landing-social-inner">
                  {logoUrl ? <img className="landing-social-logo" src={logoUrl} alt={title || ""} /> : null}
                  {title ? <strong className="landing-social-title">{title}</strong> : null}
                  {tagline ? <p className="landing-social-tagline">{tagline}</p> : null}
                  <div className="social-links">
                    {links.map((l, i) => (
                      <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" aria-label={l.label} title={l.label}>
                        <iconify-icon icon={l.icon || "mdi:link"} width="22" height="22"></iconify-icon>
                        <span>{l.label}</span>
                      </a>
                    ))}
                  </div>
                  {legal ? <p className="landing-social-legal">{legal}</p> : null}
                </div>
              </footer>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}

export function LocationsDriver({
  locations,
  hub,
}: {
  locations: SiteLocation[];
  hub?: LocationsHub | null;
}) {
  if (!locations.length) {
    return (
      <div className="empty">
        <p>No hay puntos de venta configurados.</p>
      </div>
    );
  }

  const byRegion = new Map<string, SiteLocation[]>();
  for (const loc of locations) {
    const key = loc.region || loc.city || "Otros";
    const list = byRegion.get(key) || [];
    list.push(loc);
    byRegion.set(key, list);
  }

  const regions = hub?.regions?.length
    ? hub.regions
    : [...byRegion.keys()].map((name) => ({
        id: name,
        name,
        blurb: `${byRegion.get(name)?.length || 0} puntos`,
        url: byRegion.get(name)?.[0]?.regionUrl,
      }));

  return (
    <div className="locations-page">
      <header className="locations-hero">
        <p className="landing-kicker">Oficiales</p>
        <h2>{hub?.title || "Puntos de venta oficiales"}</h2>
        {hub?.intro ? <p className="locations-intro">{hub.intro}</p> : null}
        {hub?.sourceUrl ? (
          <a className="locations-source" href={hub.sourceUrl} target="_blank" rel="noopener noreferrer">
            Ver en donjacobo.com.co
          </a>
        ) : null}
      </header>

      <section className="locations-regions">
        <h3 className="landing-title">Encuentra tu región</h3>
        <div className="region-grid">
          {regions.map((r) => {
            const count = locations.filter((l) => l.regionId === r.id || l.region === r.name).length;
            return (
              <a key={r.id} className="region-card" href={`#region-${r.id}`}>
                <strong>{r.name}</strong>
                <span>{r.blurb || `${count} puntos oficiales`}</span>
                <em>{count ? `${count} locales` : "Ver puntos"}</em>
              </a>
            );
          })}
        </div>
      </section>

      {[...byRegion.entries()].map(([regionName, list]) => {
        const regionId = list[0]?.regionId || regionName;
        return (
          <section key={regionName} id={`region-${regionId}`} className="locations-region-block">
            <div className="locations-region-head">
              <h3>{regionName}</h3>
              <span>{list.length} puntos</span>
            </div>
            <ul className="locations-list">
              {list.map((loc, i) => (
                <li key={loc.id || i} className="location-card">
                  <strong>{loc.name}</strong>
                  {loc.city && loc.city !== loc.region ? <span className="location-city">{loc.city}</span> : null}
                  {loc.address ? (
                    <span className="location-row">
                      <iconify-icon icon="mdi:map-marker" width="16" height="16"></iconify-icon>
                      {loc.address}
                    </span>
                  ) : null}
                  {loc.hours ? (
                    <span className="location-row muted">
                      <iconify-icon icon="mdi:clock-outline" width="16" height="16"></iconify-icon>
                      {loc.hours}
                    </span>
                  ) : null}
                  <div className="location-actions">
                    {loc.phone ? (
                      <a href={`tel:${loc.phone.replace(/\s/g, "")}`}>
                        <iconify-icon icon="mdi:phone" width="16" height="16"></iconify-icon>
                        Llamar
                      </a>
                    ) : null}
                    {loc.whatsappUrl ? (
                      <a href={loc.whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <iconify-icon icon="mdi:whatsapp" width="16" height="16"></iconify-icon>
                        WhatsApp
                      </a>
                    ) : null}
                    {loc.mapUrl ? (
                      <a href={loc.mapUrl} target="_blank" rel="noopener noreferrer">
                        <iconify-icon icon="mdi:map-search" width="16" height="16"></iconify-icon>
                        Cómo llegar
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

type GridProps = {
  products: Product[];
  q: string;
  catFilter: string;
  onOpen: (p: Product) => void;
  onAdd: (p: Product) => void;
  onSetQty: (codigoAb: string, qty: number) => void;
  qtyByCode: Map<string, number>;
};

/** Grid continuo ordenado por categoría (sin filas que interrumpan). */
export function CatalogGridDriver({ products, q, catFilter, onOpen, onAdd, onSetQty, qtyByCode }: GridProps) {
  const qq = q.trim().toLowerCase();
  const list = [...products]
    .filter((p) => {
      if (catFilter && p.categoria !== catFilter) return false;
      if (!qq) return true;
      return p.nombre.toLowerCase().includes(qq) || (p.descripcion || "").toLowerCase().includes(qq);
    })
    .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre));

  if (!list.length) {
    return (
      <div className="empty">
        <p>Sin productos</p>
      </div>
    );
  }

  return (
    <div className="product-grid uninterrupted">
      {list.map((p) => (
        <ProductCard
          key={p.codigoAb}
          p={p}
          layout="grid"
          showCategory
          qty={qtyByCode.get(p.codigoAb) ?? 0}
          onOpen={onOpen}
          onAdd={onAdd}
          onSetQty={onSetQty}
        />
      ))}
    </div>
  );
}
