/** XAUUSD: 1.00 lot = 100 oz. A $1 price move ≈ $100 per standard lot. */
export const GOLD_USD_PER_LOT_PER_DOLLAR = 100;

export function lotsFromRisk(riskUsd: number, stopDistance: number): number {
  if (riskUsd <= 0 || stopDistance <= 0) return 0;
  return riskUsd / (stopDistance * GOLD_USD_PER_LOT_PER_DOLLAR);
}

export function stopDistance(entry: number, stop: number): number {
  return Math.abs(entry - stop);
}

export function riskFromSize(
  sizeUsd: number,
  stopDistanceValue: number,
  entry: number,
): number {
  if (entry <= 0 || sizeUsd <= 0 || stopDistanceValue <= 0) return 0;
  return sizeUsd * (stopDistanceValue / entry);
}

export function pnlFromMove(
  side: "long" | "short",
  entry: number,
  exit: number,
  lots: number,
): number {
  const move = side === "long" ? exit - entry : entry - exit;
  return move * lots * GOLD_USD_PER_LOT_PER_DOLLAR;
}

export function riskPct(riskUsd: number, capital: number): number {
  if (capital <= 0) return 0;
  return (riskUsd / capital) * 100;
}

export function habitSizeWarning(
  sizeUsd: number,
  capital: number,
  maxRiskPct: number,
): "ok" | "stretched" | "habit" {
  const pct = riskPct(sizeUsd, capital);
  if (pct >= 3) return "habit";
  if (pct > maxRiskPct * 1.25) return "stretched";
  return "ok";
}
