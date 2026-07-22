const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function money(n: number | string | null | undefined): string {
  return COP.format(Number(n) || 0);
}
