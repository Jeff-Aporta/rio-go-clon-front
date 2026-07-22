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
  appId: "riogo",
  storagePrefix: "riogo",
};

/** Payload de ?conn= (b64url JSON). */
export type ConnPayload = {
  apiBase: string;
  appId?: string;
  storagePrefix?: string;
};

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function b64urlEncode(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function normalizeConn(raw: unknown): ConnPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  // claves cortas opcionales: a=apiBase, i=appId, p=storagePrefix
  const apiBase = String(o.apiBase || o.a || "").replace(/\/$/, "");
  if (!apiBase) return null;
  const appId = String(o.appId || o.i || DEFAULT_CFG.appId || "riogo").trim().toLowerCase() || "riogo";
  const storagePrefix = String(o.storagePrefix || o.p || appId).trim() || appId;
  return { apiBase, appId, storagePrefix };
}

export function encodeConn(payload: ConnPayload): string {
  const n = normalizeConn(payload);
  if (!n) throw new Error("conn inválido");
  return b64urlEncode(JSON.stringify({ apiBase: n.apiBase, appId: n.appId, storagePrefix: n.storagePrefix }));
}

export function decodeConnParam(raw: string | null): ConnPayload | null {
  if (!raw) return null;
  try {
    return normalizeConn(JSON.parse(b64urlDecode(raw)));
  } catch {
    return null;
  }
}

/** ¿Hay ?conn= en la URL? Sin conn → directorio de apps. */
export function hasConnInUrl(): boolean {
  if (typeof location === "undefined") return false;
  return !!new URLSearchParams(location.search).get("conn");
}

function readConnFromUrl(): ConnPayload | null {
  if (typeof location === "undefined") return null;
  return decodeConnParam(new URLSearchParams(location.search).get("conn"));
}

function writeConnToLs(conn: ConnPayload): void {
  try {
    const json = JSON.stringify(conn);
    localStorage.setItem("storefront:conn", json);
    localStorage.setItem(`${conn.storagePrefix || conn.appId || "riogo"}:conn`, json);
  } catch {
    /* ignore */
  }
}

/** Valor actual de ?conn= (solo URL — sin conn no hay tienda). */
export function connSearchValue(): string | null {
  if (typeof location === "undefined") return null;
  return new URLSearchParams(location.search).get("conn");
}

/** iframe / host: ?embed=1 oculta hub y pie genesis. */
export function isEmbedMode(): boolean {
  if (typeof location === "undefined") return false;
  return new URLSearchParams(location.search).get("embed") === "1";
}

/** Añade/quita conn en un URL (preserva resto). */
export function applyConnToUrl(url: URL, conn = connSearchValue()): void {
  if (conn) url.searchParams.set("conn", conn);
  else url.searchParams.delete("conn");
}

/** Preserva conn + embed al navegar dentro del storefront. */
export function applyShellParamsToUrl(url: URL): void {
  applyConnToUrl(url);
  if (isEmbedMode()) url.searchParams.set("embed", "1");
}

/** URL lista para iframe de otra app (genesis + conn + embed). */
export function storefrontEmbedUrl(appId: string, opts?: { apiBase?: string; origin?: string }): string {
  const base = (opts?.origin || (typeof location !== "undefined" ? location.origin + location.pathname : "")).replace(
    /\/$/,
    "",
  );
  const api = (opts?.apiBase || apiBase()).replace(/\/$/, "");
  const conn = encodeConn({ apiBase: api, appId, storagePrefix: appId });
  return `${base}?conn=${encodeURIComponent(conn)}&embed=1`;
}

/** Abre una app del directorio → recarga con ?conn=. */
export function openAppConn(appId: string, baseApi = apiBase()): void {
  const conn = encodeConn({ apiBase: baseApi.replace(/\/$/, ""), appId, storagePrefix: appId });
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("conn", conn);
  location.assign(`${url.pathname}${url.search}`);
}

/** Vuelve al directorio (quita conn). No usar en embed. */
export function openAppsHub(): void {
  if (isEmbedMode()) return;
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  location.assign(url.pathname);
}

function mergeCfg(base: FrontConfig, patch: Partial<FrontConfig> | ConnPayload | null): FrontConfig {
  const apiBase = String(patch?.apiBase || base.apiBase).replace(/\/$/, "");
  const appId = String(patch?.appId || base.appId || "riogo").trim().toLowerCase() || "riogo";
  const storagePrefix = String(
    (patch as FrontConfig)?.storagePrefix || (patch as ConnPayload)?.storagePrefix || appId,
  ).trim() || appId;
  return { ...base, apiBase, appId, storagePrefix };
}

export async function loadConfig(): Promise<FrontConfig> {
  if (cfg) return cfg;
  if (typeof window !== "undefined" && window.__STOREFRONT_CONFIG__?.apiBase) {
    cfg = mergeCfg(DEFAULT_CFG, window.__STOREFRONT_CONFIG__);
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
        let next = mergeCfg(DEFAULT_CFG, j);
        const fromUrl = readConnFromUrl();
        if (fromUrl) {
          next = mergeCfg(next, fromUrl);
          writeConnToLs(fromUrl);
        }
        // sin ?conn= → hub: solo apiBase del config.json (no rehidratar LS)
        cfg = next;
        if (typeof window !== "undefined") window.__STOREFRONT_CONFIG__ = cfg;
        return cfg;
      });
  }
  return cfgPromise;
}

export function appId(): string {
  return cfg?.appId || DEFAULT_CFG.appId || "riogo";
}

export function storagePrefix(): string {
  return cfg?.storagePrefix || cfg?.appId || DEFAULT_CFG.storagePrefix || "riogo";
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
