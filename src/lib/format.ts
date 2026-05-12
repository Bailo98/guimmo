export function formatPrice(amount: number, period?: string | null): string {
  const formatted = new Intl.NumberFormat("fr-GN", {
    maximumFractionDigits: 0,
  }).format(amount);
  const base = `${formatted} GNF`;
  if (!period || period === "total") return base;
  if (period === "month") return `${base}/mois`;
  if (period === "year") return `${base}/an`;
  return base;
}
