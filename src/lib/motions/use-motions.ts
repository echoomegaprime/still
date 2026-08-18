import { useEffect, useRef, useState } from "react";
import { currentEquity, goldSessionLabel } from "@/lib/still/stats";
import { masteryReport, type MasteryReport } from "@/lib/still/mastery";
import { useStill } from "@/lib/still/store";
import { useGoldQuote } from "@/lib/still/use-gold-quote";
import { useAtr } from "@/lib/still/use-atr";
import { useIntel } from "@/lib/still/use-intel";
import { DEFAULT_ENVELOPE, freshAccount, killAll, unkill } from "./engine";
import { tickPaper } from "./paper-broker";
import type { MotionsAccount, MotionsAction } from "./types";

const SEED_START = 80_000;

/**
 * Runs Motions in PAPER mode against the live gold price, gated behind mastery.
 * The browser is monitor + kill only — this never touches a real broker (that's
 * the server worker + live-broker.ts). Paper state is ephemeral per load.
 */
export function useMotions(): {
  account: MotionsAccount;
  action: MotionsAction;
  mastery: MasteryReport;
  kill: () => void;
  arm: () => void;
  reset: () => void;
} {
  const { quote } = useGoldQuote();
  const atr = useAtr();
  const intel = useIntel(quote);
  const trades = useStill((s) => s.trades);
  const settings = useStill((s) => s.settings);

  const mastery = masteryReport(trades, settings, SEED_START);
  const startEquity = Math.max(1000, Math.round(currentEquity(SEED_START, trades)));

  const [account, setAccount] = useState<MotionsAccount>(() => freshAccount(startEquity, Date.now()));
  const action = useRef<MotionsAction>({ type: "sit", reason: "boot" });

  const price = quote?.price ?? null;
  const atr14 = atr?.atr14 ?? null;
  const wm = intel.watchmanIntel;

  useEffect(() => {
    if (price == null) return;
    const now = Date.now();
    const blocked =
      wm.tiltLevel === "hot" ||
      wm.blackout !== "clear" ||
      Boolean(wm.circuitTripped) ||
      Boolean(wm.losingSession) ||
      (wm.rangeSpent != null && wm.rangeSpent >= 1);
    const reason = wm.circuitTripped
      ? "drawdown"
      : wm.blackout !== "clear"
        ? "news"
        : wm.tiltLevel === "hot"
          ? "tilt"
          : wm.losingSession
            ? "session"
            : "range";
    const nearest = Math.round(price / 50) * 50;
    const nearLevel = Math.abs(price - nearest) <= DEFAULT_ENVELOPE.levelProximity ? nearest : null;
    const drift = quote?.change ?? 0;

    setAccount((prev) => {
      const { account: next, action: act } = tickPaper(
        prev,
        {
          price,
          atr14,
          window: goldSessionLabel(new Date(now)).id,
          drift,
          nearLevel,
          intelBlocked: blocked,
          intelReason: reason,
          now,
        },
        DEFAULT_ENVELOPE,
      );
      action.current = act;
      return next;
    });
    // Tick on each new price / ATR; intel is derived from the same inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, atr14]);

  return {
    account,
    action: action.current,
    mastery,
    kill: () => setAccount((a) => killAll(a)),
    arm: () => setAccount((a) => unkill(a)),
    reset: () => setAccount(freshAccount(startEquity, Date.now())),
  };
}
