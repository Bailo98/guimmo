/**
 * Global configuration constants for LogerBien
 */

/** Fixed conversion rate: 1 USD = X GNF */
export const USD_TO_GNF = 8_600;

/** Convert GNF to USD */
export function gnfToUsd(gnf: number): number {
  return Math.round(gnf / USD_TO_GNF);
}

/** Format amount in USD */
export function formatUsd(gnf: number): string {
  const usd = gnfToUsd(gnf);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
}
