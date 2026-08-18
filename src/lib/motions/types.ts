/**
 * Motions — the autonomous companion to Still. A cage, not a gun.
 *
 * Every type here encodes a constraint. Motions can only ever trade *less* than
 * the user would by hand: one position, fixed small risk, a broker-side stop on
 * every order, hard session/day/week locks, a news blackout, and a kill-switch.
 * There is deliberately no knob for size, frequency, or "aggression."
 *
 * See docs/MOTIONS.md for the full design and the guardrail rationale.
 */
import type { SessionWindow } from "@/lib/still/stats";
import type { Side } from "@/lib/still/types";

/** The immutable trading envelope. No user-facing knobs — these are the cage bars. */
export type MotionsEnvelope = {
  riskPct: number; // % of equity risked per trade (0.25–0.5)
  atrStopMult: number; // stop = mult × ATR(14)
  targetR: number; // take-profit in R multiples
  maxConsecutiveLosses: number; // → session lock
  dayStopPct: number; // −% day → flat + day lock
  weekStopPct: number; // −% week → week lock
  newsBlackoutMin: number; // ± minutes around a high-impact print
  levelProximity: number; // $ from a round $50 level to call a pullback
  sessions: SessionWindow[]; // only trade these windows
  maxSlippage: number; // $; cancel a fill worse than this
};

export type MotionsPosition = {
  id: string;
  side: Side;
  entry: number;
  stop: number;
  target: number;
  lots: number;
  riskUsd: number;
  openedAt: number;
};

export type MotionsLock =
  | null
  | "consecutive-losses"
  | "day-stop"
  | "week-stop"
  | "killed";

export type MotionsAccount = {
  startEquity: number;
  equity: number;
  peakEquity: number;
  dayAnchor: number; // equity at the start of the trading day
  weekAnchor: number; // equity at the start of the trading week
  dayKey: string; // yyyy-mm-dd (UTC) the day anchor belongs to
  weekKey: string; // iso week the week anchor belongs to
  sessionLosses: number; // consecutive losses this session
  position: MotionsPosition | null;
  lock: MotionsLock;
  killed: boolean;
  realized: MotionsFill[]; // closed trades (paper or broker-confirmed)
};

export type MotionsFill = {
  id: string;
  side: Side;
  entry: number;
  exit: number;
  lots: number;
  pnl: number;
  reason: "stop" | "target" | "flatten";
  at: number;
};

/** What the engine decides on a given tick. It only ever protects or proposes. */
export type MotionsAction =
  | { type: "killed" }
  | { type: "locked"; lock: MotionsLock; reason: string }
  | { type: "sit"; reason: string } // default output — no valid setup / not the window
  | { type: "manage"; reason: string } // hold an open position, stop already attached
  | { type: "flatten"; reason: string } // close now (breach)
  | {
      type: "propose";
      reason: string;
      order: { side: Side; entry: number; stop: number; target: number; lots: number; riskUsd: number };
    };

/** Everything the engine needs to decide, computed by the caller each tick. */
export type MotionsContext = {
  account: MotionsAccount;
  price: number | null;
  atr14: number | null;
  window: SessionWindow;
  drift: number; // sign of recent price drift, for direction (never a size input)
  nearLevel: number | null; // the $50 level price is sitting on, or null
  intelBlocked: boolean; // tilt hot / news blackout / drawdown circuit — from Still's Watchman
  intelReason: string;
  now: number;
};
