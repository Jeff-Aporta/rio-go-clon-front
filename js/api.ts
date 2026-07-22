import { apiBase, appId, loadConfig } from "./config";
import type {
  ApiErr,
  AppDirectoryItem,
  AppsDirectoryResponse,
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

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  await loadConfig();
  const headers = new Headers(opts.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (opts.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!headers.has("X-App-Id")) headers.set("X-App-Id", appId());

  const res = await fetch(`${apiBase()}${path}`, { ...opts, headers });
  const data = (await parseJson(res)) as Partial<ApiErr> & Record<string, unknown>;
  if (!res.ok || data.ok === false) {
    throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
  }
  return data as T;
}

function bearer(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export function fetchBrand(): Promise<BrandResponse> {
  return api<BrandResponse>("/api/brand");
}

/** Listado de apps del worker (hub sin ?conn=). */
export async function fetchAppsDirectory(): Promise<AppsDirectoryResponse> {
  try {
    return await api<AppsDirectoryResponse>("/api/apps");
  } catch {
    // worker viejo: / puede traer apps como ids o como directorio
    const root = await api<{ ok?: boolean; apps?: Array<AppDirectoryItem | string>; contractVersion?: number }>("/");
    const apps = (root.apps || []).map((a) =>
      typeof a === "string" ? { id: a, name: a } : a,
    );
    return { ok: true, apps, contractVersion: root.contractVersion ?? 1 };
  }
}

/** Catálogo vía QUERY + filtro ISS (vacío = todo el catálogo paginado al default). */
export function fetchCatalog(filter: IssListFilter = {}): Promise<CatalogResponse> {
  return api<CatalogResponse>("/api/catalog", {
    method: "QUERY",
    body: JSON.stringify(filter),
  });
}

export function loginAdmin(
  username: string,
  password: string,
): Promise<{ ok: true; token: string; expiresAt: string; username: string }> {
  return api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function fetchAuthMe(token: string): Promise<{ ok: true; username: string }> {
  return api("/api/auth/me", { headers: bearer(token) });
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
}): Promise<{ ok: true; id: string; reused?: boolean; path: string; url: string }> {
  return api("/api/orders", { method: "POST", body: JSON.stringify(body) });
}

export function fetchOrderWhatsApp(
  id: string,
): Promise<{ ok: true; id: string; orderUrl: string; text: string; whatsappUrl: string; phone: string }> {
  return api(`/api/orders/${encodeURIComponent(id)}/whatsapp`);
}

export function fetchAdminOrders(token: string, limit = 80): Promise<{ ok: true; orders: Order[] }> {
  return api(`/api/admin/orders?limit=${limit}`, { headers: bearer(token) });
}

export function fetchAdminProducts(token: string): Promise<{ ok: true; products: import("./types").Product[] }> {
  return api("/api/admin/products", { headers: bearer(token) });
}

export function patchAdminProduct(
  token: string,
  codigo: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; product: import("./types").Product }> {
  return api(`/api/admin/products/${encodeURIComponent(codigo)}`, {
    method: "PATCH",
    headers: bearer(token),
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
    headers: { ...bearer(token), Accept: "application/json", "X-App-Id": appId() },
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
    headers: bearer(token),
    body: JSON.stringify({ status }),
  });
}
