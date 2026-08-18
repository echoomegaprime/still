/**
 * Motions worker — the server-side daemon that runs the autopilot.
 *
 * Three states, gated so nothing trades real money by accident:
 *   1. SHADOW  (default; no broker creds) — runs the full engine against the
 *      live gold price on a simulated account, logs every decision. Proves the
 *      cage end-to-end with zero exposure.
 *   2. LIVE-DRY (MOTIONS_METAAPI_TOKEN + MOTIONS_MT5_ACCOUNT_ID set, but not
 *      armed) — connects to the real MT5 account READ-ONLY, decides, and logs
 *      what it WOULD do. Places nothing. This is the "watch it on the real
 *      account first" step.
 *   3. LIVE-ARMED (creds + MOTIONS_ARM=1) — actually places/closes orders,
 *      every one carrying a broker-side stop, inside the immutable envelope.
 *
 * A halt file (MOTIONS_HALT_FILE, default /etc/echo/motions.halt) is the
 * kill-switch: while it exists, no new entries — reachable even if everything
 * else is down. Heartbeat + status are written every tick.
 *
 * Bundle: npm run build:worker  ->  worker/dist/motions-worker.mjs (Node ESM).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { blackoutReport } from "@/lib/still/econ-calendar";
import { goldSessionLabel } from "@/lib/still/stats";
import {
  DEFAULT_ENVELOPE,
  decideMotions,
  freshAccount,
  killAll,
  rollAnchors,
  unkill,
} from "@/lib/motions/engine";
import { tickPaper } from "@/lib/motions/paper-broker";
import { liveConfigured, readBrokerEnv } from "@/lib/motions/broker";
import type { Broker } from "@/lib/motions/broker";
import type { MotionsAccount, MotionsAction } from "@/lib/motions/types";

const GOLD_URL = process.env.MOTIONS_GOLD_URL ?? "https://still-coral-theta.vercel.app/api/gold";
const ATR_URL = process.env.MOTIONS_ATR_URL ?? "https://still-coral-theta.vercel.app/api/atr";
const STATE_FILE = process.env.MOTIONS_STATE_FILE ?? "/home/forge/echo-motions/state.json";
const STATUS_FILE = process.env.MOTIONS_STATUS_FILE ?? "/home/forge/echo-motions/status.json";
const HEARTBEAT_FILE = process.env.MOTIONS_HEARTBEAT_FILE ?? "/home/forge/echo-motions/heartbeat";
const HALT_FILE = process.env.MOTIONS_HALT_FILE ?? "/etc/echo/motions.halt";
const TICK_MS = Number(process.env.MOTIONS_TICK_MS ?? 20_000);
const START_EQUITY = Number(process.env.MOTIONS_START_EQUITY ?? 10_000);
const ARMED = process.env.MOTIONS_ARM === "1";

type Mode = "shadow" | "live-dry" | "live-armed";

function log(level: "info" | "warn" | "error", event: string, data: Record<string, unknown> = {}): void {
  process.stdout.write(JSON.stringify({ t: new Date().toISOString(), level, svc: "motions-worker", event, ...data }) + "\n");
}

function ensureDir(file: string): void {
  try {
    mkdirSync(dirname(file), { recursive: true });
  } catch {
    /* ignore */
  }
}

function loadAccount(now: number): MotionsAccount {
  try {
    if (existsSync(STATE_FILE)) return JSON.parse(readFileSync(STATE_FILE, "utf8")) as MotionsAccount;
  } catch (err) {
    log("warn", "state_load_failed", { err: String(err) });
  }
  return freshAccount(START_EQUITY, now);
}

function saveJson(file: string, value: unknown): void {
  try {
    ensureDir(file);
    writeFileSync(file, JSON.stringify(value, null, 2));
  } catch (err) {
    log("error", "write_failed", { file, err: String(err) });
  }
}

