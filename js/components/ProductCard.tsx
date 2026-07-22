import type { Product } from "../types";
import { money } from "../money";

type Props = {
  p: Product;
  qty: number;
  onOpen: (p: Product) => void;
  onAdd: (p: Product) => void;
  onSetQty: (codigoAb: string, qty: number) => void;
  /** rail = carrusel horizontal (default); grid = product-grid. */
  layout?: "rail" | "grid";
  showCategory?: boolean;
};

/** Card de producto única — menú, landing y grid. */
export function ProductCard({ p, qty, onOpen, onAdd, onSetQty, layout = "rail", showCategory = false }: Props) {
  const img = p.imagenMiniUrl || p.imagenUrl;
  const inCart = qty > 0;
  const cls = [
    "product-card",
    layout === "grid" ? "product-card--grid" : "",
    inCart ? "product-card--in-cart" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cls} onClick={() => onOpen(p)}>
      <div className="thumb" style={{ backgroundImage: img ? `url("${img}")` : undefined }} />
      <div className="body">
        {showCategory && p.categoria ? <span className="product-card-cat">{p.categoria}</span> : null}
        <h4>{p.nombre}</h4>
        <div className="price-row">
          <span className="money">{money(p.precioUnidad)}</span>
          {inCart ? (
            <div className="card-qty" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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
