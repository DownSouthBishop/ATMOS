export const O2_RATE_USD = 0.65;

export function usdToO2(usd: number): number {
  return usd / O2_RATE_USD;
}

export function o2ToUsd(o2: number): number {
  return o2 * O2_RATE_USD;
}

export function formatO2(o2: number): string {
  return Math.round(o2).toLocaleString();
}

export function formatUsd(usd: number): string {
  return '$' + usd.toFixed(2);
}
