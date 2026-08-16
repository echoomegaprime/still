import type { Currency, Emotion, LockReason, Side } from "./types";

export function money(value: number, currency: Currency, digits = 0): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const sign = value < 0 ? "−" : "";
  const unit = currency === "NPR" ? "रू" : "$";
  return `${sign}${unit}${formatted}`;
}

export function signedMoney(value: number, currency: Currency, digits = 0): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const unit = currency === "NPR" ? "रू" : "$";
  if (value > 0) return `+${unit}${formatted}`;
  if (value < 0) return `−${unit}${formatted}`;
  return `${unit}${formatted}`;
}

export function pct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function lotsLabel(lots: number): string {
  return `${lots.toFixed(2)} lot`;
}

export function goldPrice(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function sideLabel(side: Side): string {
  return side === "long" ? "Long" : "Short";
}

export function emotionLabel(emotion: Emotion): string {
  switch (emotion) {
    case "calm":
      return "Calm";
    case "fear":
      return "Fear";
    case "revenge":
      return "Revenge";
    case "fomo":
      return "Chasing";
  }
}

export function lockCopy(reason: LockReason): string {
  switch (reason) {
    case "max-loss":
      return "Daily loss limit hit. The desk is closed.";
    case "max-trades":
      return "Trade count for this session is used up.";
    case "consecutive-losses":
      return "Two losses. You do not take the third.";
    case "cooldown":
      return "Cooldown after a loss. Sit with it.";
    case "manual":
      return "You locked the desk. That was the right call.";
    case "weekend-standdown":
      return "Weekend. Gold will still be there on London.";
  }
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function remainingLabel(untilIso: string, now = Date.now()): string {
  const ms = new Date(untilIso).getTime() - now;
  if (ms <= 0) return "ready";
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}
