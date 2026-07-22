import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  orderId: string;
  reused: boolean;
  sending?: boolean;
  onSendWhatsApp: () => void;
  onClearCart: () => void;
  onViewOrder: () => void;
  onClose: () => void;
};

/** Modal post-pedido: reusar WA vía API o vaciar carrito. */
export function OrderReadyDialog({
  open,
  orderId,
  reused,
  sending,
  onSendWhatsApp,
  onClearCart,
  onViewOrder,
  onClose,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current as (HTMLElement & { show?: () => void; hide?: () => void }) | null;
    if (!el) return;
    if (open) el.show?.();
    else el.hide?.();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onReq = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("sl-request-close", onReq);
    return () => el.removeEventListener("sl-request-close", onReq);
  }, [onClose]);

  return (
    <sl-dialog ref={ref} label={reused ? "Pedido ya registrado" : "Pedido creado"} className="order-ready-dialog">
      <div className="order-ready-body">
        <p className="order-ready-id">
          Pedido <strong>#{orderId}</strong>
        </p>
        {reused ? (
          <p>
            Ya existía un pedido idéntico (mismos datos y productos). Se reutilizó ese ID para no duplicar.
            Puedes volver a enviar el mensaje por WhatsApp.
          </p>
        ) : (
          <p>
            Tu pedido quedó guardado. Envía el mensaje por WhatsApp para confirmarlo con la tienda,
            o vacía el carrito si ya terminaste.
          </p>
        )}
      </div>
      <div slot="footer" className="order-ready-actions">
        <sl-button variant="default" onClick={onClearCart}>
          Vaciar carrito
        </sl-button>
        <sl-button variant="default" onClick={onViewOrder}>
          Ver pedido
        </sl-button>
        <sl-button
          variant="primary"
          {...(sending ? { loading: true as const } : {})}
          onClick={onSendWhatsApp}
        >
          Enviar por WhatsApp
        </sl-button>
      </div>
    </sl-dialog>
  );
}
