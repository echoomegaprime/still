/**
 * The mastery gate — proof of discipline, not a passage of time.
 *
 * This is the lock in front of Motions (the autonomous add-on): Motions stays
 * dark until the trader has demonstrably *mastered* Still. Both Opus 5 and Fable
 * 5 were emphatic on two points, and both are encoded here:
 *   1. Score against REAL trade data, never self-report — a man who lies to
 *      himself cannot be gated on his own journaling. Today that data is his
 *      in-app log; when Motions is wired to a broker it becomes the read-only
 *      broker statement, and this same function scores it unchanged.
 *   2. Time alone unlocks nothing. Sample floors, distinct-week spread, and a
 *      breach that resets the clock make it hard to fake and hard to cram.
 *
 * Pure + deterministic (caller passes `now`). Also useful inside Still on its
 * own — it tells him, honestly, how disciplined he actually is.
 */
import { closedTrades } from "./stats";
import type { Settings, Trade } from "./types";

export const MASTERY = {
  windowDays: 90,
  minTrades: 100,
  minSpanDays: 90,
  minDistinctWeeks: 8,
  /** A trade only counts if it risked at least this % of capital (no micro-lot farming). */
  minTradeRiskPct: 0.1,
  /** Drawdown ceiling the score measures against (fraction of peak equity). */
  drawdownCap: 0.1,
  /** A hard breach inside this trailing window blocks the unlock and resets progress. */
  breachLookbackDays: 60,
  /** Discipline Score needed to unlock (0..1). */
  unlockScore: 0.92,
  weights: { adherence: 0.4, tiltAvoidance: 0.2, drawdownRespect: 0.2, breachCompliance: 0.2 },
} as const;

const DAY_MS = 86_400_000;

export type PrereqKey =
  | "masReqTrades"
  | "masReqDays"
  | "masReqWeeks"
  | "masReqNoBreach"
  | "masReqExpectancy"
  | "masReqScore";

export type Prereq = {
  key: PrereqKey;
  met: boolean;
  have: number;
  need: number;
};

export type MasteryReport = {
  score: number; // Discipline Score, 0..1
  components: {
    adherence: number;
    tiltAvoidance: number;
    drawdownRespect: number;
    breachCompliance: number;
  };
  expectancy: number; // winsorized mean PnL per counted trade
  counted: number;
  spanDays: number;
  distinctWeeks: number;
  maxDrawdownPct: number;
  recentBreach: boolean;
  prerequisites: Prereq[];
  unlocked: boolean;
  /** 0..100 — how close to unlock, for a progress bar. */
  progressPct: number;
};

const tradeTime = (t: Trade): number => Date.parse(t.closedAt ?? t.openedAt);

/** Compliant = followed every rule, sized within cap, calm, not a post-loss trade. */
function isCompliant(t: Trade, cap: number): boolean {
  const followed = Object.values(t.followedRules).every(Boolean);
  return followed && t.riskUsd <= cap * 1.01 && !t.brokeRuleAfterLoss && t.emotion === "calm";
}

/** Hard breach = the account-blowing behaviors: oversize, revenge, trading after a loss. */
function isHardBreach(t: Trade, cap: number): boolean {
  return t.riskUsd > cap * 1.01 || t.brokeRuleAfterLoss || t.emotion === "revenge";
}

/** Cap the largest wins at the 99th percentile so one lucky candle can't buy the gate. */
function winsorizedMean(pnls: number[]): number {
  if (pnls.length === 0) return 0;
  const sorted = [...pnls].sort((a, b) => a - b);
  const cutoff = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))]!;
  const capped = pnls.map((p) => (p > cutoff ? cutoff : p));
  return capped.reduce((a, b) => a + b, 0) / capped.length;
}

function maxDrawdownFraction(startEquity: number, trades: Trade[]): number {
  let equity = startEquity;
  let peak = startEquity;
  let maxDd = 0;
  for (const t of trades) {
    equity += t.pnl ?? 0;
    if (equity > peak) peak = equity;
    if (peak > 0) maxDd = Math.max(maxDd, (peak - equity) / peak);
  }
  return maxDd;
}

