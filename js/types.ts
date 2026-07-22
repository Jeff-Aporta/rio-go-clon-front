export type Modalidad = "domicilio" | "recoger";

export type OrderStatus = "nuevo" | "preparando" | "listo" | "entregado" | "cancelado" | string;

export type ThemeMode = "dark" | "light";

/** Paleta por modo — idéntica al contrato API /api/brand. */
export type ThemePalette = {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  ok: string;
  danger: string;
  headerBg: string;
  priceBar: string;
  heroCaption: string;
};

/** Identidad de marca — misma forma en cualquier server compatible. */
export type BrandIdentity = {
  id: string;
  name: string;
  legalName?: string;
  tagline?: string;
  city?: string;
  address?: string;
  icon?: string;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  currency?: string;
  locale?: string;
  defaultTheme?: ThemeMode;
  whatsapp?: string;
  /** Opcional: si falta, el front usa paletas base (CSS). */
  themes?: {
    dark?: ThemePalette;
    light?: ThemePalette;
  };
};

export type BrandResponse = {
  ok: true;
  brand: BrandIdentity;
  site?: SiteConfig;
  appId?: string;
  contractVersion: number;
};

export type CartItem = {
  codigoAb: string;
  nombre: string;
  precio: number;
  qty: number;
  imagen?: string | null;
  extras?: unknown;
  note?: string;
};

export type Customer = {
  nombre: string;
  telefono: string;
  direccion: string;
  barrio: string;
  observaciones: string;
  modalidad: Modalidad;
};

export type ProductImage = {
  id: string;
  url: string;
  miniUrl?: string | null;
  descripcion?: string;
  portada?: boolean;
  sort: number;
};

export type Product = {
  codigoAb: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  precioBase: number;
  precioUnidad: number;
  imagenUrl: string | null;
  imagenMiniUrl: string | null;
  imagenes?: ProductImage[];
  cantidad: number;
  combo: unknown;
  pizza: unknown;
  sugerencia: unknown;
  productoSin: unknown;
  negocio: string | null;
  idCategoria: string | null;
  sortOrder?: number;
  timesOrdered?: number;
};

export type StoreDisplay = {
  logo?: string;
  valDomicilio?: number;
  direccionDetallada?: string;
  wsNotificacion?: string;
  [key: string]: unknown;
};

export type StorePrices = {
  delivery?: number;
  minOrder?: number;
  minPSE?: number;
  recargos?: unknown[];
  precioBarrios?: unknown[];
};

export type CatalogStore = {
  display: StoreDisplay;
  prices: StorePrices;
  categorias: string[];
  carousel: number[];
  site?: SiteConfig;
  updatedAt?: string;
};

export type CatalogResponse = {
  ok: true;
  store: CatalogStore;
  brand?: BrandIdentity;
  products: Product[];
  meta?: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    pages: number;
  };
  listFilters?: Record<string, unknown>;
};

/** Tabs / landing / locales — mismo contrato que STORE.SITE. */
export type SiteTab = {
  id: string;
  label: string;
  driver: "landing" | "catalog-rows" | "catalog-grid" | "locations" | string;
  icon?: string;
};

/** Slide del carrusel — banner publicitario o producto (mismo contrato API). */
export type CarouselSlide = {
  id?: string;
  imageUrl: string;
  alt?: string;
  codigoAb?: string;
  hrefTab?: string;
  hrefUrl?: string;
};

export type SocialLink = {
  label: string;
  url: string;
  icon?: string;
};

export type FooterSocialProps = {
  title?: string;
  tagline?: string;
  logoUrl?: string;
  links?: SocialLink[];
  legal?: string;
};

export type RichTextProps = {
  title?: string;
  body: string;
  align?: "left" | "center" | string;
  layout?: "plain" | "split";
  image?: string;
  imageAlt?: string;
  imageSide?: "left" | "right";
  signature?: string;
  logoUrl?: string;
  tone?: "brand" | "surface";
  panelColor?: string;
};

export type LandingSection =
  | { type: "carousel"; props?: { slides?: CarouselSlide[] } & Record<string, unknown> }
  | { type: "category-tiles"; props?: { title?: string } }
  | { type: "hero"; props: { title: string; body?: string; image?: string; ctaLabel?: string; ctaTab?: string } }
  | { type: "popular-products"; props?: { title?: string; limit?: number } }
  | { type: "rich-text"; props: RichTextProps }
  | { type: "video"; props: { title?: string; url?: string; poster?: string; body?: string } }
  | {
      type: "feature-cards";
      props: {
        title?: string;
        items: Array<{ title: string; body?: string; image?: string; priceHint?: string; hrefTab?: string }>;
      };
    }
  | { type: "footer-social"; props?: FooterSocialProps }
  | { type: string; props?: Record<string, unknown> };

export type SiteLocation = {
  id?: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  hours?: string;
  mapUrl?: string;
  region?: string;
  regionId?: string;
  regionUrl?: string;
  whatsappUrl?: string;
};

export type LocationsHub = {
  title?: string;
  intro?: string;
  sourceUrl?: string;
  regions?: Array<{ id: string; name: string; blurb?: string; url?: string }>;
};

export type SiteConfig = {
  brand?: Partial<BrandIdentity>;
  tabs?: SiteTab[];
  landing?: { sections?: LandingSection[] };
  locations?: SiteLocation[];
  locationsHub?: LocationsHub;
  categoryImages?: Record<string, string>;
  defaultTab?: string;
};

/** Filtro ISS (QUERY /api/catalog). */
export type IssListFilter = {
  search?: string;
  searchColumn?: string;
  limit?: number;
  offset?: number;
  eq?: Record<string, string | number | boolean>;
  sort?: string;
  distinct?: string[];
};

export type Order = {
  id: string;
  status: OrderStatus;
  customer: Partial<Customer> & Record<string, unknown>;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type RouteState =
  | { tab: string; orderId: null }
  | { tab: "pedido"; orderId: string };

export type ApiOk<T> = { ok: true } & T;
export type ApiErr = { ok: false; error: string };

/** Item del directorio GET /api/apps. */
export type AppDirectoryItem = {
  id: string;
  name: string;
  tagline?: string;
  city?: string;
  icon?: string;
  accent?: string;
};

export type AppsDirectoryResponse = {
  ok: true;
  apps: AppDirectoryItem[];
  contractVersion: number;
};

/** config.json + opcional ?conn= (b64url { apiBase, appId, storagePrefix? }). */
export type FrontConfig = {
  apiBase: string;
  /** Tenant en el worker (X-App-Id). Default riogo. */
  appId?: string;
  storagePrefix?: string;
  comment?: string;
};
