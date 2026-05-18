export function formatPrice(amount: number, period?: string | null): string {
  const formatted = amount.toLocaleString("fr-FR").replace(/ /g, ".").replace(/\s/g, ".");
  const base = `${formatted} GNF`;
  if (!period || period === "total") return base;
  if (period === "month") return `${base}/mois`;
  if (period === "year") return `${base}/an`;
  return base;
}
