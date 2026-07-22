import { useState } from "react";
import { loginAdmin } from "../api";
import { money } from "../money";
import { storageKey } from "../config";
import { orderViewUrl } from "../nav";
import type { Order } from "../types";

type Props = {
  adminToken: string;
  setAdminToken: (t: string) => void;
  loadAdmin: () => void;
  adminOrders: Order[];
  patchStatus: (id: string, status: string) => void;
};

const STATUSES = ["nuevo", "preparando", "listo", "entregado", "cancelado"] as const;

export function AdminPanel({ adminToken, setAdminToken, loadAdmin, adminOrders, patchStatus }: Props) {
  const [user, setUser] = useState("admin");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onLogin = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await loginAdmin(user.trim(), pass);
      localStorage.setItem(storageKey("authJwt"), res.token);
      setAdminToken(res.token);
      setPass("");
      loadAdmin();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="checkout-box">
      <h2 style={{ margin: 0, fontFamily: "Syne, sans-serif" }}>Pedidos (admin)</h2>
      {!adminToken ? (
        <div className="admin-auth-inline" style={{ width: "100%" }}>
          <input className="admin-input admin-auth-user" placeholder="Usuario" value={user} onChange={(e) => setUser(e.target.value)} />
          <input className="admin-input admin-auth-pass" type="password" placeholder="Clave" value={pass} onChange={(e) => setPass(e.target.value)} />
          <button type="button" className="tab-btn active" disabled={busy} onClick={() => void onLogin()}>
            {busy ? "…" : "Entrar"}
          </button>
          {err ? <span className="admin-auth-err">{err}</span> : null}
        </div>
      ) : (
        <sl-button variant="primary" onClick={loadAdmin}>Listar pedidos</sl-button>
      )}
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
