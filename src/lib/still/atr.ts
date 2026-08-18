/**
 * Daily gold ATR — the volatility yardstick behind the risk ceiling.
 *
 * Source is the SAME free feed the live quote already uses (Yahoo `GC=F` daily
 * chart), so no new provider, no key. Wilder ATR(14) plus a longer ATR baseline
 * so intel.ts can tell a normal regime from an expansion. Server-only + cached.
 */
import type { AtrSnapshot } from "./intel";

const YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=6mo";
const UA = "StillGoldDesk/1.0";

type Bar = { high: number; low: number; close: number };

function trueRanges(bars: Bar[]): number[] {
  const tr: number[] = [];
  for (let i = 1; i < bars.length; i += 1) {
    const h = bars[i]!.high,
      l = bars[i]!.low,
      pc = bars[i - 1]!.close;
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  return tr;
}

/** Wilder-smoothed ATR over `period` using the true-range series. */
function wilderAtr(tr: number[], period: number): number {
  if (tr.length < period) return 0;
  let atr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < tr.length; i += 1) {
    atr = (atr * (period - 1) + tr[i]!) / period;
  }
  return atr;
}

export async function fetchAtr(): Promise<AtrSnapshot | null> {
  try {
    const res = await fetch(YAHOO, {
      headers: { Accept: "application/json", "User-Agent": UA },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      chart?: {
        result?: Array<{
          indicators?: { quote?: Array<{ high?: number[]; low?: number[]; close?: number[] }> };
        }>;
      };
    };
    const q = data.chart?.result?.[0]?.indicators?.quote?.[0];
    if (!q?.high || !q.low || !q.close) return null;
    const bars: Bar[] = [];
    for (let i = 0; i < q.close.length; i += 1) {
      const high = q.high[i],
        low = q.low[i],
        close = q.close[i];
      if (Number.isFinite(high) && Number.isFinite(low) && Number.isFinite(close)) {
        bars.push({ high: high!, low: low!, close: close! });
      }
    }
    if (bars.length < 20) return null;
    const tr = trueRanges(bars);
    const atr14 = wilderAtr(tr, 14);
    // Longer baseline: simple mean TR over up to the last 100 sessions.
    const refWindow = tr.slice(-100);
    const atrRef = refWindow.reduce((a, b) => a + b, 0) / refWindow.length;
    if (atr14 <= 0 || atrRef <= 0) return null;
    return {
      atr14: Number(atr14.toFixed(2)),
      atrRef: Number(atrRef.toFixed(2)),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
