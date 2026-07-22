import type { CartItem, Customer } from "./types";

const WPP_DEFAULT = "573107257814";

export function greetingByHour(d = new Date()): string {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "buen día";
  if (h >= 12 && h < 19) return "buena tarde";
  return "buena noche";
}

/** Abre WhatsApp con saludo + link del pedido. */
export function openOrderWhatsApp(orderUrl: string, phone = WPP_DEFAULT): void {
  const text = `Hola, ${greetingByHour()}. Deseo hacer este pedido:\n${orderUrl}`;
  const wa = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  window.open(wa, "_blank", "noopener,noreferrer");
}

export function obfuscatePhone(v?: string | null): string {
  const d = String(v || "").replace(/\D/g, "");
  if (d.length < 4) return d ? "****" : "";
  return `${"*".repeat(Math.max(0, d.length - 4))}${d.slice(-4)}`;
}

export function obfuscateText(v?: string | null, keep = 3): string {
  const s = String(v || "").trim();
  if (!s) return "";
  if (s.length <= keep) return "*".repeat(s.length);
  return `${s.slice(0, keep)}${"*".repeat(Math.min(12, s.length - keep))}`;
}

export type PublicCustomer = {
  nombre: string;
  telefono: string;
  direccion: string;
  barrio: string;
  modalidad?: Customer["modalidad"];
};

export function toPublicCustomer(c: Partial<Customer> | Record<string, unknown> | null | undefined): PublicCustomer {
  const o = (c ?? {}) as Partial<Customer>;
  return {
    nombre: String(o.nombre || "Cliente").trim() || "Cliente",
    telefono: obfuscatePhone(o.telefono),
    direccion: obfuscateText(o.direccion),
    barrio: obfuscateText(o.barrio, 2),
    ...(o.modalidad ? { modalidad: o.modalidad } : {}),
  };
}

export type PublicOrder = {
  id: string;
  status: string;
  customer: PublicCustomer;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
};
