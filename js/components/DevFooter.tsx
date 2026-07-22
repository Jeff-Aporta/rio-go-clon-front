const DEV_BRAND = "Dulce Clic";
const DEV_WPP = "573107257814";

/** Pie sutil de marca del desarrollador → WhatsApp. */
export function DevFooter() {
  const href = `https://wa.me/${DEV_WPP}`;
  return (
    <footer className="dev-footer">
      <a href={href} target="_blank" rel="noopener noreferrer" className="dev-footer-link">
        <iconify-icon icon="mdi:whatsapp" width="14" height="14"></iconify-icon>
        <span>
          Desarrollado por <strong>{DEV_BRAND}</strong>
        </span>
      </a>
    </footer>
  );
}
