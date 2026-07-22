import type { CarouselSlide, FeatureCardItem, FooterColumn, LocationsHub, Product } from "../types";
import type { SiteConfig, SiteLocation } from "../site";
import { popularProducts, resolveCarouselSlides } from "../site";
import { panelBg } from "../panelBg";
import { tmHtml, tmText } from "../tm";
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

/** Body de SITE: HTML simple o texto plano. */
function RichBody({ body, className }: { body: string; className?: string }) {
  if (!body) return null;
  if (/<[a-z]/i.test(body)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: tmHtml(body) }} />;
  }
  return <p className={className}>{tmText(body)}</p>;
}

type SplitPromoProps = {
  title?: string;
  body?: string;
  lead?: string;
  priceHint?: string;
  image?: string;
  imageAlt?: string;
  imageSide?: "left" | "right";
  tone?: string;
  panelColor?: string;
  panelAlpha?: number;
  signature?: string;
  logoUrl?: string;
  ctaLabel?: string;
  onCta?: () => void;
  /** brand gratitud: rule al final; promo: rule bajo el título */
  ruleAfterTitle?: boolean;
};

function SplitPromo({
  title,
  body,
  lead,
  priceHint,
  image,
  imageAlt,
  imageSide = "left",
  tone = "promo",
  panelColor,
  panelAlpha = 90,
  signature,
  logoUrl,
  ctaLabel,
  onCta,
  ruleAfterTitle = true,
}: SplitPromoProps) {
  const imageRight = imageSide === "right";
  const bg = panelColor
    ? panelBg(panelColor, panelAlpha)
    : tone === "brand"
      ? panelBg("#c7253c", panelAlpha)
      : undefined;
  return (
    <section className={`landing-block landing-rich landing-rich--split tone-${tone}${imageRight ? " image-right" : ""}`}>
      {image ? (
        <div className="landing-rich-media">
          <img src={image} alt={imageAlt || title || ""} />
        </div>
      ) : null}
      <div className="landing-rich-panel" style={bg ? { background: bg } : undefined}>
        <div className="landing-rich-panel-inner">
          {title ? <h2>{tmText(title)}</h2> : null}
          {ruleAfterTitle ? <hr className="landing-rich-rule" /> : null}
          {lead ? <p className="landing-rich-lead">{tmText(lead)}</p> : null}
          <RichBody body={body || ""} className="landing-rich-body" />
          {priceHint ? <p className="landing-rich-price">{tmText(priceHint)}</p> : null}
          {signature ? <span className="landing-rich-sign">{signature}</span> : null}
          {logoUrl ? <img className="landing-rich-logo" src={logoUrl} alt="" /> : null}
          {!ruleAfterTitle ? <hr className="landing-rich-rule" /> : null}
          {ctaLabel && onCta ? (
            <button type="button" className={`landing-cta${tone === "promo" ? " landing-cta--bakery" : ""}`} onClick={onCta}>
              {ctaLabel}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
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
                <wa-carousel navigation pagination autoplay className="hero-carousel">
                  {slides.map((slide) => {
                    const clickable = !!(slide.hrefUrl || slide.hrefTab || slide.codigoAb);
                    const kind = slide.codigoAb ? "hero-slide--product" : "hero-slide--banner";
                    return (
                      <wa-carousel-item key={slide.id || slide.imageUrl}>
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
                      </wa-carousel-item>
                    );
                  })}
                </wa-carousel>
              </section>
            );
          }

          case "category-tiles":
            return (
              <section key={idx} className="landing-block landing-padded">
                <p className="landing-kicker">Colecciones</p>
                {asStr(props.title) ? <h2 className="landing-title">{tmText(asStr(props.title))}</h2> : null}
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
                  <h2>{tmText(asStr(props.title))}</h2>
                  {asStr(props.body) ? <p>{tmText(asStr(props.body))}</p> : null}
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
                <h2 className="landing-title">{tmText(asStr(props.title) || "Populares")}</h2>
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
            const imageSide = (asStr(props.imageSide) === "right" ? "right" : "left") as "left" | "right";
            const panelColor = asStr(props.panelColor);
            const ctaLabel = asStr(props.ctaLabel);
            const alpha = typeof props.panelAlpha === "number" ? props.panelAlpha : 90;

            if (layout === "split" && image) {
              return (
                <SplitPromo
                  key={idx}
                  title={title}
                  body={body}
                  image={image}
                  imageAlt={asStr(props.imageAlt)}
                  imageSide={imageSide}
                  tone={tone}
                  panelColor={panelColor || (tone === "brand" ? "#c7253c" : undefined)}
                  panelAlpha={alpha}
                  signature={signature}
                  logoUrl={logoUrl}
                  ctaLabel={ctaLabel}
                  onCta={ctaLabel ? () => onGoTab(asStr(props.ctaTab) || "menu") : undefined}
                  ruleAfterTitle={tone === "promo"}
                />
              );
            }

            return (
              <section key={idx} className={`landing-block landing-padded landing-rich ${asStr(props.align) === "center" ? "center" : ""}`}>
                {title ? <h2>{title}</h2> : null}
                {body ? <p>{body}</p> : null}
              </section>
            );
          }

          case "feature-cards": {
            const items = Array.isArray(props.items) ? (props.items as FeatureCardItem[]) : [];
            return (
              <div key={idx} className="landing-feature-splits">
                {asStr(props.title) ? (
                  <div className="landing-padded">
                    <h2 className="landing-title">{asStr(props.title)}</h2>
                  </div>
                ) : null}
                {items.map((it, i) => {
                  const side =
                    it.imageSide === "left" || it.imageSide === "right"
                      ? it.imageSide
                      : i % 2 === 1
                        ? "right"
                        : "left";
                  const tone = it.tone || "promo";
                  const panelColor = it.panelColor || (tone === "promo" ? "#f7dcd3" : tone === "brand" ? "#c7253c" : undefined);
                  return (
                    <SplitPromo
                      key={i}
                      title={it.title}
                      lead={it.lead}
                      body={it.body}
                      priceHint={it.priceHint}
                      image={it.image}
                      imageSide={side}
                      tone={tone}
                      panelColor={panelColor}
                      panelAlpha={typeof it.panelAlpha === "number" ? it.panelAlpha : 100}
                      ctaLabel={it.ctaLabel || "Descúbrela aquí"}
                      onCta={() => onGoTab(it.hrefTab || "menu")}
                      ruleAfterTitle
                    />
                  );
                })}
              </div>
            );
          }

          case "video": {
            const title = asStr(props.title);
            const body = asStr(props.body);
            const highlight = asStr(props.highlight);
            const url = asStr(props.url);
            const poster = asStr(props.poster);
            const ctaLabel = asStr(props.ctaLabel);
            const ctaTab = asStr(props.ctaTab) || "menu";
            return (
              <section key={idx} className="landing-block landing-video">
                <div className="landing-video-grid">
                  <div className="landing-video-copy">
                    {title ? <h2>{tmText(title)}</h2> : null}
                    <RichBody body={body} className="landing-video-body" />
                    {highlight ? <p className="landing-video-highlight">{tmText(highlight)}</p> : null}
                    {ctaLabel ? (
                      <button type="button" className="landing-cta landing-cta--bakery" onClick={() => onGoTab(ctaTab)}>
                        {ctaLabel}
                      </button>
                    ) : null}
                  </div>
                  <div className="landing-video-media">
                    {url ? (
                      <div className="landing-video-frame">
                        <iframe
                          title={title || "video"}
                          src={url}
                          allow="autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    ) : poster ? (
                      <img className="landing-video-poster" src={poster} alt="" />
                    ) : null}
                  </div>
                </div>
              </section>
            );
          }

          case "footer-social": {
            const columns = Array.isArray(props.columns) ? (props.columns as FooterColumn[]) : [];
            const links = Array.isArray(props.links) ? (props.links as Array<Record<string, string>>) : [];
            const title = asStr(props.title);
            const tagline = asStr(props.tagline);
            const logoUrl = asStr(props.logoUrl);
            const legal = asStr(props.legal);

            if (columns.length) {
              return (
                <footer key={idx} className="landing-block landing-social landing-social--columns">
                  <div className="landing-footer-grid">
                    {columns.map((col, ci) => (
                      <div key={ci} className="landing-footer-col">
                        {col.title ? <h3>{col.title}</h3> : null}
                        {col.links?.length ? (
                          <ul>
                            {col.links.map((l, li) => (
                              <li key={li}>
                                <a href={l.url} target="_blank" rel="noopener noreferrer">
                                  {l.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {col.note ? <p className="landing-footer-note">{col.note}</p> : null}
                        {col.ctaLabel && col.ctaUrl ? (
                          <a className="landing-footer-cta" href={col.ctaUrl} target="_blank" rel="noopener noreferrer">
                            {col.ctaLabel}
                          </a>
                        ) : null}
                        {col.phone ? (
                          <a className="landing-footer-contact" href={`tel:${col.phone.replace(/\s/g, "")}`}>
                            <iconify-icon icon="mdi:phone" width="18" height="18"></iconify-icon>
                            <span>{col.phone}</span>
                          </a>
                        ) : null}
                        {col.email ? (
                          <a className="landing-footer-contact" href={`mailto:${col.email}`}>
                            <iconify-icon icon="mdi:email-outline" width="18" height="18"></iconify-icon>
                            <span>{col.email}</span>
                          </a>
                        ) : null}
                        {col.whatsappLabel && col.whatsappUrl ? (
                          <a className="landing-footer-cta landing-footer-wa" href={col.whatsappUrl} target="_blank" rel="noopener noreferrer">
                            <iconify-icon icon="mdi:whatsapp" width="18" height="18"></iconify-icon>
                            <span>{col.whatsappLabel}</span>
                          </a>
                        ) : null}
                        {col.social?.length ? (
                          <div className="landing-footer-social">
                            {col.social.map((s, si) => (
                              <a key={si} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                                <iconify-icon icon={s.icon || "mdi:link"} width="22" height="22"></iconify-icon>
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {legal ? <p className="landing-social-legal">{legal}</p> : null}
                </footer>
              );
            }

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