async function fetchGold(): Promise<{ price: number; change: number } | null> {
  try {
    const res = await fetch(GOLD_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const q = (await res.json()) as { price?: number; change?: number };
    return Number.isFinite(q.price) ? { price: Number(q.price), change: Number(q.change ?? 0) } : null;
  } catch {
    return null;
  }
}

async function fetchAtr(): Promise<number | null> {
  try {
    const res = await fetch(ATR_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const a = (await res.json()) as { atr14?: number };
    return Number.isFinite(a.atr14) && Number(a.atr14) > 0 ? Number(a.atr14) : null;
  } catch {
    return null;
  }
}

function nearLevelOf(price: number): number | null {
  const nearest = Math.round(price / 50) * 50;
  return Math.abs(price - nearest) <= DEFAULT_ENVELOPE.levelProximity ? nearest : null;
}

let broker: Broker | null = null;
async function getLiveBroker(): Promise<Broker> {
  if (broker) return broker;
  const { LiveBroker } = await import("@/lib/motions/live-broker");
  broker = new LiveBroker(readBrokerEnv());
  return broker;
}

async function tick(mode: Mode, account: MotionsAccount): Promise<MotionsAccount> {
  const now = Date.now();
  const halted = existsSync(HALT_FILE);
  const gold = await fetchGold();
  const atr14 = await fetchAtr();
  if (!gold) {
    log("warn", "no_gold_print");
    saveHeartbeat(now);
    return account;
  }

  const window = goldSessionLabel(new Date(now)).id;
  const nearLevel = nearLevelOf(gold.price);
  const blackout = blackoutReport(new Date(now));
  const intelBlocked = blackout.state !== "clear";
  const intelReason = blackout.state;

  let next = rollAnchors(account, now);
  // Halt file is the kill-switch — while present, no new entries.
  if (halted && !next.killed) next = killAll(next);
  if (!halted && next.killed && next.lock === "killed") next = unkill(next);

  let action: MotionsAction;

  if (mode === "shadow") {
    const stepped = tickPaper(
      next,
      { price: gold.price, atr14, window, drift: gold.change, nearLevel, intelBlocked, intelReason, now },
      DEFAULT_ENVELOPE,
    );
    next = stepped.account;
    action = stepped.action;
  } else {
    // Live: read the real account + positions, decide, and only act if armed.
    const b = await getLiveBroker();
    const acct = await b.getAccount();
    const positions = await b.positions();
    const live = positions[0];
    next = {
      ...next,
      equity: acct.equity,
      position: live
        ? {
            id: live.id,
            side: live.side,
            entry: live.entry,
            stop: live.stop ?? 0,
            target: live.target ?? 0,
            lots: live.volume,
            riskUsd: 0,
            openedAt: next.position?.openedAt ?? now,
          }
        : null,
    };
    action = decideMotions(
      { account: next, price: gold.price, atr14, window, drift: gold.change, nearLevel, intelBlocked, intelReason, now },
      DEFAULT_ENVELOPE,
    );
    if (mode === "live-armed" && !halted) {
      if (action.type === "propose" && !next.position) {
        const o = action.order;
        const r = await b.marketOrder(o.side, o.lots, o.stop, o.target, `motions-${now}`);
        log("info", "order_placed", { side: o.side, lots: o.lots, entry: o.entry, stop: o.stop, target: o.target, code: r.code });
      } else if (action.type === "flatten" && next.position) {
        await b.close(next.position.id);
        log("info", "position_closed", { id: next.position.id, reason: action.reason });
      }
    } else {
      log("info", "dry_run_decision", { action: action.type, reason: (action as { reason?: string }).reason });
    }
  }

  log("info", "tick", {
    mode,
    halted,
    action: action.type,
    reason: (action as { reason?: string }).reason,
    price: gold.price,
    atr14,
    window,
    equity: Math.round(next.equity),
    position: next.position ? next.position.side : null,
    lock: next.lock,
  });

  saveJson(STATE_FILE, next);
  saveJson(STATUS_FILE, {
    mode,
    armed: ARMED,
    halted,
    updatedAt: new Date(now).toISOString(),
    action: action.type,
    reason: (action as { reason?: string }).reason ?? null,
    price: gold.price,
    atr14,
    window,
    account: {
      equity: Math.round(next.equity),
      dayPnl: Math.round(next.equity - next.dayAnchor),
      weekPnl: Math.round(next.equity - next.weekAnchor),
      position: next.position,
      lock: next.lock,
      killed: next.killed,
      realizedCount: next.realized.length,
    },
    envelope: DEFAULT_ENVELOPE,
  });
  saveHeartbeat(now);
  return next;
}

function saveHeartbeat(now: number): void {
  try {
    ensureDir(HEARTBEAT_FILE);
    writeFileSync(HEARTBEAT_FILE, String(now));
  } catch {
    /* ignore */
  }
}

async function main(): Promise<void> {
  const env = readBrokerEnv();
  const mode: Mode = liveConfigured(env) ? (ARMED ? "live-armed" : "live-dry") : "shadow";
  log("info", "boot", {
    mode,
    armed: ARMED,
    gold: GOLD_URL,
    tickMs: TICK_MS,
    startEquity: START_EQUITY,
    symbol: env.symbol,
    note:
      mode === "shadow"
        ? "no broker creds — simulating, placing nothing"
        : mode === "live-dry"
          ? "connected read-only — logging decisions, placing nothing (set MOTIONS_ARM=1 to trade)"
          : "ARMED — placing real orders inside the envelope",
  });

  let account = loadAccount(Date.now());
  // Never boot armed with an inherited kill still latched unintentionally.
  for (;;) {
    try {
      account = await tick(mode, account);
    } catch (err) {
      log("error", "tick_failed", { err: String(err) });
    }
    await new Promise((r) => setTimeout(r, TICK_MS));
  }
}

void main();
