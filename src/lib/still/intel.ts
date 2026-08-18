/**
 * Watchman intelligence — the advisory brain behind Still.
 *
 * Governing rule (both Opus 5 and Fable 5, independently): every signal here may
 * only ever *tighten* — add a stand-down, shrink the allowed risk, name a reason
 * to sit. Nothing here forms a directional opinion or nudges toward a trade. That
 * is what keeps Still "it never clicks, it only tells you to sit" even as it gets
 * smarter. If you ever add a signal that makes a trade look *more* attractive, it
 * does not belong in this file.
 *
 * Everything here is a pure function over the trader's own history (+ a cached
 * daily ATR). No execution, no broker, no network — the desk stays client-side.
 */
import { closedTrades, consecutiveLosses, currentEquity } from "./stats";
import type { SessionWindow } from "./stats";
import type { Trade } from "./types";

const MS_MIN = 60_000;

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function closedByTime(trades: Trade[]): Trade[] {
  return [...closedTrades(trades)].sort((a, b) =>
    (a.closedAt ?? a.openedAt).localeCompare(b.closedAt ?? b.openedAt),
  );
}

/* ------------------------------------------------------------------ *
 * 1. Tilt — the personalized revenge-trade fingerprint.
 * ------------------------------------------------------------------ */

export type TiltDriver = "streak" | "size" | "revenge-window" | "overtrading";

export type TiltReport = {
  score: number; // 0..100
  level: "calm" | "warm" | "hot";
  drivers: TiltDriver[];
  /** The single dominant driver, for the one-line reason. */
  top: TiltDriver | null;
  detail: { lossStreak: number; sizeRatio: number; minsSinceLoss: number | null; sessionTrades: number };
};

/**
 * How close the trader is to the exact behavior that blanks the book:
 * re-entering fast and bigger after a loss, or overtrading a session.
 * Pure read of his own log — it can only subtract permission.
 */
