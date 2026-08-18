/**
 * The Motions decision engine — pure and envelope-bound.
 *
 * The default output is "sit". It proposes at most one conservative,
 * rule-bound setup (a pullback to a level, in the direction of drift), never
 * chases, never sizes beyond the envelope, and flattens the instant a day/week
 * breach or the kill-switch fires. This is the "cage" — it can only protect or
 * propose, never open something riskier than the user could by hand.
 */
import { lotsFromRisk, stopDistance } from "@/lib/still/gold";
import type { Side } from "@/lib/still/types";
import type {
  MotionsAccount,
  MotionsAction,
  MotionsContext,
  MotionsEnvelope,
  MotionsFill,
  MotionsPosition,
} from "./types";

/** The one, immutable envelope. Conservative on purpose. */
export const DEFAULT_ENVELOPE: MotionsEnvelope = {
  riskPct: 0.5,
  atrStopMult: 1.5,
  targetR: 1.5,
  maxConsecutiveLosses: 2,
  dayStopPct: 2,
  weekStopPct: 5,
  newsBlackoutMin: 30,
  levelProximity: 3,
  sessions: ["london", "overlap", "ny"],
  maxSlippage: 10,
};

const DAY_MS = 86_400_000;

export function dayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}
export function weekKey(now: number): string {
  const d = new Date(now);
  const day = (d.getUTCDay() + 6) % 7;
  const thursday = new Date(d.getTime() + (3 - day) * DAY_MS);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${week}`;
}

export function freshAccount(startEquity: number, now: number): MotionsAccount {
  return {
    startEquity,
    equity: startEquity,
    peakEquity: startEquity,
    dayAnchor: startEquity,
    weekAnchor: startEquity,
    dayKey: dayKey(now),
    weekKey: weekKey(now),
    sessionLosses: 0,
    position: null,
    lock: null,
    killed: false,
    realized: [],
  };
}

/** Reset the day/week anchors (and clear day/week locks) when the clock rolls over. */
export function rollAnchors(account: MotionsAccount, now: number): MotionsAccount {
  let next = account;
  const dk = dayKey(now);
  const wk = weekKey(now);
  if (dk !== account.dayKey) {
    next = {
      ...next,
      dayKey: dk,
      dayAnchor: next.equity,
      sessionLosses: 0,
      lock: next.lock === "day-stop" || next.lock === "consecutive-losses" ? null : next.lock,
    };
  }
  if (wk !== account.weekKey) {
    next = { ...next, weekKey: wk, weekAnchor: next.equity, lock: next.lock === "week-stop" ? null : next.lock };
  }
  return next;
}

function dayPnlPct(a: MotionsAccount): number {
  return a.dayAnchor > 0 ? ((a.equity - a.dayAnchor) / a.dayAnchor) * 100 : 0;
}
function weekPnlPct(a: MotionsAccount): number {
  return a.weekAnchor > 0 ? ((a.equity - a.weekAnchor) / a.weekAnchor) * 100 : 0;
}

/** Direction is rule-bound (continuation of drift), never a size or conviction input. */
function directionFromDrift(drift: number): Side {
  return drift >= 0 ? "long" : "short";
}

export function decideMotions(ctx: MotionsContext, env = DEFAULT_ENVELOPE): MotionsAction {
  const a = ctx.account;

  if (a.killed) return { type: "killed" };

  // An open position: a day/week breach flattens it; otherwise the broker-side
  // stop is already doing its job, so we only "manage".
  if (a.position) {
    if (dayPnlPct(a) <= -env.dayStopPct) return { type: "flatten", reason: "day-stop" };
    if (weekPnlPct(a) <= -env.weekStopPct) return { type: "flatten", reason: "week-stop" };
    return { type: "manage", reason: "stop-attached" };
  }

  // No position — locks first.
  if (a.lock) return { type: "locked", lock: a.lock, reason: a.lock };
  if (a.sessionLosses >= env.maxConsecutiveLosses)
    return { type: "locked", lock: "consecutive-losses", reason: "consecutive-losses" };
  if (dayPnlPct(a) <= -env.dayStopPct) return { type: "locked", lock: "day-stop", reason: "day-stop" };
  if (weekPnlPct(a) <= -env.weekStopPct) return { type: "locked", lock: "week-stop", reason: "week-stop" };

  // Window + Still's Watchman gate (tilt / news / drawdown) — all reasons to sit.
  if (!env.sessions.includes(ctx.window)) return { type: "sit", reason: "off-window" };
  if (ctx.intelBlocked) return { type: "sit", reason: ctx.intelReason || "watchman" };
  if (ctx.price == null || ctx.atr14 == null || ctx.atr14 <= 0)
    return { type: "sit", reason: "no-print" };

  // The only setup class: a pullback sitting on a round $50 level. Default = sit.
  if (ctx.nearLevel == null) return { type: "sit", reason: "no-setup" };

  const side = directionFromDrift(ctx.drift);
  const stopDist = env.atrStopMult * ctx.atr14;
  const entry = ctx.price;
  const stop = side === "long" ? entry - stopDist : entry + stopDist;
  const target = side === "long" ? entry + env.targetR * stopDist : entry - env.targetR * stopDist;
  const riskUsd = (a.equity * env.riskPct) / 100;
  const lots = lotsFromRisk(riskUsd, stopDist);
  if (lots <= 0) return { type: "sit", reason: "no-size" };

  return {
    type: "propose",
    reason: "pullback-at-level",
    order: { side, entry, stop, target, lots, riskUsd },
  };
}

/* --- account mutations (used by the paper runner and the live confirmer) --- */

export function openPosition(account: MotionsAccount, order: MotionsPosition): MotionsAccount {
  return { ...account, position: order };
}

/** Apply a close: update equity/peak, streak, and trip day/week/streak locks. */
export function applyFill(account: MotionsAccount, fill: MotionsFill, env = DEFAULT_ENVELOPE): MotionsAccount {
  const equity = account.equity + fill.pnl;
  const peakEquity = Math.max(account.peakEquity, equity);
  const sessionLosses = fill.pnl < 0 ? account.sessionLosses + 1 : 0;
  let next: MotionsAccount = {
    ...account,
    equity,
    peakEquity,
    sessionLosses,
    position: null,
    realized: [...account.realized, fill].slice(-200),
  };
  if (sessionLosses >= env.maxConsecutiveLosses) next = { ...next, lock: "consecutive-losses" };
  if (next.dayAnchor > 0 && ((equity - next.dayAnchor) / next.dayAnchor) * 100 <= -env.dayStopPct)
    next = { ...next, lock: "day-stop" };
  if (next.weekAnchor > 0 && ((equity - next.weekAnchor) / next.weekAnchor) * 100 <= -env.weekStopPct)
    next = { ...next, lock: "week-stop" };
  return next;
}

export function killAll(account: MotionsAccount): MotionsAccount {
  return { ...account, killed: true, lock: "killed" };
}

export function unkill(account: MotionsAccount): MotionsAccount {
  return { ...account, killed: false, lock: account.lock === "killed" ? null : account.lock };
}

export { dayPnlPct, weekPnlPct };
