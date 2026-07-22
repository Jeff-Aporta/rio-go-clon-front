import { useCallback, type ReactNode } from "react";
import { useSl } from "../hooks/useSl";
import { money } from "../money";
import type { CartItem, Customer, StoreDisplay, StorePrices } from "../types";

type Props = {
  label: string;
  value: string;
  onChange: (e: Event) => void;
  required?: boolean;
  type?: "text" | "textarea";
  className?: string;
};

export function Field({ label, value, onChange, required, type = "text", className }: Props) {
  const handler = useCallback((e: Event) => onChange(e), [onChange]);
  const ref = useSl("sl-input", handler);
  const reqProps = required === true ? { required: true as const } : {};
  const wrap = (node: ReactNode) => (className ? <div className={className}>{node}</div> : node);
  if (type === "textarea") {
    return wrap(<sl-textarea ref={ref} label={label} value={value} rows={2} {...reqProps}></sl-textarea>);
  }
  return wrap(<sl-input ref={ref} label={label} value={value} {...reqProps}></sl-input>);
}

type CartProps = {
  cart: CartItem[];
  setQty: (codigoAb: string, qty: number) => void;
  customer: Customer;
  setCust: (key: keyof Customer) => (e: Event) => void;
  prices: StorePrices;
  display: StoreDisplay;
  subtotal: number;
  deliveryFee: number;
  total: number;
  placing: boolean;
  placeOrder: () => void;
  go: (tab: string) => void;
};

export function CartPanel({
  cart,
  setQty,
  customer,
  setCust,
  prices,
  display,
  subtotal,
  deliveryFee,
  total,
  placing,
  placeOrder,
  go,
}: CartProps) {
  const deliveryLabel = money(prices.delivery ?? display.valDomicilio ?? 0);

  return (
    <div className="cart-page">
      <h2 className="cart-title">Tu carrito</h2>
      {!cart.length ? (
        <div className="empty empty--panel">
          <iconify-icon icon="mdi:cart-off"></iconify-icon>
          <p>Aún no hay productos</p>
          <sl-button variant="primary" onClick={() => go("menu")}>Ver menú</sl-button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.map((it) => (
              <div className="cart-item" key={it.codigoAb}>
                <img src={it.imagen || ""} alt="" />
                <div>
                  <strong>{it.nombre}</strong>
                  <div className="money" style={{ color: "var(--rg-accent)" }}>{money(it.precio)}</div>
                  <div className="qty-ctrl">
                    <button type="button" onClick={() => setQty(it.codigoAb, it.qty - 1)}>−</button>
                    <span>{it.qty}</span>
                    <button type="button" onClick={() => setQty(it.codigoAb, it.qty + 1)}>+</button>
                  </div>
                </div>
                <strong className="money">{money(it.precio * it.qty)}</strong>
              </div>
            ))}
          </div>

          <div className="checkout-box">
            <h3 className="checkout-title">
              Datos del pedido{" "}
              <span className="checkout-optional">(opcional)</span>
            </h3>
            <div className="checkout-mode">
              <iconify-icon icon="mdi:motorbike" width="18" height="18"></iconify-icon>
              <span>Domicilio (+{deliveryLabel})</span>
            </div>

            <div className="checkout-grid">
              <Field label="Nombre" value={customer.nombre} onChange={setCust("nombre")} />
              <Field label="Teléfono / WhatsApp" value={customer.telefono} onChange={setCust("telefono")} />
              <Field label="Dirección" value={customer.direccion} onChange={setCust("direccion")} />
              <Field label="Barrio / edificio" value={customer.barrio} onChange={setCust("barrio")} />
              <Field
                className="checkout-span"
                label="Observaciones"
                type="textarea"
                value={customer.observaciones}
                onChange={setCust("observaciones")}
              />
            </div>

            <div className="totals">
              <div className="totals-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="totals-row"><span>Domicilio</span><span>{money(deliveryFee)}</span></div>
              <div className="grand"><span>Total</span><span>{money(total)}</span></div>
            </div>
            <sl-button
              variant="primary"
              size="large"
              className="checkout-submit"
              {...(placing ? { loading: true as const } : {})}
              onClick={placeOrder}
            >
              Hacer el pedido por WhatsApp
            </sl-button>
          </div>
        </div>
      )}
    </div>
  );
}
