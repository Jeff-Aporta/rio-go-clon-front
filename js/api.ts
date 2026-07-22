import { apiBase, loadConfig } from "./config";
import type {
  ApiErr,
  BrandResponse,
  CartItem,
  CatalogResponse,
  Customer,
  IssListFilter,
  Order,
} from "./types";

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  await loadConfig();
  const headers = new Headers(opts.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (opts.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(`${apiBase()}${path}`, { ...opts, headers });
  const data = (await parseJson(res)) as Partial<ApiErr> & Record<string, unknown>;
  if (!res.ok || data.ok === false) {
    throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
  }
  return data as T;
}

export function fetchBrand(): Promise<BrandResponse> {
  return api<BrandResponse>("/api/brand");
}

/** Catálogo vía QUERY + filtro ISS (vacío = todo el catálogo paginado al default). */
export function fetchCatalog(filter: IssListFilter = {}): Promise<CatalogResponse> {
  return api<CatalogResponse>("/api/catalog", {
    method: "QUERY",
    body: JSON.stringify(filter),
  });
}

export function fetchOrder(id: string): Promise<{ ok: true; order: Order }> {
  return api(`/api/orders/${encodeURIComponent(id)}`);
}

export function fetchOrderPublic(id: string): Promise<{ ok: true; order: Order }> {
  return api(`/api/orders/${encodeURIComponent(id)}/public`);
}

export function createOrder(body: {
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
}): Promise<{ ok: true; id: string; path: string; url: string }> {
  return api("/api/orders", { method: "POST", body: JSON.stringify(body) });
}

export function fetchAdminOrders(token: string, limit = 80): Promise<{ ok: true; orders: Order[] }> {
  return api(`/api/admin/orders?limit=${limit}`, {
    headers: { "X-Admin-Token": token },
  });
}

export function fetchAdminProducts(token: string): Promise<{ ok: true; products: import("./types").Product[] }> {
  return api("/api/admin/products", { headers: { "X-Admin-Token": token } });
}

export function patchAdminProduct(
  token: string,
  codigo: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; product: import("./types").Product }> {
  return api(`/api/admin/products/${encodeURIComponent(codigo)}`, {
    method: "PATCH",
    headers: { "X-Admin-Token": token },
    body: JSON.stringify(body),
  });
}

export async function uploadAdminProductImage(
  token: string,
  codigo: string,
  file: File,
  opts?: { portada?: boolean; descripcion?: string },
): Promise<{ ok: true; image: import("./types").ProductImage; product: import("./types").Product | null }> {
  await loadConfig();
  const fd = new FormData();
  fd.append("file", file);
  if (opts?.portada) fd.append("portada", "1");
  if (opts?.descripcion) fd.append("descripcion", opts.descripcion);
  const res = await fetch(`${apiBase()}/api/admin/products/${encodeURIComponent(codigo)}/images`, {
    method: "POST",
    headers: { "X-Admin-Token": token, Accept: "application/json" },
    body: fd,
  });
  const data = (await parseJson(res)) as { ok?: boolean; error?: string; image?: unknown; product?: unknown };
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data as { ok: true; image: import("./types").ProductImage; product: import("./types").Product | null };
}

export function patchOrderStatus(
  token: string,
  id: string,
  status: string,
): Promise<{ ok: true; order: Order }> {
  return api(`/api/admin/orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "X-Admin-Token": token },
    body: JSON.stringify({ status }),
  });
}
