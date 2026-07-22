import type { CarouselSlide, Product } from "../types";
import type { SiteConfig, SiteLocation } from "../site";
import { popularProducts, resolveCarouselSlides } from "../site";
import { money } from "../money";

type Props = {
  site: SiteConfig;
  products: Product[];
  categorias: string[];
  carouselIdx: unknown;
  onGoTab: (tab: string) => void;
  onOpenProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
};

function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
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
export function LandingDriver({ site, products, categorias, carouselIdx, onGoTab, onOpenProduct, onAdd }: Props) {
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
                    return (
                      <sl-carousel-item key={slide.id || slide.imageUrl}>
                        {clickable ? (
                          <button
                            type="button"
                            className={`hero-slide${slide.codigoAb ? " hero-slide--product" : " hero-slide--banner"}`}
                            onClick={() => onSlideClick(slide, products, onGoTab, onOpenProduct)}
                          >
                            <img src={slide.imageUrl} alt={slide.alt || ""} />
                            {slide.codigoAb && slide.alt ? <span className="hero-cap">{slide.alt}</span> : null}
                          </button>
                        ) : (
                          <div className="hero-slide hero-slide--banner">
                            <img src={slide.imageUrl} alt={slide.alt || ""} />
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
                <h2 className="landing-title">{asStr(props.title) || "Populares"}</h2>
                <div className="product-grid uninterrupted">
                  {list.map((p) => (
                    <article key={p.codigoAb} className="grid-card">
                      <button type="button" className="grid-card-media" onClick={() => onOpenProduct(p)}>
                        {p.imagenMiniUrl || p.imagenUrl ? (
                          <img src={p.imagenMiniUrl || p.imagenUrl || ""} alt={p.nombre} />
                        ) : (
                          <iconify-icon icon="mdi:image-off" width="40" height="40"></iconify-icon>
                        )}
                      </button>
                      <div className="grid-card-body">
                        <strong>{p.nombre}</strong>
                        <span className="price">{money(p.precioUnidad)}</span>
                        <button type="button" className="landing-cta slim" onClick={() => onAdd(p)}>
                          Añadir
                        </button>
                      </div>
                    </article>
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

export function LocationsDriver({ locations }: { locations: SiteLocation[] }) {
  if (!locations.length) {
    return (
      <div className="empty">
        <p>No hay puntos de venta configurados.</p>
      </div>
    );
  }
  return (
    <ul className="locations-list">
      {locations.map((loc, i) => (
        <li key={loc.id || i} className="location-card">
          <strong>{loc.name}</strong>
          {loc.address ? <span>{loc.address}</span> : null}
          {loc.city ? <span className="muted">{loc.city}</span> : null}
          {loc.hours ? <span className="muted">{loc.hours}</span> : null}
          {loc.phone ? <a href={`tel:${loc.phone.replace(/\s/g, "")}`}>{loc.phone}</a> : null}
          {loc.mapUrl ? (
            <a href={loc.mapUrl} target="_blank" rel="noopener noreferrer">
              Ver mapa
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type GridProps = {
  products: Product[];
  q: string;
  catFilter: string;
  onOpen: (p: Product) => void;
  onAdd: (p: Product) => void;
  qtyByCode: Map<string, number>;
};

/** Grid continuo ordenado por categoría (sin filas que interrumpan). */
export function CatalogGridDriver({ products, q, catFilter, onOpen, onAdd, qtyByCode }: GridProps) {
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
        <article key={p.codigoAb} className="grid-card">
          <button type="button" className="grid-card-media" onClick={() => onOpen(p)}>
            {p.imagenMiniUrl || p.imagenUrl ? (
              <img src={p.imagenMiniUrl || p.imagenUrl || ""} alt={p.nombre} />
            ) : (
              <iconify-icon icon="mdi:image-off" width="40" height="40"></iconify-icon>
            )}
          </button>
          <div className="grid-card-body">
            <span className="grid-cat">{p.categoria}</span>
            <strong>{p.nombre}</strong>
            <span className="price">{money(p.precioUnidad)}</span>
            <button type="button" className="landing-cta slim" onClick={() => onAdd(p)}>
              {qtyByCode.get(p.codigoAb) ? `En carrito (${qtyByCode.get(p.codigoAb)})` : "Añadir"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
