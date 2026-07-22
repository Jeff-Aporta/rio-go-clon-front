import { useCallback, useState } from "react";
import { useSl } from "../hooks/useSl";

type Props = { onOpen: (id: string) => void };

export function PedidosLookup({ onOpen }: Props) {
  const [id, setId] = useState("");
  const onInput = useCallback((e: Event) => {
    setId(((e.target as HTMLInputElement).value || "").trim());
  }, []);
  const ref = useSl("sl-input", onInput);
  return (
    <div className="checkout-box" style={{ maxWidth: 480 }}>
      <h2 style={{ margin: 0, fontFamily: "Syne, sans-serif" }}>Mis pedidos</h2>
      <p style={{ margin: 0, color: "var(--rg-muted)" }}>
        Cada pedido tiene un ID numérico. Ábrelo con el número del pedido.
      </p>
      <sl-input ref={ref} label="ID del pedido" value={id}></sl-input>
      <sl-button variant="primary" onClick={() => id && onOpen(id)}>Ver pedido</sl-button>
    </div>
  );
}
