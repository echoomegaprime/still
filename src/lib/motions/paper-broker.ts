/**
 * Paper broker — runs the full Motions engine against the live gold price with
 * no real money and no broker. It exists so the cage can be proven end-to-end
 * (a setup, a stop, a target, the locks, the kill) before a single real dollar
 * is ever at risk. The live adapter (live-broker.ts) implements the same shape.
 */
import { pnlFromMove } from "@/lib/still/gold";
import type { SessionWindow } from "@/lib/still/stats";
import {
  applyFill,
  decideMotions,
  DEFAULT_ENVELOPE,
  openPosition,
  rollAnchors,
} from "./engine";
import type { MotionsAccount, MotionsAction, MotionsEnvelope, MotionsFill } from "./types";

export type TickInput = {
  price: number | null;
  atr14: number | null;
  window: SessionWindow;
  drift: number;
  nearLevel: number | null;
  intelBlocked: boolean;
  intelReason: string;
  now: number;
};

let seq = 0;
function fid(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

/** Did `price` cross the position's stop or target this tick? */
function exitOnPrice(
  side: "long" | "short",
  price: number,
  stop: number,
  target: number,
): "stop" | "target" | null {
  if (side === "long") {
    if (price <= stop) return "stop";
    if (price >= target) return "target";
  } else {
    if (price >= stop) return "stop";
    if (price <= target) return "target";
  }
  return null;
}

/**
 * Advance the paper account one tick. Deterministic given (account, input).
 * Returns the next account and the action the engine took.
 */
export function tickPaper(
  account: MotionsAccount,
  input: TickInput,
  env: MotionsEnvelope = DEFAULT_ENVELOPE,
): { account: MotionsAccount; action: MotionsAction } {
  let a = rollAnchors(account, input.now);

  if (a.killed) return { account: a, action: { type: "killed" } };
  if (input.price == null) return { account: a, action: { type: "sit", reason: "no-print" } };

  // Manage / exit an open position.
  if (a.position) {
    const pos = a.position;
    const hit = exitOnPrice(pos.side, input.price, pos.stop, pos.target);
    // A day/week breach flattens even if neither stop nor target is touched.
    const decision = decideMotions({ ...ctx(a, input) }, env);
    if (hit || decision.type === "flatten") {
      const exit = hit === "stop" ? pos.stop : hit === "target" ? pos.target : input.price;
      const pnl = pnlFromMove(pos.side, pos.entry, exit, pos.lots);
      const fill: MotionsFill = {
        id: fid("f"),
        side: pos.side,
        entry: pos.entry,
        exit,
        lots: pos.lots,
        pnl: Number(pnl.toFixed(2)),
        reason: hit ?? "flatten",
        at: input.now,
      };
      a = applyFill(a, fill, env);
      return { account: a, action: { type: "flatten", reason: fill.reason } };
    }
    return { account: a, action: { type: "manage", reason: "stop-attached" } };
  }

  // No position — decide, and in paper mode auto-confirm the proposal (the
  // semi-auto human tap is simulated). Slippage is zero on paper.
  const decision = decideMotions(ctx(a, input), env);
  if (decision.type === "propose") {
    a = openPosition(a, {
      id: fid("p"),
      side: decision.order.side,
      entry: decision.order.entry,
      stop: decision.order.stop,
      target: decision.order.target,
      lots: decision.order.lots,
      riskUsd: decision.order.riskUsd,
      openedAt: input.now,
    });
    return { account: a, action: decision };
  }
  return { account: a, action: decision };
}

function ctx(account: MotionsAccount, input: TickInput) {
  return {
    account,
    price: input.price,
    atr14: input.atr14,
    window: input.window,
    drift: input.drift,
    nearLevel: input.nearLevel,
    intelBlocked: input.intelBlocked,
    intelReason: input.intelReason,
    now: input.now,
  };
}
