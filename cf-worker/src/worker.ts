/**
 * Motions on Cloudflare — the serverless autopilot host.
 *
 * A Cron Trigger ticks a single Durable Object once a minute; the DO holds the
 * account state + kill-switch and drives MetaApi over REST (MetaApi's cloud
 * holds the live MT5 connection, so we only make stateless calls — a perfect
 * fit for Workers). No VPS to babysit; always-on; the broker-side stop protects
 * against fast moves regardless of the 1-minute cadence.
 *
 * Same three safety-gated states as the FORGE daemon: SHADOW (no creds),
 * LIVE-DRY (creds, not armed → decide + log, place nothing), LIVE-ARMED
 * (creds + MOTIONS_ARM=1). A stored kill flag stops new entries; /kill and /arm
 * are admin-token protected.
 *
 * The decision engine, envelope, and news calendar are the SAME modules the app
 * and the FORGE worker use (imported, not copied) — one source of truth.
 */
import {
  DEFAULT_ENVELOPE,
  decideMotions,
  freshAccount,
  killAll,
  rollAnchors,
  unkill,
} from "@/lib/motions/engine";
import { blackoutReport } from "@/lib/still/econ-calendar";
import { goldSessionLabel } from "@/lib/still/stats";
import type { MotionsAccount, MotionsAction } from "@/lib/motions/types";

export interface Env {
  MOTIONS: DurableObjectNamespace;
  METAAPI_TOKEN?: string;
  MT5_ACCOUNT_ID?: string;
  // Region base, e.g. https://mt-client-api-v1.new-york.agiliumtrade.ai
  // (validate against the account's real region on the first token).
  METAAPI_BASE_URL?: string;
  GOLD_SYMBOL?: string;
  GOLD_URL?: string;
  ATR_URL?: string;
  MOTIONS_ARM?: string; // "1" → place real orders
  ADMIN_TOKEN?: string; // protects /kill and /arm
  START_EQUITY?: string;
}

type Mode = "shadow" | "live-dry" | "live-armed";

function mode(env: Env): Mode {
  if (env.METAAPI_TOKEN && env.MT5_ACCOUNT_ID) return env.MOTIONS_ARM === "1" ? "live-armed" : "live-dry";
  return "shadow";
}

function log(event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ svc: "motions-cf", event, ...data }));
}

/* --- MetaApi client REST (MetaApi cloud holds the MT5 connection) --------- */

function metaBase(env: Env): string {
  return env.METAAPI_BASE_URL ?? "https://mt-client-api-v1.new-york.agiliumtrade.ai";
}
function metaHeaders(env: Env): HeadersInit {
  return { "auth-token": env.METAAPI_TOKEN ?? "", "content-type": "application/json" };
}
async function metaGet<T>(env: Env, path: string): Promise<T> {
  const res = await fetch(`${metaBase(env)}/users/current/accounts/${env.MT5_ACCOUNT_ID}${path}`, {
    headers: metaHeaders(env),
  });
  if (!res.ok) throw new Error(`metaapi ${path} ${res.status}`);
  return (await res.json()) as T;
}
async function metaTrade(env: Env, body: Record<string, unknown>): Promise<{ orderId?: string; stringCode?: string }> {
  const res = await fetch(`${metaBase(env)}/users/current/accounts/${env.MT5_ACCOUNT_ID}/trade`, {
    method: "POST",
    headers: metaHeaders(env),
    body: JSON.stringify({ trade: body }),
  });
  const out = (await res.json()) as { orderId?: string; stringCode?: string; message?: string };
  if (!res.ok) throw new Error(`metaapi trade ${res.status} ${out.message ?? ""}`);
  return out;
}

/* --- market inputs (reuse the app's live endpoints) ----------------------- */

async function fetchGold(env: Env): Promise<{ price: number; change: number } | null> {
  try {
    const res = await fetch(env.GOLD_URL ?? "https://still-coral-theta.vercel.app/api/gold");
    if (!res.ok) return null;
    const q = (await res.json()) as { price?: number; change?: number };
    return Number.isFinite(q.price) ? { price: Number(q.price), change: Number(q.change ?? 0) } : null;
  } catch {
    return null;
  }
}
async function fetchAtr(env: Env): Promise<number | null> {
  try {
    const res = await fetch(env.ATR_URL ?? "https://still-coral-theta.vercel.app/api/atr");
    if (!res.ok) return null;
    const a = (await res.json()) as { atr14?: number };
    return Number.isFinite(a.atr14) && Number(a.atr14) > 0 ? Number(a.atr14) : null;
  } catch {
    return null;
  }
}

/* --- the Durable Object: one singleton holds state + kill + tick ---------- */

