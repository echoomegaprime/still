/**
 * The broker seam. Motions decides; a Broker executes. The paper simulation and
 * the live MetaApi adapter implement the same tiny surface, so the engine never
 * knows or cares whether a dollar is real.
 *
 * IMPORTANT: the live broker runs in a server-side worker (see docs/MOTIONS.md),
 * never in the browser. The web app is monitor + kill-switch only.
 */
import type { Side } from "@/lib/still/types";

export type BrokerAccount = { balance: number; equity: number };

export type BrokerPosition = {
  id: string;
  side: Side;
  volume: number; // lots
  entry: number;
  stop: number | null;
  target: number | null;
  unrealizedPnl: number;
};

export type OrderResult = { orderId: string; code: string };

export interface Broker {
  /** Balance + equity. */
  getAccount(): Promise<BrokerAccount>;
  /** Open positions (Motions holds at most one). */
  positions(): Promise<BrokerPosition[]>;
  /** Market order WITH a broker-side stop + target attached at submission. */
  marketOrder(
    side: Side,
    volumeLots: number,
    stop: number,
    target: number,
    clientId: string,
  ): Promise<OrderResult>;
  /** Move a position's stop/target. */
  modify(positionId: string, stop: number, target: number): Promise<void>;
  /** Close a position now (the flatten / kill path). */
  close(positionId: string): Promise<void>;
}

/** Env config for the live worker. Absent → the worker refuses to run live. */
export type MotionsBrokerEnv = {
  token?: string; // MOTIONS_METAAPI_TOKEN
  accountId?: string; // MOTIONS_MT5_ACCOUNT_ID
  symbol?: string; // MOTIONS_GOLD_SYMBOL (broker-specific, e.g. "XAUUSD" / "GOLD")
  region?: string; // MOTIONS_METAAPI_REGION
};

export function readBrokerEnv(env: Record<string, string | undefined> = process.env): MotionsBrokerEnv {
  return {
    token: env.MOTIONS_METAAPI_TOKEN?.trim() || undefined,
    accountId: env.MOTIONS_MT5_ACCOUNT_ID?.trim() || undefined,
    symbol: env.MOTIONS_GOLD_SYMBOL?.trim() || "XAUUSD",
    region: env.MOTIONS_METAAPI_REGION?.trim() || undefined,
  };
}

/** True only when a real MT5 account + token are configured. */
export function liveConfigured(env = readBrokerEnv()): boolean {
  return Boolean(env.token && env.accountId);
}
