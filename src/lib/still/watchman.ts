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
};

export type WatchmanVerdict = {
  state: WatchmanState;
  key: MessageKey;
};

export function nearRoundLevel(price: number, dollars = 3): boolean {
  const nearest = Math.round(price / 50) * 50;
  return Math.abs(price - nearest) <= dollars;
}

/** Advisory only. Never sizes, never clicks, never “buy”. */
export function watchman(input: WatchmanInput): WatchmanVerdict {
  if (input.window === "weekend") return { state: "stand-down", key: "botWeekend" };
  if (input.locked) return { state: "stand-down", key: "botLocked" };
  if (input.lastTradeWasLoss || input.consecutiveLosses >= 2) {
    return { state: "stand-down", key: "botAfterLoss" };
  }
  if (input.hasOpenPlan) return { state: "wait", key: "botOpenPlan" };
  if (!input.hasSession) return { state: "wait", key: "botNeedSession" };
  if (input.window === "asia") return { state: "wait", key: "botAsia" };
  if (input.window === "off") return { state: "wait", key: "botOffWindow" };
  if (input.price == null) return { state: "wait", key: "botNoQuote" };
  if (nearRoundLevel(input.price)) return { state: "name-it", key: "botNearLevel" };
  return { state: "watch", key: "botWatch" };
}
