import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createOrder,
  fetchAdminOrders,
  fetchBrand,
  fetchCatalog,
  fetchOrderPublic,
  fetchOrderWhatsApp,
  patchOrderStatus,
} from "./api";
import { apiBase, appId, isEmbedMode, loadConfig, storageKey } from "./config";
import { applyBrandTheme, readCachedBrand, writeCachedBrand } from "./brand";
import { ProductCard } from "./components/ProductCard";
import { CartPanel } from "./components/CartPanel";
import { OrderPanel } from "./components/OrderPanel";
import { PedidosLookup } from "./components/PedidosLookup";
import { ThemeToggle } from "./components/ThemeToggle";
import { DevFooter } from "./components/DevFooter";
import { OrderReadyDialog } from "./components/OrderReadyDialog";
import { AdminCatalog } from "./components/AdminCatalog";
import { isAdminView, orderViewUrl, readRoute, writeAdminView, writeRoute } from "./nav";
import { openOrderWhatsApp } from "./whatsapp";
import { useWa } from "./hooks/useWa";
import { money } from "./money";
import { CatalogGridDriver, LandingDriver, LocationsDriver } from "./components/SiteDrivers";
import { resolveSite } from "./site";
import type {
  BrandIdentity,
  CartItem,
  CatalogResponse,
  Customer,
  Order,
  Product,
  RouteState,
  SiteConfig,
  ThemeMode,
} from "./types";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(storageKey("cart"));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function readTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(storageKey("theme"));
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  const cached = readCachedBrand();
  if (cached?.defaultTheme === "light" || cached?.defaultTheme === "dark") return cached.defaultTheme;
  return "dark";
}

function emptyCustomer(): Customer {
  return {
    nombre: "",
    telefono: "",
    direccion: "",
    barrio: "",
    observaciones: "",
    modalidad: "domicilio",
  };
}

function productBlurb(p: Product): string {
  const d = (p.descripcion || "").trim();
  if (!d || d === "undefined") return "";
  return d.length > 90 ? `${d.slice(0, 90)}…` : d;
}

function slValue(e: Event): string {
  const t = e.target as HTMLInputElement & { value?: string };
  return String(t?.value ?? "");
}

/** Web Awesome: wa-option value sin espacios — slug estable. */
function catSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase() || "CAT";
}

