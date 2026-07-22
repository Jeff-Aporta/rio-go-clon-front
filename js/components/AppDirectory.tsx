import { useEffect, useState, type CSSProperties } from "react";
import { fetchAppsDirectory } from "../api";
import { apiBase, openAppConn } from "../config";
import { DevFooter } from "./DevFooter";
import { ThemeToggle } from "./ThemeToggle";
import type { AppDirectoryItem, ThemeMode } from "../types";

function readTheme(): ThemeMode {
  try {
    const v = localStorage.getItem("storefront:theme") || localStorage.getItem("riogo:theme");
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return "dark";
}

/** Directorio de tiendas cuando la URL no trae ?conn=. */
export function AppDirectory() {
  const [theme, setTheme] = useState<ThemeMode>(readTheme);
  const [apps, setApps] = useState<AppDirectoryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /* Hub = Dulce Clic (púrpura/magenta); no heredar data-app de la última tienda */
    const root = document.documentElement;
    root.setAttribute("data-app", "dulceclic");
    root.classList.add("wa-theme-shoelace", "wa-palette-shoelace");
    root.classList.toggle("wa-dark", theme === "dark");
    root.classList.toggle("wa-light", theme === "light");
    root.style.colorScheme = theme;
    /* Quitar overrides inline de brand de tienda (si quedaron) */
    for (const p of [
      "--rg-bg", "--rg-surface", "--rg-surface-2", "--rg-line", "--rg-text", "--rg-muted",
      "--rg-accent", "--rg-accent-2", "--rg-accent-fg", "--rg-ok", "--rg-danger",
      "--rg-header-bg", "--rg-price-bar", "--rg-hero-caption",
      "--wa-color-brand-fill-loud", "--wa-color-brand-fill-normal",
      "--wa-color-brand-50", "--wa-color-brand-60", "--wa-color-brand-on-loud",
    ]) {
      root.style.removeProperty(p);
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#faf5ff" : "#0b0712");
    document.title = "Dulce Clic — Pedidos online";
    try {
      localStorage.setItem("storefront:theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const res = await fetchAppsDirectory();
        if (!cancelled) {
          setApps(res.apps);
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
  }, []);

  return (
    <div className="app-shell hub-shell">
      <div className="app-top">
        <header className="app-header hub-header">
          <div className="header-left">
            <iconify-icon className="hub-logo" icon="fluent-emoji:artist-palette" width="32" height="32"></iconify-icon>
            <div>
              <strong className="brand-name">Dulce Clic</strong>
              <p className="hub-sub">Elige una tienda</p>
            </div>
          </div>
          <div className="header-actions">
            <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
          </div>
        </header>
      </div>

      <main className="hub-main">
        {loading && (
          <div className="boot hub-boot" role="status">
            <iconify-icon icon="svg-spinners:ring-resize" width="40" height="40"></iconify-icon>
            <p>Cargando apps…</p>
          </div>
        )}
        {!loading && error && (
          <div className="hub-error">
            <iconify-icon icon="mdi:cloud-off-outline" width="36" height="36"></iconify-icon>
            <p>{error}</p>
            <p className="hub-muted">
              API: <code>{apiBase()}</code>
            </p>
          </div>
        )}
        {!loading && !error && apps.length === 0 && (
          <p className="hub-muted hub-empty">No hay apps registradas en este worker.</p>
        )}
        {!loading && !error && apps.length > 0 && (
          <ul className="hub-grid">
            {apps.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="hub-card"
                  style={a.accent ? ({ ["--hub-accent"]: a.accent } as CSSProperties) : undefined}
                  onClick={() => openAppConn(a.id)}
                >
                  <span className="hub-card-icon" aria-hidden>
                    <iconify-icon icon={a.icon || "mdi:store"} width="36" height="36"></iconify-icon>
                  </span>
                  <span className="hub-card-body">
                    <strong>{a.name}</strong>
                    {a.tagline ? <span className="hub-muted">{a.tagline}</span> : null}
                    {a.city ? <span className="hub-city">{a.city}</span> : null}
                  </span>
                  <iconify-icon className="hub-chevron" icon="mdi:chevron-right" width="22" height="22"></iconify-icon>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <DevFooter />
    </div>
  );
}