function isoWeek(ms: number): string {
  const d = new Date(ms);
  // ISO week key (year-week) — enough to count distinct weeks.
  const day = (d.getUTCDay() + 6) % 7;
  const thursday = new Date(d.getTime() + (3 - day) * DAY_MS);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${week}`;
}

export function masteryReport(
  trades: Trade[],
  settings: Settings,
  startEquity: number,
  now = Date.now(),
): MasteryReport {
  const cap = (settings.trueCapital * settings.maxRiskPct) / 100;
  const minRisk = settings.trueCapital * (MASTERY.minTradeRiskPct / 100);
  const windowStart = now - MASTERY.windowDays * DAY_MS;

  const inWindow = closedTrades(trades)
    .filter((t) => tradeTime(t) >= windowStart)
    .sort((a, b) => tradeTime(a) - tradeTime(b));
  // Counted trades exclude micro-lot risk (anti-gaming).
  const counted = inWindow.filter((t) => t.riskUsd >= minRisk);

  const n = counted.length;
  const compliant = counted.filter((t) => isCompliant(t, cap)).length;
  const tiltFlagged = counted.filter((t) => t.brokeRuleAfterLoss || t.emotion === "revenge").length;
  const breaches = counted.filter((t) => isHardBreach(t, cap)).length;

  const adherence = n ? compliant / n : 0;
  const tiltAvoidance = n ? 1 - tiltFlagged / n : 1;
  const breachCompliance = n ? 1 - breaches / n : 1;
  const maxDd = maxDrawdownFraction(startEquity, counted);
  const drawdownRespect = Math.max(0, Math.min(1, 1 - maxDd / MASTERY.drawdownCap));

  const w = MASTERY.weights;
  const score =
    w.adherence * adherence +
    w.tiltAvoidance * tiltAvoidance +
    w.drawdownRespect * drawdownRespect +
    w.breachCompliance * breachCompliance;

  const expectancy = winsorizedMean(counted.map((t) => t.pnl ?? 0));

  const spanDays = n >= 2 ? (tradeTime(counted.at(-1)!) - tradeTime(counted[0]!)) / DAY_MS : 0;
  const distinctWeeks = new Set(counted.map((t) => isoWeek(tradeTime(t)))).size;

  const breachCutoff = now - MASTERY.breachLookbackDays * DAY_MS;
  const recentBreach = counted.some((t) => isHardBreach(t, cap) && tradeTime(t) >= breachCutoff);

  const prerequisites: Prereq[] = [
    { key: "masReqTrades", met: n >= MASTERY.minTrades, have: n, need: MASTERY.minTrades },
    {
      key: "masReqDays",
      met: spanDays >= MASTERY.minSpanDays,
      have: Math.round(spanDays),
      need: MASTERY.minSpanDays,
    },
    {
      key: "masReqWeeks",
      met: distinctWeeks >= MASTERY.minDistinctWeeks,
      have: distinctWeeks,
      need: MASTERY.minDistinctWeeks,
    },
    { key: "masReqNoBreach", met: !recentBreach, have: recentBreach ? 1 : 0, need: 0 },
    { key: "masReqExpectancy", met: expectancy >= 0, have: Math.round(expectancy), need: 0 },
    {
      key: "masReqScore",
      met: score >= MASTERY.unlockScore,
      have: Math.round(score * 100),
      need: Math.round(MASTERY.unlockScore * 100),
    },
  ];

  const unlocked = prerequisites.every((p) => p.met);

  // Progress blends the score with how much of each floor is filled — so a fresh
  // trader sees honest, monotonic movement toward the gate, not a flat 0.
  const floors = [
    Math.min(1, n / MASTERY.minTrades),
    Math.min(1, spanDays / MASTERY.minSpanDays),
    Math.min(1, distinctWeeks / MASTERY.minDistinctWeeks),
    recentBreach ? 0 : 1,
    expectancy >= 0 ? 1 : 0,
    Math.min(1, score / MASTERY.unlockScore),
  ];
  const progressPct = Math.round((floors.reduce((a, b) => a + b, 0) / floors.length) * 100);

  return {
    score: Number(score.toFixed(3)),
    components: {
      adherence: Number(adherence.toFixed(3)),
      tiltAvoidance: Number(tiltAvoidance.toFixed(3)),
      drawdownRespect: Number(drawdownRespect.toFixed(3)),
      breachCompliance: Number(breachCompliance.toFixed(3)),
    },
    expectancy: Number(expectancy.toFixed(2)),
    counted: n,
    spanDays: Math.round(spanDays),
    distinctWeeks,
    maxDrawdownPct: Number((maxDd * 100).toFixed(2)),
    recentBreach,
    prerequisites,
    unlocked,
    progressPct,
  };
}
