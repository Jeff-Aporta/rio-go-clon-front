import type { RouteState } from "./types";

/** Tabs cortos en ?s= (b64url JSON). */
const TAB_SHORT = {
  menu: "m",
  carrito: "c",
  pedido: "o",
  pedidos: "p",
  admin: "a",
} as const;

const SHORT_TAB: Record<string, RouteState["tab"]> = {
  m: "menu",
  c: "carrito",
  o: "pedido",
  p: "pedidos",
  a: "admin",
};

type NavWire = { t: string; i?: string };

function b64urlEncode(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeNav(tab: string, orderId?: string | null): string {
  const t = TAB_SHORT[tab as keyof typeof TAB_SHORT] ?? "m";
  const wire: NavWire = { t };
  if (orderId) wire.i = String(orderId);
  if (t === "m" && !orderId) return "";
  return b64urlEncode(JSON.stringify(wire));
}

export function decodeNav(s: string | null): RouteState {
  if (!s) return { tab: "menu", orderId: null };
  try {
    const wire = JSON.parse(b64urlDecode(s)) as NavWire;
    const tab = SHORT_TAB[wire.t] ?? "menu";
    if (tab === "pedido" && wire.i) return { tab: "pedido", orderId: String(wire.i) };
    if (tab === "pedido") return { tab: "menu", orderId: null };
    return { tab, orderId: null };
  } catch {
    return { tab: "menu", orderId: null };
  }
}

export function readRoute(): RouteState {
  return decodeNav(new URLSearchParams(location.search).get("s"));
}

export function isAdminView(): boolean {
  return new URLSearchParams(location.search).get("v") === "adm";
}

export function writeAdminView(on: boolean, replace = false): void {
  const url = new URL(location.href);
  url.hash = "";
  if (on) url.searchParams.set("v", "adm");
  else url.searchParams.delete("v");
  const next = `${url.pathname}${url.search}`;
  if (replace) history.replaceState(null, "", next);
  else history.pushState(null, "", next);
}

/** Escribe ?s=… (sin hash). Menú limpia el param. Preserva v=adm si existe. */
export function writeRoute(tab: string, orderId?: string | null, replace = false): void {
  const s = encodeNav(tab, orderId);
  const url = new URL(location.href);
  url.hash = "";
  if (s) url.searchParams.set("s", s);
  else url.searchParams.delete("s");
  const next = `${url.pathname}${url.search}`;
  if (replace) history.replaceState(null, "", next);
  else history.pushState(null, "", next);
}

/** URL absoluta de vista de pedido (para WhatsApp / compartir). */
export function orderViewUrl(orderId: string, base = location.href): string {
  const url = new URL(base);
  url.hash = "";
  url.search = "";
  url.searchParams.set("s", encodeNav("pedido", orderId));
  return url.toString();
}
