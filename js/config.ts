import type { FrontConfig } from "./types";

declare global {
  interface Window {
    __STOREFRONT_CONFIG__?: FrontConfig;
    __STOREFRONT_API__?: string;
    /** @deprecated usar __STOREFRONT_API__ */
    __RIOGO_API__?: string;
  }
}

let cfg: FrontConfig | null = null;
let cfgPromise: Promise<FrontConfig> | null = null;

const DEFAULT_CFG: FrontConfig = {
  apiBase: "http://127.0.0.1:8805",
  storagePrefix: "storefront",
};

export async function loadConfig(): Promise<FrontConfig> {
  if (cfg) return cfg;
  if (typeof window !== "undefined" && window.__STOREFRONT_CONFIG__?.apiBase) {
    cfg = { ...DEFAULT_CFG, ...window.__STOREFRONT_CONFIG__ };
    return cfg;
  }
  if (!cfgPromise) {
    cfgPromise = fetch(new URL("config.json", document.baseURI || location.href))
      .then(async (r) => {
        if (!r.ok) throw new Error(`config.json HTTP ${r.status}`);
        return (await r.json()) as FrontConfig;
      })
      .catch(() => DEFAULT_CFG)
      .then((j) => {
        cfg = { ...DEFAULT_CFG, ...j, apiBase: String(j.apiBase || DEFAULT_CFG.apiBase).replace(/\/$/, "") };
        if (typeof window !== "undefined") window.__STOREFRONT_CONFIG__ = cfg;
        return cfg;
      });
  }
  return cfgPromise;
}

export function storagePrefix(): string {
  return cfg?.storagePrefix || DEFAULT_CFG.storagePrefix || "storefront";
}

export function storageKey(suffix: string): string {
  return `${storagePrefix()}:${suffix}`;
}

export function apiBase(): string {
  if (typeof window !== "undefined") {
    if (window.__STOREFRONT_API__) return window.__STOREFRONT_API__.replace(/\/$/, "");
    if (window.__RIOGO_API__) return window.__RIOGO_API__.replace(/\/$/, "");
  }
  try {
    const key = storageKey("api");
    const stored = localStorage.getItem(key) || localStorage.getItem("riogo:api");
    if (stored) return stored.replace(/\/$/, "");
  } catch {
    /* ignore */
  }
  return (cfg?.apiBase || DEFAULT_CFG.apiBase).replace(/\/$/, "");
}

/** @deprecated usar storageKey("adminToken") */
export const ADMIN_KEY = "riogo:adminToken";
/** @deprecated usar storageKey("cart") */
export const CART_KEY = "riogo:cart";
/** @deprecated */
export const API_KEY = "riogo:api";
