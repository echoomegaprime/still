/**
 * Live broker adapter — MetaApi cloud (MetaTrader 4/5).
 *
 * This is the REAL execution path, grounded on the MetaApi JavaScript SDK RPC
 * API. It runs ONLY in the server-side Motions worker (a VPS/long-running
 * process — never the browser, never a serverless request), and only when a
 * real MT5 account + token are configured. Until then Motions runs paper-only.
 *
 * The SDK is loaded dynamically (variable specifier) so this file typechecks and
 * the app builds without `metaapi.cloud-sdk` installed; the worker installs it.
 *
 * Docs: https://github.com/metaapi/metaapi-javascript-sdk  (RPC API — grounded
 * 2026-08-18: createMarketBuyOrder/SellOrder(symbol, volume, sl, tp, opts),
 * modifyPosition, closePosition, getAccountInformation, getPositions).
 */
import type { Side } from "@/lib/still/types";
import { readBrokerEnv, type Broker, type BrokerAccount, type BrokerPosition, type MotionsBrokerEnv } from "./broker";

// Minimal shapes we rely on — kept local so we need no SDK @types at build time.
type RpcConnection = {
  connect(): Promise<void>;
  waitSynchronized(): Promise<void>;
  getAccountInformation(): Promise<{ balance: number; equity: number }>;
  getPositions(): Promise<
    Array<{
      id: string;
      type: string; // "POSITION_TYPE_BUY" | "POSITION_TYPE_SELL"
      volume: number;
      openPrice: number;
      stopLoss?: number;
      takeProfit?: number;
      profit?: number;
    }>
  >;
  createMarketBuyOrder(
    symbol: string,
    volume: number,
    stopLoss: number,
    takeProfit: number,
    opts?: Record<string, unknown>,
  ): Promise<{ orderId: string; stringCode?: string }>;
  createMarketSellOrder(
    symbol: string,
    volume: number,
    stopLoss: number,
    takeProfit: number,
    opts?: Record<string, unknown>,
  ): Promise<{ orderId: string; stringCode?: string }>;
  modifyPosition(id: string, stopLoss: number, takeProfit: number): Promise<unknown>;
  closePosition(id: string): Promise<unknown>;
};

export class LiveBroker implements Broker {
  private conn: RpcConnection | null = null;
  private readonly env: MotionsBrokerEnv;

  constructor(env: MotionsBrokerEnv = readBrokerEnv()) {
    if (!env.token || !env.accountId) {
      throw new Error("LiveBroker requires MOTIONS_METAAPI_TOKEN and MOTIONS_MT5_ACCOUNT_ID");
    }
    this.env = env;
  }

  private async connection(): Promise<RpcConnection> {
    if (this.conn) return this.conn;
    // Variable specifier: bundlers/tsc won't try to resolve the module here.
    const specifier = "metaapi.cloud-sdk";
    const sdk = (await import(/* @vite-ignore */ specifier)) as {
      default?: unknown;
      MetaApi?: unknown;
    };
    const MetaApiCtor = ((sdk.default as { default?: unknown })?.default ??
      sdk.default ??
      sdk.MetaApi) as new (token: string, opts?: Record<string, unknown>) => {
      metatraderAccountApi: {
        getAccount(id: string): Promise<{
          waitConnected(): Promise<void>;
          getRPCConnection(): RpcConnection;
        }>;
      };
    };
    const metaApi = new MetaApiCtor(this.env.token!, this.env.region ? { region: this.env.region } : {});
    const account = await metaApi.metatraderAccountApi.getAccount(this.env.accountId!);
    await account.waitConnected();
    const conn = account.getRPCConnection();
    await conn.connect();
    await conn.waitSynchronized();
    this.conn = conn;
    return conn;
  }

  async getAccount(): Promise<BrokerAccount> {
    const info = await (await this.connection()).getAccountInformation();
    return { balance: info.balance, equity: info.equity };
  }

  async positions(): Promise<BrokerPosition[]> {
    const rows = await (await this.connection()).getPositions();
    return rows.map((p) => ({
      id: p.id,
      side: (p.type === "POSITION_TYPE_SELL" ? "short" : "long") as Side,
      volume: p.volume,
      entry: p.openPrice,
      stop: p.stopLoss ?? null,
      target: p.takeProfit ?? null,
      unrealizedPnl: p.profit ?? 0,
    }));
  }

  async marketOrder(
    side: Side,
    volumeLots: number,
    stop: number,
    target: number,
    clientId: string,
  ) {
    const conn = await this.connection();
    const symbol = this.env.symbol ?? "XAUUSD";
    const opts = { comment: "motions", clientId };
    const res =
      side === "long"
        ? await conn.createMarketBuyOrder(symbol, volumeLots, stop, target, opts)
        : await conn.createMarketSellOrder(symbol, volumeLots, stop, target, opts);
    return { orderId: res.orderId, code: res.stringCode ?? "OK" };
  }

  async modify(positionId: string, stop: number, target: number): Promise<void> {
    await (await this.connection()).modifyPosition(positionId, stop, target);
  }

  async close(positionId: string): Promise<void> {
    await (await this.connection()).closePosition(positionId);
  }
}
