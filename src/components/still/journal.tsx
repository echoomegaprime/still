import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatClock, goldPrice, lotsLabel, money, signedMoney } from "@/lib/still/format";
import { isFollowed, verdict } from "@/lib/still/stats";
import { useStill } from "@/lib/still/store";
import { displayPattern, useT } from "@/lib/still/use-i18n";
import { cn } from "@/lib/utils";

type Filter = "all" | "held" | "broken";

export function JournalView() {
  const { t, locale } = useT();
  const trades = useStill((s) => s.trades);
  const patterns = useStill((s) => s.patterns);
  const settings = useStill((s) => s.settings);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const v = verdict(trades);

  const rows = useMemo(() => {
    return [...trades].reverse().filter((item) => {
      if (filter === "held") return isFollowed(item);
      if (filter === "broken") return !isFollowed(item);
      return true;
    });
  }, [trades, filter]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("journal")}
        </p>
        <h1 className="font-display text-4xl">{t("journalHero")}</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          {t("journalBody", {
            closed: v.closed.length,
            held: v.followed.length,
            broken: v.broken.length,
          })}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "filterAll"],
            ["held", "filterHeld"],
            ["broken", "filterBroken"],
          ] as const
        ).map(([id, key]) => (
          <Button
            key={id}
            size="sm"
            variant={filter === id ? "default" : "outline"}
            onClick={() => setFilter(id)}
          >
            {t(key)}
          </Button>
        ))}
      </div>

      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="rounded-xl bg-card px-4 py-10 text-center text-sm text-muted-foreground shadow-[var(--shadow-border)]">
            {t("journalEmpty")}
          </li>
        ) : null}
        {rows.map((trade) => {
          const pattern = patterns.find((p) => p.id === trade.patternId);
          const shown = pattern ? displayPattern(pattern, locale) : null;
          const ok = isFollowed(trade);
          const open = openId === trade.id;
          return (
            <li key={trade.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : trade.id)}
                className="w-full rounded-xl bg-card px-4 py-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm">
                        {t(trade.side === "long" ? "long" : "short")} {shown?.name ?? t("unnamed")}
                      </p>
                      <Badge variant={ok ? "paper" : "down"}>{ok ? t("held") : t("broken")}</Badge>
                      {trade.brokeRuleAfterLoss ? (
                        <Badge variant="warn">{t("afterLossBadge")}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatClock(trade.openedAt)} · {lotsLabel(trade.lots)} · {t(trade.emotion)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "tabular text-sm",
                      (trade.pnl ?? 0) >= 0 ? "text-up" : "text-down",
                    )}
                  >
                    {trade.status !== "closed"
                      ? t("open")
                      : signedMoney(trade.pnl ?? 0, settings.currency)}
                  </span>
                </div>
                {open ? (
                  <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
                    <p className="text-muted-foreground">{trade.thesis}</p>
                    <p>
                      {goldPrice(trade.entry)} → {trade.exit ? goldPrice(trade.exit) : "—"} ·{" "}
                      {t("stop")} {goldPrice(trade.stop)} · {t("risk")}{" "}
                      {money(trade.riskUsd, settings.currency)}
                    </p>
                    {trade.notes ? <p>{trade.notes}</p> : null}
                  </div>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