export class MotionsController {
  private storage: DurableObjectStorage;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.storage = state.storage;
    this.env = env;
  }

  private async account(): Promise<MotionsAccount> {
    const saved = await this.storage.get<MotionsAccount>("account");
    return saved ?? freshAccount(Number(this.env.START_EQUITY ?? 10_000), Date.now());
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/tick") {
      const r = await this.tick();
      return Response.json(r);
    }
    if (url.pathname === "/status") {
      return Response.json(await this.status());
    }
    if (url.pathname === "/kill") {
      await this.storage.put("account", killAll(await this.account()));
      log("kill");
      return Response.json({ ok: true, killed: true });
    }
    if (url.pathname === "/arm") {
      await this.storage.put("account", unkill(await this.account()));
      log("arm");
      return Response.json({ ok: true, killed: false });
    }
    if (url.pathname === "/reset") {
      await this.storage.put("account", freshAccount(Number(this.env.START_EQUITY ?? 10_000), Date.now()));
      return Response.json({ ok: true, reset: true });
    }
    return new Response("not found", { status: 404 });
  }

  private async status() {
    const a = await this.account();
    return {
      mode: mode(this.env),
      armed: this.env.MOTIONS_ARM === "1",
      account: {
        equity: Math.round(a.equity),
        dayPnl: Math.round(a.equity - a.dayAnchor),
        weekPnl: Math.round(a.equity - a.weekAnchor),
        position: a.position,
        lock: a.lock,
        killed: a.killed,
        realized: a.realized.length,
      },
      envelope: DEFAULT_ENVELOPE,
    };
  }

  async tick(): Promise<{ mode: Mode; action: MotionsAction["type"]; reason?: string }> {
    const env = this.env;
    const m = mode(env);
    const now = Date.now();
    const gold = await fetchGold(env);
    const atr14 = await fetchAtr(env);
    if (!gold) {
      log("no_gold");
      return { mode: m, action: "sit", reason: "no-print" };
    }
    const window = goldSessionLabel(new Date(now)).id;
    const nearest = Math.round(gold.price / 50) * 50;
    const nearLevel = Math.abs(gold.price - nearest) <= DEFAULT_ENVELOPE.levelProximity ? nearest : null;
    const blackout = blackoutReport(new Date(now));
    const intelBlocked = blackout.state !== "clear";
    const intelReason = blackout.state;

    let a = rollAnchors(await this.account(), now);

    // In live modes, sync equity + position from the broker first.
    if (m !== "shadow") {
      try {
        const info = await metaGet<{ equity: number }>(env, "/account-information");
        const positions = await metaGet<Array<{ id: string; type: string; volume: number; openPrice: number; stopLoss?: number; takeProfit?: number }>>(env, "/positions");
        const p = positions[0];
        a = {
          ...a,
          equity: info.equity,
          position: p
            ? { id: p.id, side: p.type === "POSITION_TYPE_SELL" ? "short" : "long", entry: p.openPrice, stop: p.stopLoss ?? 0, target: p.takeProfit ?? 0, lots: p.volume, riskUsd: 0, openedAt: a.position?.openedAt ?? now }
            : null,
        };
      } catch (err) {
        log("broker_read_failed", { err: String(err) });
        await this.storage.put("account", a);
        return { mode: m, action: "sit", reason: "broker-unreachable" };
      }
    }

    const ctx = { account: a, price: gold.price, atr14, window, drift: gold.change, nearLevel, intelBlocked, intelReason, now };
    const action = decideMotions(ctx, DEFAULT_ENVELOPE);

    if (m === "live-armed" && !a.killed) {
      try {
        if (action.type === "propose" && !a.position) {
          const o = action.order;
          const r = await metaTrade(env, {
            actionType: o.side === "long" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL",
            symbol: env.GOLD_SYMBOL ?? "XAUUSD",
            volume: o.lots,
            stopLoss: o.stop,
            takeProfit: o.target,
          });
          log("order_placed", { side: o.side, lots: o.lots, stop: o.stop, target: o.target, code: r.stringCode });
        } else if (action.type === "flatten" && a.position) {
          await metaTrade(env, { actionType: "POSITION_CLOSE_ID", positionId: a.position.id });
          log("position_closed", { id: a.position.id, reason: action.reason });
        }
      } catch (err) {
        log("trade_failed", { err: String(err) });
      }
    } else if (m !== "shadow") {
      log("dry_run", { action: action.type, reason: (action as { reason?: string }).reason });
    }

    await this.storage.put("account", a);
    log("tick", { mode: m, action: action.type, reason: (action as { reason?: string }).reason, price: gold.price, atr14, window, equity: Math.round(a.equity), killed: a.killed });
    return { mode: m, action: action.type, reason: (action as { reason?: string }).reason };
  }
}

/* --- Worker entrypoint: cron ticks the DO; fetch exposes status/kill ------ */

function stub(env: Env) {
  return env.MOTIONS.get(env.MOTIONS.idFromName("motions"));
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(stub(env).fetch("https://do/tick").then(() => undefined));
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/health") return Response.json({ ok: true, mode: mode(env) });
    if (url.pathname === "/status") return stub(env).fetch("https://do/status");
    // Mutating routes require the admin token.
    if (url.pathname === "/kill" || url.pathname === "/arm" || url.pathname === "/reset") {
      const tok = req.headers.get("x-admin-token");
      if (!env.ADMIN_TOKEN || tok !== env.ADMIN_TOKEN) return new Response("unauthorized", { status: 401 });
      return stub(env).fetch(`https://do${url.pathname}`);
    }
    return new Response("Motions worker. Try /health or /status.", { status: 200 });
  },
} satisfies ExportedHandler<Env>;