export function App() {
  const [adminView, setAdminView] = useState(isAdminView);
  const [route, setRoute] = useState<RouteState>(readRoute);
  const [brand, setBrand] = useState<BrandIdentity | null>(readCachedBrand);
  const [site, setSite] = useState<SiteConfig>(() => resolveSite(undefined, readCachedBrand()));
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [detail, setDetail] = useState<Product | null>(null);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<ThemeMode>(readTheme);
  const [orderView, setOrderView] = useState<Order | { error: string } | null>(null);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminToken, setAdminToken] = useState(
    () => localStorage.getItem(storageKey("authJwt")) || localStorage.getItem(storageKey("adminToken")) || "",
  );
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [placing, setPlacing] = useState(false);
  const [orderModal, setOrderModal] = useState<{ id: string; reused: boolean; url: string } | null>(null);
  const [waSending, setWaSending] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);

  const onSearch = useCallback((e: Event) => setQ(slValue(e)), []);
  const searchRef = useWa("wa-input", onSearch);
  const searchClearRef = useWa("wa-clear", useCallback(() => setQ(""), []));
  const catClearRef = useWa("wa-clear", useCallback(() => setCatFilter(""), []));

  const searchBind = useCallback(
    (el: HTMLElement | null) => {
      searchRef(el);
      searchClearRef(el);
    },
    [searchRef, searchClearRef],
  );

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => {
    applyBrandTheme(brand, theme);
  }, [theme, brand]);

  useEffect(() => {
    const def = brand?.defaultTheme;
    if (def !== "light" && def !== "dark") return;
    try {
      if (localStorage.getItem(storageKey("theme"))) return;
    } catch {
      return;
    }
    setTheme(def);
  }, [brand?.defaultTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: ThemeMode = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(storageKey("theme"), next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onPop = () => {
      setAdminView(isAdminView());
      setRoute(readRoute());
    };
    window.addEventListener("popstate", onPop);
    // migra hash viejo → ?s=
    if (location.hash.startsWith("#/")) {
      const h = location.hash.replace(/^#/, "");
      const m = /^\/p\/([A-Za-z0-9]+)/.exec(h);
      if (m?.[1]) writeRoute("pedido", m[1], true);
      else {
        const tab = h.replace(/^\//, "").split("/")[0] || "menu";
        writeRoute(tab, null, true);
      }
      setRoute(readRoute());
    } else if (!isAdminView() && !new URLSearchParams(location.search).has("s") && location.search === "" && !location.hash) {
      writeRoute("menu", null, true);
    }
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey("cart"), JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        await loadConfig();
        if (adminView) {
          const brandRes = await fetchBrand();
          if (cancelled) return;
          setBrand(brandRes.brand);
          writeCachedBrand(brandRes.brand);
          setSite(resolveSite(brandRes.site, brandRes.brand));
          applyBrandTheme(brandRes.brand, theme);
          setError("");
        } else {
          const [brandRes, catalogRes] = await Promise.all([fetchBrand(), fetchCatalog()]);
          if (cancelled) return;
          setBrand(brandRes.brand);
          writeCachedBrand(brandRes.brand);
          const nextSite = resolveSite(catalogRes.store.site || brandRes.site, brandRes.brand);
          setSite(nextSite);
          setCatalog(catalogRes);
          applyBrandTheme(brandRes.brand, theme);
          // default tab from site if URL is bare menu
          if (!new URLSearchParams(location.search).get("s") && nextSite.defaultTab && nextSite.defaultTab !== "menu") {
            writeRoute(nextSite.defaultTab, null, true);
            setRoute(readRoute());
          }
          setError("");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminView]);

  useEffect(() => {
    if (route.tab !== "pedido" || !route.orderId) {
      setOrderView(null);
      return;
    }
    const id = route.orderId;
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchOrderPublic(id);
        if (!cancelled) setOrderView(data.order);
      } catch (e) {
        if (!cancelled) setOrderView({ error: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route]);

  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    (el as HTMLElement & { open: boolean }).open = !!detail;
    const hide = () => setDetail(null);
    el.addEventListener("wa-after-hide", hide);
    return () => el.removeEventListener("wa-after-hide", hide);
  }, [detail]);

  const products = catalog?.products ?? [];
  const categorias = catalog?.store.categorias ?? [];
  const display = catalog?.store.display ?? {};
  const prices = catalog?.store.prices ?? {};
  const carouselIdx = catalog?.store.carousel ?? [];

  const catBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categorias) m.set(catSlug(c), c);
    return m;
  }, [categorias]);

  const onCat = useCallback(
    (e: Event) => {
      const slug = slValue(e);
      if (!slug) {
        setCatFilter("");
        return;
      }
      setCatFilter(catBySlug.get(slug) ?? slug);
    },
    [catBySlug],
  );
  const catRef = useWa("wa-change", onCat);
  const catBind = useCallback(
    (el: HTMLElement | null) => {
      catRef(el);
      catClearRef(el);
    },
    [catRef, catClearRef],
  );

  const qtyByCode = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of cart) m.set(it.codigoAb, it.qty);
    return m;
  }, [cart]);

  const heroItems = useMemo(() => {
    const fromCarousel = carouselIdx.map((i) => products[Number(i)]).filter((p): p is Product => !!p);
    const fallback = products.slice(0, 3);
    return [...fromCarousel, ...fallback]
      .filter((p, idx, arr) => arr.findIndex((x) => x.codigoAb === p.codigoAb) === idx)
      .slice(0, 6);
  }, [carouselIdx, products]);

  const filteredCats = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const list = catFilter ? categorias.filter((c) => c === catFilter) : categorias;
    return list
      .map((cat) => ({
        cat,
        items: products.filter((p) => {
          if (p.categoria !== cat) return false;
          if (!qq) return true;
          return p.nombre.toLowerCase().includes(qq) || p.descripcion.toLowerCase().includes(qq);
        }),
      }))
      .filter((x) => x.items.length > 0);
  }, [categorias, products, q, catFilter]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.precio * i.qty, 0);
  const deliveryFee = Number(prices.delivery ?? display.valDomicilio ?? 0);
  const total = subtotal + deliveryFee;

  const addToCart = useCallback(
    (p: Product, qty = 1) => {
      setCart((prev) => {
        const i = prev.findIndex((x) => x.codigoAb === p.codigoAb);
        if (i >= 0) {
          const next = [...prev];
          const cur = next[i];
          if (!cur) return prev;
          next[i] = { ...cur, qty: cur.qty + qty };
          return next;
        }
        return [
          ...prev,
          {
            codigoAb: p.codigoAb,
            nombre: p.nombre,
            precio: Number(p.precioUnidad),
            qty,
            imagen: p.imagenMiniUrl || p.imagenUrl,
          },
        ];
      });
      notify(`Agregado: ${p.nombre}`);
    },
    [notify],
  );

  const setQty = (codigoAb: string, qty: number) => {
    setCart((prev) =>
      prev.map((x) => (x.codigoAb === codigoAb ? { ...x, qty } : x)).filter((x) => x.qty > 0),
    );
  };

  const go = (tab: string, orderId?: string | null) => {
    writeRoute(tab, orderId ?? null);
    setRoute(readRoute());
  };

  const setCust = (key: keyof Customer) => (e: Event) => {
    const value = slValue(e);
    setCustomer((c) => ({ ...c, [key]: value }));
  };

  const placeOrder = async () => {
    if (!cart.length) return notify("Carrito vacío");
    const minOrder = Number(prices.minOrder || 0);
    if (subtotal < minOrder) return notify(`Pedido mínimo ${money(minOrder)}`);
    try {
      setPlacing(true);
      const data = await createOrder({
        customer,
        items: cart,
        subtotal,
        deliveryFee,
        total,
        notes: customer.observaciones || "",
      });
      const viewUrl = data.url || orderViewUrl(data.id);
      setOrderModal({ id: data.id, reused: Boolean(data.reused), url: viewUrl });
      notify(data.reused ? `Pedido #${data.id} ya existía` : `Pedido #${data.id} creado`);
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e));
    } finally {
      setPlacing(false);
    }
  };

  const sendOrderWhatsApp = async () => {
    if (!orderModal) return;
    setWaSending(true);
    try {
      const wa = await fetchOrderWhatsApp(orderModal.id);
      window.open(wa.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch {
      openOrderWhatsApp(orderModal.url, brand?.whatsapp);
    } finally {
      setWaSending(false);
    }
  };

  const clearCartFromModal = () => {
    setCart([]);
    setOrderModal(null);
    notify("Carrito vacío");
  };

  const loadAdmin = async () => {
    try {
      localStorage.setItem(storageKey("authJwt"), adminToken);
      const data = await fetchAdminOrders(adminToken);
      setAdminOrders(data.orders);
      notify("Pedidos cargados");
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e));
    }
  };

  const patchStatus = async (id: string, status: string) => {
    try {
      await patchOrderStatus(adminToken, id, status);
      await loadAdmin();
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e));
    }
  };

  const logo =
    (brand?.logoUrl || brand?.logoDarkUrl || String(display.logo ?? "")).replace(/^http:/, "https:") || "";
  const storeName = brand?.name || "Tienda";
  const storeAddress = brand?.address || String(display.direccionDetallada ?? brand?.city ?? "");
  const storeIcon = brand?.icon || "mdi:storefront";
  const siteTabs = site.tabs?.length ? site.tabs : [{ id: "menu", label: "Menú", driver: "catalog-rows", icon: "mdi:food" }];
  const activeSiteTab = siteTabs.find((t) => t.id === route.tab);
  const activeDriver =
    route.tab === "carrito" || route.tab === "pedido" || route.tab === "pedidos" || route.tab === "admin"
      ? route.tab
      : activeSiteTab?.driver || (route.tab === "menu" ? "catalog-rows" : route.tab);
  const showCatalogToolbar = activeDriver === "catalog-rows" || activeDriver === "catalog-grid";

  if (adminView) {
    if (loading && !brand) {
      return (
        <div className="empty">
          <wa-spinner style={{ fontSize: "2.5rem" }}></wa-spinner>
          <p>Cargando admin…</p>
        </div>
      );
    }
    return (
      <AdminCatalog
        brandName={storeName}
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onExit={() => { writeAdminView(false, true); setAdminView(false); }}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className="app-top">
      <header className="app-header">
        <div className="header-left">
          <button type="button" className="brand" onClick={() => go(site.defaultTab || siteTabs[0]?.id || "menu")} aria-label="Inicio">
            {logo ? (
              <img src={logo} alt={storeName} />
            ) : (
              <iconify-icon icon={storeIcon} width="36" height="36" style={{ color: "var(--rg-accent)" }}></iconify-icon>
            )}
            <div>
              <h1>{storeName}</h1>
              {storeAddress ? <small title={storeAddress}>{storeAddress}</small> : null}
            </div>
          </button>
          <div className="brand-sep" aria-hidden="true" />
          <nav className="header-tabs" aria-label="Secciones">
            {siteTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tab-btn ${route.tab === t.id ? "active" : ""}`}
                onClick={() => go(t.id)}
              >
                <iconify-icon icon={t.icon || "mdi:circle-small"} width="18" height="18"></iconify-icon>
                <span className="label">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="header-actions">
          {toast ? <wa-badge variant="brand" pill>{toast}</wa-badge> : null}
          <button
            type="button"
            className={`tab-btn cart-btn ${route.tab === "carrito" ? "active" : ""}`}
            onClick={() => go("carrito")}
            aria-label="Carrito"
          >
            <iconify-icon icon="mdi:cart" width="18" height="18"></iconify-icon>
            <span className="label">Carrito</span>
            {cartCount > 0 ? <span className="badge">{cartCount}</span> : null}
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      {showCatalogToolbar && !loading && !error ? (
        <div className="toolbar">
          <wa-input ref={searchBind} placeholder="Buscar en el menú" with-clear size="s">
            <iconify-icon slot="start" icon="mdi:magnify"></iconify-icon>
          </wa-input>
          <wa-select ref={catBind} placeholder="Categoría" with-clear size="s">
            {categorias.map((c) => (
              <wa-option key={c} value={catSlug(c)}>{c}</wa-option>
            ))}
          </wa-select>
        </div>
      ) : null}
      </div>

      <main className="panel">
        <div className="panel-scroll">
          <div className="panel-main">
          {loading ? (
            <div className="empty">
              <wa-spinner style={{ fontSize: "2.5rem" }}></wa-spinner>
              <p>Cargando catálogo…</p>
            </div>
          ) : error ? (
            <div className="empty">
              <iconify-icon icon="mdi:cloud-alert"></iconify-icon>
              <p>{error}</p>
              <p style={{ fontSize: "0.85rem" }}>API: <code>{apiBase()}</code> · app: <code>{appId()}</code></p>
            </div>
          ) : activeDriver === "landing" ? (
            <LandingDriver
              site={site}
              products={products}
              categorias={categorias}
              carouselIdx={carouselIdx}
              qtyByCode={qtyByCode}
              onGoTab={(t) => go(t)}
              onOpenProduct={setDetail}
              onAdd={(p) => addToCart(p)}
              onSetQty={setQty}
            />
          ) : activeDriver === "locations" ? (
            <LocationsDriver locations={site.locations || []} hub={site.locationsHub} />
          ) : activeDriver === "catalog-grid" ? (
            <CatalogGridDriver
              products={products}
              q={q}
              catFilter={catFilter}
              onOpen={setDetail}
              onAdd={(p) => addToCart(p)}
              onSetQty={setQty}
              qtyByCode={qtyByCode}
            />
          ) : activeDriver === "catalog-rows" || route.tab === "menu" ? (
            <>
              {heroItems.length && !(site.landing?.sections?.some((s) => s.type === "carousel")) ? (
                <section className="hero">
                  <wa-carousel
                    loop
                    navigation
                    pagination
                    mouse-dragging
                    autoplay
                    autoplay-interval="7500"
                    slides-per-page="1"
                  >
                    {heroItems.map((p) => {
                      const blurb = productBlurb(p);
                      return (
                        <wa-carousel-item key={p.codigoAb}>
                          <div className="hero-slide" onClick={() => setDetail(p)}>
                            <img src={p.imagenUrl || p.imagenMiniUrl || ""} alt={p.nombre} />
                            <div className="hero-shade" aria-hidden="true" />
                            <div className="hero-caption">
                              <h2>{p.nombre}</h2>
                              {blurb ? <p>{blurb}</p> : null}
                              <span className="hero-price">{money(p.precioUnidad)}</span>
                            </div>
                          </div>
                        </wa-carousel-item>
                      );
                    })}
                  </wa-carousel>
                </section>
              ) : null}

              {filteredCats.length === 0 ? (
                <div className="empty">
                  <iconify-icon icon="mdi:magnify-close"></iconify-icon>
                  <p>Sin resultados para la búsqueda</p>
                </div>
              ) : (
                filteredCats.map(({ cat, items }) => (
                  <section key={cat} className="cat-section">
                    <div className="cat-head">
                      <h3>{cat}</h3>
                      <span>{items.length} ítems</span>
                    </div>
                    <div className="rail">
                      {items.map((p) => (
                        <ProductCard
                          key={p.codigoAb}
                          p={p}
                          qty={qtyByCode.get(p.codigoAb) ?? 0}
                          onOpen={setDetail}
                          onAdd={addToCart}
                          onSetQty={setQty}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </>
          ) : route.tab === "carrito" ? (
            <CartPanel
              cart={cart}
              setQty={setQty}
              customer={customer}
              setCust={setCust}
              prices={prices}
              display={display}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              total={total}
              placing={placing}
              placeOrder={() => void placeOrder()}
              go={go}
            />
          ) : route.tab === "pedido" && route.orderId ? (
            <OrderPanel order={orderView} orderId={route.orderId} onBack={() => go("menu")} />
          ) : route.tab === "pedidos" ? (
            <PedidosLookup
              onOpen={(id) => {
                go("pedido", id);
              }}
            />
          ) : (
            <div className="empty">
              <p>Sección no disponible</p>
            </div>
          )}
          </div>
          {!isEmbedMode() ? <DevFooter /> : null}
        </div>
      </main>

      <wa-drawer ref={drawerRef} label={detail?.nombre || "Producto"} style={{ "--size": "420px" }}>
        {detail ? (
          <>
            <div className="detail-body">
              {detail.imagenUrl || detail.imagenMiniUrl ? (
                <img className="detail-media" src={detail.imagenUrl || detail.imagenMiniUrl || ""} alt="" />
              ) : null}
              <div className="detail-price">{money(detail.precioUnidad)}</div>
              <p style={{ color: "var(--rg-muted)", lineHeight: 1.45 }}>
                {productBlurb(detail) || detail.descripcion || "Sin descripción"}
              </p>
            </div>
            <wa-button
              slot="footer"
              variant="brand"
              style={{ width: "100%" }}
              onClick={() => {
                addToCart(detail);
                setDetail(null);
              }}
            >
              Agregar al carrito
            </wa-button>
          </>
        ) : null}
      </wa-drawer>
      <OrderReadyDialog
        open={Boolean(orderModal)}
        orderId={orderModal?.id || ""}
        reused={Boolean(orderModal?.reused)}
        sending={waSending}
        onSendWhatsApp={() => void sendOrderWhatsApp()}
        onClearCart={clearCartFromModal}
        onViewOrder={() => {
          if (!orderModal) return;
          const id = orderModal.id;
          setOrderModal(null);
          go("pedido", id);
        }}
        onClose={() => setOrderModal(null)}
      />
    </div>
  );
}
