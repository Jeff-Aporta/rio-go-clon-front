import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useSl } from "../hooks/useSl";
import { money } from "../money";
import { orderViewUrl } from "../nav";
import type { Order } from "../types";

type Props = {
  adminToken: string;
  setAdminToken: Dispatch<SetStateAction<string>>;
  loadAdmin: () => void;
  adminOrders: Order[];
  patchStatus: (id: string, status: string) => void;
};

const STATUSES = ["nuevo", "preparando", "listo", "entregado", "cancelado"] as const;

export function AdminPanel({ adminToken, setAdminToken, loadAdmin, adminOrders, patchStatus }: Props) {
  const onTok = useCallback(
    (e: Event) => setAdminToken((e.target as HTMLInputElement).value || ""),
    [setAdminToken],
  );
  const ref = useSl("sl-input", onTok);
  return (
    <div className="checkout-box">
      <h2 style={{ margin: 0, fontFamily: "Syne, sans-serif" }}>Admin pedidos</h2>
      <sl-input ref={ref} type="password" label="Admin token" value={adminToken}></sl-input>
      <sl-button variant="primary" onClick={loadAdmin}>Listar pedidos</sl-button>
      <div className="order-list">
        {adminOrders.map((o) => (
          <div className="order-card" key={o.id} style={{ gridTemplateColumns: "1fr" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div>
                <a href={orderViewUrl(o.id)} style={{ color: "var(--rg-accent)", fontWeight: 700 }}>#{o.id}</a>
                <div style={{ color: "var(--rg-muted)", fontSize: "0.85rem" }}>
                  {String(o.customer?.nombre ?? "")} · {String(o.customer?.telefono ?? "")}
                </div>
                <div className="money">{money(o.total)} · {(o.items || []).length} ítems</div>
              </div>
              <span className={`status-pill ${o.status}`}>{o.status}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {STATUSES.map((s) => (
                <sl-button key={s} size="small" onClick={() => patchStatus(o.id, s)}>{s}</sl-button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
