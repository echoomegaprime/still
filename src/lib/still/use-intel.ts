import { useEffect, useMemo, useRef } from "react";
import type { MessageKey } from "./i18n";
import {
  detectSweep,
  drawdownReport,
  losingSession,
  rangeBudget,
  sessionExpectancy,
  stopInsideNoise,
  tiltReport,
  tiltVsCalmPnl,
  volRegime,
  type AtrSnapshot,
  type BucketExpectancy,
  type DrawdownReport,
  type TiltReport,
  type Tick,
  type TiltDriver,
} from "./intel";
import { blackoutReport, type BlackoutReport } from "./econ-calendar";
import type { GoldQuote } from "./quote";
import { closedTrades, goldSessionLabel, sessionTrades } from "./stats";
import { getActiveSession, useStill } from "./store";
import { useAtr } from "./use-atr";
import { useT } from "./use-i18n";
import type { WatchmanIntel } from "./watchman";

const REASON_KEY: Record<TiltDriver, MessageKey> = {
  streak: "tiltStreak",
  size: "tiltSize",
  "revenge-window": "tiltRevenge",
  overtrading: "tiltOvertrading",
};

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export type IntelReport = {
  tilt: TiltReport;
  tiltReason: string;
  tiltProof: ReturnType<typeof tiltVsCalmPnl>;
  drawdown: DrawdownReport;
  expectancy: BucketExpectancy[];
  losing: BucketExpectancy | null;
  vol: ReturnType<typeof volRegime>;
  atr: AtrSnapshot | null;
  rangeSpent: number | null;
  sweep: { swept: boolean; level: number | null };
  blackout: BlackoutReport;
  watchmanIntel: WatchmanIntel;
};

/**
 * The Watchman's intelligence, assembled from the trader's own history + the
 * live quote stream + a daily ATR. Every field is advisory and tighten-only.
 * Feed `watchmanIntel` into watchman(); render the rest in the intel panel.
 */
export function useIntel(quote: GoldQuote | null): IntelReport {
  const { t } = useT();
  const trades = useStill((s) => s.trades);
  const sessions = useStill((s) => s.sessions);
  const settings = useStill((s) => s.settings);
  const atr = useAtr();

  // Ring buffer of timestamped ticks (sweep detection) + per-session hi/lo.
  const ticks = useRef<Tick[]>([]);
  const sessionHiLo = useRef<{ id: string | null; hi: number; lo: number }>({
    id: null,
    hi: 0,
    lo: 0,
  });

  const session = getActiveSession(sessions);
  const price = quote?.price ?? null;

  useEffect(() => {
    if (price == null || !Number.isFinite(price)) return;
    const now = Date.now();
    ticks.current = [...ticks.current, { price, t: now }].filter((k) => now - k.t <= 20 * 60_000);
    const sid = session?.id ?? null;
    const s = sessionHiLo.current;
    if (s.id !== sid) {
      sessionHiLo.current = { id: sid, hi: price, lo: price };
    } else {
      s.hi = Math.max(s.hi, price);
      s.lo = Math.min(s.lo, price);
    }
  }, [price, session?.id]);

  return useMemo<IntelReport>(() => {
    const startEquity = 80_000;
    // session-median trades (only sessions that actually traded)
    const perSession = sessions
      .map((s) => sessionTrades(trades, s.id).filter((row) => row.status === "closed").length)
      .filter((n) => n > 0);
    const sessMedian = median(perSession);
    const sessTradeCount = session
      ? sessionTrades(trades, session.id).filter((row) => row.status !== "planned").length
      : 0;

    const tilt = tiltReport(trades, {
      sessionTradeCount: sessTradeCount,
      sessionMedian: sessMedian,
    });
    const tiltReason = tilt.top ? t(REASON_KEY[tilt.top]) : "";
    const tiltProof = tiltVsCalmPnl(trades);

    const drawdown = drawdownReport(startEquity, trades);
    const expectancy = sessionExpectancy(trades, goldSessionLabel);
    const clock = goldSessionLabel();
    const losing = losingSession(trades, clock.id, goldSessionLabel);

    const vol = volRegime(atr, 3);
    const rangeSpent =
      atr && sessionHiLo.current.id
        ? rangeBudget(sessionHiLo.current.hi, sessionHiLo.current.lo, atr.atr14)
        : null;
    const sweep = detectSweep(ticks.current);
    const blackout = blackoutReport();

    const watchmanIntel: WatchmanIntel = {
      tiltLevel: tilt.level,
      tiltReason,
      circuitTripped: drawdown.circuitTripped,
      blackout: blackout.state,
      newsLabel: blackout.event?.label,
      newsMinutes: blackout.minutesTo ?? undefined,
      losingSession: Boolean(losing),
      losingSessionAvg: losing?.expectancy,
      sweepLevel: sweep.level,
      rangeSpent,
    };

    return {
      tilt,
      tiltReason,
      tiltProof,
      drawdown,
      expectancy,
      losing,
      vol,
      atr,
      rangeSpent,
      sweep,
      blackout,
      watchmanIntel,
    };
    // ticks/hiLo are refs (mutated in the effect); price drives recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, sessions, session?.id, settings.maxRiskPct, atr, price, t]);
}

/** Convenience: closed-trade count, so callers can gate the panel on "has history". */
export function hasHistory(trades: Parameters<typeof closedTrades>[0]): boolean {
  return closedTrades(trades).length > 0;
}
