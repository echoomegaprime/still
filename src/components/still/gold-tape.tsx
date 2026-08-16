import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { goldPrice } from "@/lib/still/format";
import { consecutiveLosses, goldSessionLabel, isSessionLocked } from "@/lib/still/stats";
import { getActiveSession, useStill } from "@/lib/still/store";
import { useGoldQuote } from "@/lib/still/use-gold-quote";
import { useT } from "@/lib/still/use-i18n";
import { watchman } from "@/lib/still/watchman";
import { cn } from "@/lib/utils";

export function GoldTape() {
  const { t } = useT();
  const { quote, history, error } = useGoldQuote();
  const trades = useStill((s) => s.trades);
  const sessions = useStill((s) => s.sessions);
  const session = getActiveSession(sessions);
  const locked = isSessionLocked(session);
  const clock = goldSessionLabel();
  const lastClosed = [...trades]
    .filter((row) => row.status === "closed" && row.pnl !== undefined)
    .sort((a, b) => (a.closedAt ?? a.openedAt).localeCompare(b.closedAt ?? b.openedAt))
    .at(-1);
  const verdict = watchman({
    window: clock.id,
    locked,
    hasSession: Boolean(session && !session.endedAt),
    consecutiveLosses: consecutiveLosses(trades),
    lastTradeWasLoss: (lastClosed?.pnl ?? 0) < 0,
    hasOpenPlan: trades.some((row) => row.status === "open"),
    price: quote?.price ?? null,
  });

  const change = quote?.change;
  const up = (change ?? 0) > 0;
  const down = (change ?? 0) < 0;

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("xau")} · {quote?.source === "futures" ? t("futures") : t("spot")}
            </p>
            <p
              className={cn(
                "mt-1 font-display text-4xl tabular tracking-tight",
                up && "text-up",
                down && "text-down",
              )}
            >
              {quote ? goldPrice(quote.price) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error && !quote
                ? t("tapeFail")
                : quote?.market === "closed"
                  ? t("marketClosed")
                  : t("marketLive")}
              {change != null ? (
                <span className={cn("ml-2 tabular", up && "text-up", down && "text-down")}>
                  {up ? "+" : ""}
                  {change.toFixed(2)} ({quote?.changePct?.toFixed(2)}%)
                </span>
              ) : null}
            </p>
          </div>
          <Spark history={history} up={up} down={down} />
        </div>
      </div>

      <div className="rounded-xl bg-secondary p-4 shadow-[var(--shadow-border)] sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("botName")}
          </p>
          <Badge
            variant={
              verdict.state === "stand-down"
                ? "down"
                : verdict.state === "name-it"
                  ? "warn"
                  : verdict.state === "watch"
                    ? "paper"
                    : "default"
            }
          >
            {verdict.state === "stand-down"
              ? t("botStateDown")
              : verdict.state === "name-it"
                ? t("botStateName")
                : verdict.state === "watch"
                  ? t("botStateWatch")
                  : t("botStateWait")}
          </Badge>
        </div>
        <p className="mt-3 font-display text-2xl leading-snug">{t(verdict.key)}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("botNeverClicks")}</p>
        {verdict.state === "name-it" || verdict.state === "watch" ? (
          <Link
            to="/gate"
            className="mt-3 inline-flex h-11 items-center text-sm text-paper underline-offset-4 hover:underline"
          >
            {t("planNext")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function Spark({ history, up, down }: { history: number[]; up: boolean; down: boolean }) {
  if (history.length < 2) return null;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const span = max - min || 1;
  const w = 112;
  const h = 44;
  const d = history
    .map((p, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((p - min) / span) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = up ? "var(--color-up)" : down ? "var(--color-down)" : "var(--color-paper)";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0">
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}