export function tiltReport(
  trades: Trade[],
  opts: { now?: number; sessionTradeCount?: number; sessionMedian?: number } = {},
): TiltReport {
  const now = opts.now ?? Date.now();
  const closed = closedByTime(trades);
  const last = closed.at(-1);
  const recentLots = closed.slice(-20).map((t) => t.lots).filter((n) => n > 0);
  const medLots = median(recentLots);

  const lossStreak = consecutiveLosses(trades);
  const lastLots = last?.lots ?? 0;
  const sizeRatio = medLots > 0 ? lastLots / medLots : 1;

  const lastLoss = [...closed].reverse().find((t) => (t.pnl ?? 0) < 0);
  const lastLossAt = lastLoss?.closedAt ? Date.parse(lastLoss.closedAt) : null;
  const minsSinceLoss = lastLossAt != null ? (now - lastLossAt) / MS_MIN : null;
  const lastWasLoss = (last?.pnl ?? 0) < 0;

  const sessTrades = opts.sessionTradeCount ?? 0;
  const sessMedian = opts.sessionMedian ?? 0;

  const drivers: TiltDriver[] = [];
  let score = 0;

  const streakPts = 25 * Math.min(lossStreak, 3);
  if (streakPts > 0) {
    score += streakPts;
    if (lossStreak >= 2) drivers.push("streak");
  }
  if (sizeRatio >= 1.5) {
    score += 30;
    drivers.push("size");
  }
  if (minsSinceLoss != null && minsSinceLoss < 30 && lastWasLoss) {
    score += 25;
    drivers.push("revenge-window");
  }
  if (sessMedian > 0 && sessTrades > sessMedian * 1.5) {
    score += 20;
    drivers.push("overtrading");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const level = score >= 60 ? "hot" : score >= 35 ? "warm" : "calm";

  // Dominant driver by point weight, for the one-line reason.
  const weight: Record<TiltDriver, number> = {
    "revenge-window": minsSinceLoss != null && minsSinceLoss < 30 && lastWasLoss ? 25 : 0,
    size: sizeRatio >= 1.5 ? 30 : 0,
    streak: streakPts,
    overtrading: sessMedian > 0 && sessTrades > sessMedian * 1.5 ? 20 : 0,
  };
  const top =
    drivers.length === 0
      ? null
      : [...drivers].sort((a, b) => weight[b] - weight[a])[0]!;

  return {
    score,
    level,
    drivers,
    top,
    detail: {
      lossStreak,
      sizeRatio: Number.isFinite(sizeRatio) ? Number(sizeRatio.toFixed(2)) : 1,
      minsSinceLoss: minsSinceLoss == null ? null : Math.round(minsSinceLoss),
      sessionTrades: sessTrades,
    },
  };
}

/** His realized PnL on tilt-flagged entries vs calm ones — the proof, in his own money. */
export function tiltVsCalmPnl(trades: Trade[]): { tiltPnl: number; calmPnl: number; tiltCount: number; calmCount: number } {
  const closed = closedTrades(trades);
  let tiltPnl = 0,
    calmPnl = 0,
    tiltCount = 0,
    calmCount = 0;
  for (const t of closed) {
    const flagged = t.brokeRuleAfterLoss || t.emotion === "revenge";
    if (flagged) {
      tiltPnl += t.pnl ?? 0;
      tiltCount += 1;
    } else {
      calmPnl += t.pnl ?? 0;
      calmCount += 1;
    }
  }
  return { tiltPnl, calmPnl, tiltCount, calmCount };
}

/* ------------------------------------------------------------------ *
 * 2. Equity circuit-breaker — drawdown mechanically shrinks risk.
 * ------------------------------------------------------------------ */

export type DrawdownReport = {
  equity: number;
  peak: number;
  drawdownPct: number;
  /** Multiply the allowed risk by this (<=1, never scales up). */
  riskScale: number;
  /** Hard day-stop when the bleed is deep, independent of the 2-loss lock. */
  circuitTripped: boolean;
};

export function drawdownReport(startingEquity: number, trades: Trade[]): DrawdownReport {
  const closed = closedByTime(trades);
  let equity = startingEquity;
  let peak = startingEquity;
  for (const t of closed) {
    equity += t.pnl ?? 0;
    if (equity > peak) peak = equity;
  }
  const live = currentEquity(startingEquity, trades);
  const drawdownPct = peak > 0 ? Math.max(0, ((peak - live) / peak) * 100) : 0;
  // maxRisk% = 2 * clamp(equity/peak, .5, 1) -> scale in [0.5, 1].
  const riskScale = peak > 0 ? Math.max(0.5, Math.min(1, live / peak)) : 1;
  return {
    equity: live,
    peak,
    drawdownPct: Number(drawdownPct.toFixed(2)),
    riskScale: Number(riskScale.toFixed(3)),
    circuitTripped: drawdownPct >= 5,
  };
}

/* ------------------------------------------------------------------ *
 * 3. Session expectancy — which hours actually pay him.
 * ------------------------------------------------------------------ */

export type BucketExpectancy = {
  bucket: SessionWindow;
  n: number;
  expectancy: number; // mean PnL per trade
  total: number;
  confident: boolean; // n >= MIN_SAMPLES
};

export const EXPECTANCY_MIN_SAMPLES = 8;

/** Bucket a trade by the gold session it was opened in. */
function tradeWindow(t: Trade, labelOf: (d: Date) => { id: SessionWindow }): SessionWindow {
  const at = t.openedAt ? new Date(t.openedAt) : new Date();
  return labelOf(at).id;
}

export function sessionExpectancy(
  trades: Trade[],
  labelOf: (d: Date) => { id: SessionWindow },
): BucketExpectancy[] {
  const buckets = new Map<SessionWindow, Trade[]>();
  for (const t of closedTrades(trades)) {
    const w = tradeWindow(t, labelOf);
    if (!buckets.has(w)) buckets.set(w, []);
    buckets.get(w)!.push(t);
  }
  return [...buckets.entries()]
    .map(([bucket, rows]) => {
      const total = rows.reduce((a, t) => a + (t.pnl ?? 0), 0);
      return {
        bucket,
        n: rows.length,
        total,
        expectancy: rows.length ? total / rows.length : 0,
        confident: rows.length >= EXPECTANCY_MIN_SAMPLES,
      };
    })
    .sort((a, b) => a.expectancy - b.expectancy);
}

/** Confident-negative expectancy for the CURRENT session window, if any. */
export function losingSession(
  trades: Trade[],
  current: SessionWindow,
  labelOf: (d: Date) => { id: SessionWindow },
): BucketExpectancy | null {
  const row = sessionExpectancy(trades, labelOf).find((b) => b.bucket === current);
  return row && row.confident && row.expectancy < 0 ? row : null;
}

/* ------------------------------------------------------------------ *
 * 4. Volatility regime — ATR-scaled ceilings. Pure helpers over a
 *    daily ATR fetched by the /api/gold/atr route.
 * ------------------------------------------------------------------ */

export type AtrSnapshot = {
  atr14: number;
  atrRef: number; // longer-baseline ATR (e.g. ATR100 or 90d median)
  updatedAt: string;
};

export type VolRegime = {
  atr14: number;
  ratio: number; // atr14 / atrRef
  expansion: boolean; // ratio > 1.3
  /** Effective habit-size ceiling in % of capital (3 normally, 2 in expansion). */
  habitPct: number;
};

export function volRegime(atr: AtrSnapshot | null, baseHabitPct = 3): VolRegime | null {
  if (!atr || atr.atr14 <= 0 || atr.atrRef <= 0) return null;
  const ratio = atr.atr14 / atr.atrRef;
  const expansion = ratio > 1.3;
  return {
    atr14: atr.atr14,
    ratio: Number(ratio.toFixed(2)),
    expansion,
    habitPct: expansion ? Math.min(baseHabitPct, 2) : baseHabitPct,
  };
}

/** True when the planned stop is inside a single ATR of noise (a fake-safe stop). */
export function stopInsideNoise(stopDist: number, atr14: number): boolean {
  return atr14 > 0 && stopDist > 0 && stopDist < 0.35 * atr14;
}

/* ------------------------------------------------------------------ *
 * 5. Session range budget — how much of the day's ATR is already spent.
 *    Uses the trader's own /api/gold poll stream (session hi/lo), so no
 *    intraday OHLC purchase is needed.
 * ------------------------------------------------------------------ */

export function rangeBudget(sessionHigh: number, sessionLow: number, atr14: number): number | null {
  if (atr14 <= 0 || sessionHigh <= 0 || sessionLow <= 0 || sessionHigh < sessionLow) return null;
  return Number(((sessionHigh - sessionLow) / atr14).toFixed(2));
}

/* ------------------------------------------------------------------ *
 * 6. Round-level sweep — a stop-hunt through a $50 level that snapped
 *    back. Detected from a client ring buffer of the quote we poll.
 * ------------------------------------------------------------------ */

export type Tick = { price: number; t: number };

const SWEEP_WINDOW_MS = 15 * MS_MIN;

/**
 * A liquidity sweep: within the last 15 min price traded >= $1 beyond the
 * nearest $50 level, then closed back inside. Advisory: "sit 15 min."
 */
export function detectSweep(ticks: Tick[], now = Date.now(), beyond = 1): { swept: boolean; level: number | null } {
  const recent = ticks.filter((k) => now - k.t <= SWEEP_WINDOW_MS && k.price > 0);
  if (recent.length < 3) return { swept: false, level: null };
  const last = recent.at(-1)!.price;
  const level = Math.round(last / 50) * 50;
  const overshoot = recent.some((k) => Math.abs(k.price - level) >= beyond && crossedBeyond(k.price, level, beyond));
  const backInside = Math.abs(last - level) < beyond;
  return { swept: overshoot && backInside, level: overshoot && backInside ? level : null };
}

function crossedBeyond(price: number, level: number, beyond: number): boolean {
  return price >= level + beyond || price <= level - beyond;
}
