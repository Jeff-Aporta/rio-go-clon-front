import type { ThemeMode } from "../types";

type Props = {
  theme: ThemeMode;
  onToggle: () => void;
  className?: string;
};

/** Botón claro/oscuro reutilizable (tienda + admin). */
export function ThemeToggle({ theme, onToggle, className }: Props) {
  return (
    <button
      type="button"
      className={className ? `theme-toggle ${className}` : "theme-toggle"}
      aria-label="Cambiar tema"
      onClick={onToggle}
    >
      <iconify-icon
        icon={theme === "dark" ? "mdi:weather-sunny" : "mdi:weather-night"}
        width="20"
        height="20"
      ></iconify-icon>
    </button>
  );
}
