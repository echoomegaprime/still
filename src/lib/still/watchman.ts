import type { SessionWindow } from "./stats";
import type { MessageKey } from "./i18n";

export type WatchmanState = "stand-down" | "wait" | "watch" | "name-it";

export type WatchmanInput = {
  window: SessionWindow;
  locked: boolean;
  hasSession: boolean;
  consecutiveLosses: number;
  lastTradeWasLoss: boolean;
  hasOpenPlan: boolean;
  price: number | null;
  /**
   * Optional intelligence signals (intel.ts / econ-calendar.ts). Every one may
   * only ever TIGHTEN the verdict — push toward wait/sit, never toward a trade.
   * Omitting them keeps the original discipline behavior intact.
   */
  intel?: WatchmanIntel;
};

export type WatchmanIntel = {
  tiltLevel?: "calm" | "warm" | "hot";
  tiltReason?: string;
  circuitTripped?: boolean; // deep drawdown -> day stop
  blackout?: "clear" | "approach" | "blackout";
  newsLabel?: string;
  newsMinutes?: number;
  losingSession?: boolean;
  losingSessionAvg?: number;
  sweepLevel?: number | null;
  rangeSpent?: number | null; // fraction of ATR already used, >=1 => spent
};

export type WatchmanVerdict = {
  state: WatchmanState;
  key: MessageKey;
  vars?: Record<string, string | number>;
};

export function nearRoundLevel(price: number, dollars = 3): boolean {
  const nearest = Math.round(price / 50) * 50;
  return Math.abs(price - nearest) <= dollars;
}

/** Advisory only. Never sizes, never clicks, never "buy". Tightest reason wins. */
export function watchman(input: WatchmanInput): WatchmanVerdict {
  const i = input.intel ?? {};

  // ---- stand-down tier (hard sit), most protective first ----
  if (input.window === "weekend") return { state: "stand-down", key: "botWeekend" };
  if (i.circuitTripped) return { state: "stand-down", key: "botCircuit" };
  if (i.blackout === "blackout") {
    return {
      state: "stand-down",
      key: "botBlackout",
      vars: { event: i.newsLabel ?? "News", min: Math.max(0, Math.round(i.newsMinutes ?? 0)) },
    };
  }
  if (input.locked) return { state: "stand-down", key: "botLocked" };
  if (i.tiltLevel === "hot") {
    return { state: "stand-down", key: "botTiltHot", vars: { why: i.tiltReason ?? "" } };
  }
  if (input.lastTradeWasLoss || input.consecutiveLosses >= 2) {
    return { state: "stand-down", key: "botAfterLoss" };
  }

  // ---- wait tier (soft hold) ----
  if (i.tiltLevel === "warm") {
    return { state: "wait", key: "botTiltWarm", vars: { why: i.tiltReason ?? "" } };
  }
  if (i.losingSession) {
    return {
      state: "wait",
      key: "botLosingSession",
      vars: { avg: Math.round(i.losingSessionAvg ?? 0) },
    };
  }
  if (i.sweepLevel != null) {
    return { state: "wait", key: "botSweep", vars: { level: i.sweepLevel } };
  }
  if (i.blackout === "approach") {
    return {
      state: "wait",
      key: "botNewsApproach",
      vars: { event: i.newsLabel ?? "News", min: Math.max(0, Math.round(i.newsMinutes ?? 0)) },
    };
  }
  if (input.hasOpenPlan) return { state: "wait", key: "botOpenPlan" };
  if (!input.hasSession) return { state: "wait", key: "botNeedSession" };
  if (input.window === "asia") return { state: "wait", key: "botAsia" };
  if (input.window === "off") return { state: "wait", key: "botOffWindow" };
  if (input.price == null) return { state: "wait", key: "botNoQuote" };
  if (i.rangeSpent != null && i.rangeSpent >= 1) return { state: "wait", key: "botRangeSpent" };

  // ---- name-it / watch ----
  if (nearRoundLevel(input.price)) return { state: "name-it", key: "botNearLevel" };
  return { state: "watch", key: "botWatch" };
}
