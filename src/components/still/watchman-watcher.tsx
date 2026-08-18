import { useEffect, useRef } from "react";
import { consecutiveLosses, goldSessionLabel, isSessionLocked } from "@/lib/still/stats";
import { getActiveSession, useStill } from "@/lib/still/store";
import { useGoldQuote } from "@/lib/still/use-gold-quote";
import { useIntel } from "@/lib/still/use-intel";
import { useT } from "@/lib/still/use-i18n";
import { watchman } from "@/lib/still/watchman";

export function WatchmanWatcher() {
  const { t } = useT();
  const { quote } = useGoldQuote(30_000);
  const intel = useIntel(quote);
  const trades = useStill((s) => s.trades);
  const sessions = useStill((s) => s.sessions);
  const settings = useStill((s) => s.settings);
  const lastKey = useStill((s) => s.lastWatchmanKey);
  const pushAlert = useStill((s) => s.pushAlert);
  const setLastWatchmanKey = useStill((s) => s.setLastWatchmanKey);
  const hydrated = useStill((s) => s.hydrated);
  const primed = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    const session = getActiveSession(sessions);
    const clock = goldSessionLabel();
    const lastClosed = [...trades]
      .filter((row) => row.status === "closed" && row.pnl !== undefined)
      .sort((a, b) => (a.closedAt ?? a.openedAt).localeCompare(b.closedAt ?? b.openedAt))
      .at(-1);
    const verdict = watchman({
      window: clock.id,
      locked: isSessionLocked(session),
      hasSession: Boolean(session && !session.endedAt),
      consecutiveLosses: consecutiveLosses(trades),
      lastTradeWasLoss: (lastClosed?.pnl ?? 0) < 0,
      hasOpenPlan: trades.some((row) => row.status === "open"),
      price: quote?.price ?? null,
      intel: intel.watchmanIntel,
    });
    const key = `${verdict.state}:${verdict.key}:${clock.id}`;
    if (!primed.current) {
      primed.current = true;
      if (!lastKey) setLastWatchmanKey(key);
      return;
    }
    if (key === lastKey) return;

    const prevWindow = lastKey.split(":")[2];
    const sit =
      settings.alertOnSit &&
      verdict.state === "stand-down" &&
      (verdict.key === "botAfterLoss" || verdict.key === "botLocked");
    const level = settings.alertOnLevel && verdict.state === "name-it";
    const london =
      settings.alertOnLondon &&
      (clock.id === "london" || clock.id === "overlap") &&
      prevWindow !== "london" &&
      prevWindow !== "overlap";

    setLastWatchmanKey(key);
    if (!sit && !level && !london) return;

    const kind = sit ? "sit" : level ? "level" : "london";
    const title = t("botName");
    const body = london && !sit && !level ? t("botWatch") : t(verdict.key, verdict.vars);
    pushAlert({ kind, title, body });

    if (settings.alertPush && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification(title, { body, tag: `still-${kind}` });
      } catch {
        /* ignore */
      }
    }
  }, [
    hydrated,
    lastKey,
    quote?.price,
    sessions,
    settings.alertOnLevel,
    settings.alertOnLondon,
    settings.alertOnSit,
    settings.alertPush,
    trades,
    pushAlert,
    setLastWatchmanKey,
    t,
  ]);

  return null;
}
