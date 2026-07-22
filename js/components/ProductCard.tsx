import type { Product } from "../types";
import { money } from "../money";

type Props = {
  p: Product;
  qty: number;
  onOpen: (p: Product) => void;
  onAdd: (p: Product) => void;
  onSetQty: (codigoAb: string, qty: number) => void;
};

export function ProductCard({ p, qty, onOpen, onAdd, onSetQty }: Props) {
  const img = p.imagenMiniUrl || p.imagenUrl;
  const inCart = qty > 0;
  return (
    <article
      className={`product-card${inCart ? " product-card--in-cart" : ""}`}
      onClick={() => onOpen(p)}
    >
      <div className="thumb" style={{ backgroundImage: img ? `url("${img}")` : undefined }} />
      <div className="body">
        <h4>{p.nombre}</h4>
        <div className="price-row">
          <span className="money">{money(p.precioUnidad)}</span>
          {inCart ? (
            <div
              className="card-qty"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <button type="button" aria-label="Menos" onClick={() => onSetQty(p.codigoAb, qty - 1)}>
                −
              </button>
              <span>{qty}</span>
              <button type="button" aria-label="Más" onClick={() => onSetQty(p.codigoAb, qty + 1)}>
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="add-fab"
              aria-label="Agregar"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(p);
              }}
            >
              <iconify-icon icon="mdi:plus" width="20" height="20"></iconify-icon>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
