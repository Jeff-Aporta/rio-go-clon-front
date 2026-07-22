import { money } from "../money";
import type { Order } from "../types";

type Props = {
  order: Order | { error: string } | null;
  orderId: string;
  onBack: () => void;
};

export function OrderPanel({ order, orderId, onBack }: Props) {
  if (!order) {
    return (
      <div className="empty">
        <sl-spinner></sl-spinner>
        <p>Cargando pedido #{orderId}…</p>
      </div>
    );
  }
  if ("error" in order) {
    return (
      <div className="empty">
        <iconify-icon icon="mdi:alert"></iconify-icon>
        <p>{order.error}</p>
        <sl-button onClick={onBack}>Volver</sl-button>
      </div>
    );
  }
  const items = order.items ?? [];
  const cust = order.customer ?? {};
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontFamily: "Syne, sans-serif" }}>Pedido #{order.id}</h2>
          <span className={`status-pill ${order.status}`}>{order.status}</span>
        </div>
        <sl-button size="small" onClick={onBack}>Volver</sl-button>
      </div>
      <div className="checkout-box" style={{ marginBottom: 16 }}>
        <div><strong>{String(cust.nombre || "Cliente")}</strong></div>
        {cust.telefono ? <div style={{ color: "var(--rg-muted)" }}>Tel: {String(cust.telefono)}</div> : null}
        {cust.direccion ? (
          <div style={{ color: "var(--rg-muted)" }}>
            {String(cust.direccion)}
            {cust.barrio ? ` · ${String(cust.barrio)}` : ""}
          </div>
        ) : null}
        {cust.modalidad ? (
          <div style={{ color: "var(--rg-muted)", fontSize: "0.85rem" }}>Modalidad: {String(cust.modalidad)}</div>
        ) : null}
        <div style={{ color: "var(--rg-muted)", fontSize: "0.85rem" }}>{order.createdAt}</div>
      </div>
      <div className="cart-list">
        {items.map((it, idx) => (
          <div className="cart-item" key={`${it.codigoAb}-${idx}`}>
            <img src={it.imagen || ""} alt="" />
            <div>
              <strong>{it.nombre}</strong>
              <div>× {it.qty}</div>
            </div>
            <strong className="money">{money(Number(it.precio) * Number(it.qty))}</strong>
          </div>
        ))}
      </div>
      <div className="totals" style={{ marginTop: 16, padding: 16, background: "var(--rg-surface)", borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span><span>{money(order.subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Domicilio</span><span>{money(order.deliveryFee)}</span>
        </div>
        <div className="grand"><span>Total</span><span>{money(order.total)}</span></div>
      </div>
    </div>
  );
}
