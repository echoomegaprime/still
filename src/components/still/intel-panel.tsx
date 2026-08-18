import { Activity, CalendarClock, Gauge, TrendingDown, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signedMoney } from "@/lib/still/format";
import type { MessageKey } from "@/lib/still/i18n";
import type { SessionWindow } from "@/lib/still/stats";
import { useStill } from "@/lib/still/store";
import { closedTrades } from "@/lib/still/stats";
import { useGoldQuote } from "@/lib/still/use-gold-quote";
import { useIntel } from "@/lib/still/use-intel";
import { useT } from "@/lib/still/use-i18n";

const SESSION_NAME: Record<SessionWindow, MessageKey> = {
  weekend: "sessWeekend",
  overlap: "sessOverlap",
  london: "sessLondon",
  ny: "sessNy",
  asia: "sessAsia",
  off: "sessOff",
};

type Tone = "calm" | "warn" | "down";

function Row({
  icon,
  label,
  chip,
  chipTone,
  read,
}: {
  icon: React.ReactNode;
  label: string;
  chip: string;
  chipTone: Tone;
  read: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <Badge variant={chipTone === "down" ? "down" : chipTone === "warn" ? "warn" : "paper"}>
            {chip}
          </Badge>
        </div>
        <p className="mt-1 text-sm leading-snug text-foreground/90">{read}</p>
      </div>
    </div>
  );
}

export function IntelPanel() {
  const { t, locale } = useT();
  const { quote } = useGoldQuote();
  const intel = useIntel(quote);
  const settings = useStill((s) => s.settings);
  const trades = useStill((s) => s.trades);

  // Nothing to read from an empty book — the desk stays quiet until there's history.
  if (closedTrades(trades).length === 0) return null;

  const cur = settings.currency;
  const { tilt, tiltProof, blackout, vol, drawdown, expectancy, rangeSpent, sweep } = intel;

  // Tilt
  const tiltTone: Tone = tilt.level === "hot" ? "down" : tilt.level === "warm" ? "warn" : "calm";
  const tiltChip =
    tilt.level === "hot" ? t("intelTiltHot") : tilt.level === "warm" ? t("intelTiltWarm") : t("intelTiltCalm");
  const tiltRead =
    tilt.level === "calm"
      ? t("intelTiltProof", { tilt: signedMoney(tiltProof.tiltPnl, cur), calm: signedMoney(tiltProof.calmPnl, cur) })
      : intel.tiltReason || t("intelTiltProof", { tilt: signedMoney(tiltProof.tiltPnl, cur), calm: signedMoney(tiltProof.calmPnl, cur) });

  // News
  const newsTone: Tone = blackout.state === "blackout" ? "down" : blackout.state === "approach" ? "warn" : "calm";
  const newsRead =
    blackout.state === "blackout"
      ? t("intelNewsBlackout", { event: blackout.event?.label ?? "News", min: Math.max(0, blackout.minutesTo ?? 0) })
      : blackout.state === "approach"
        ? t("intelNewsApproach", { event: blackout.event?.label ?? "News", min: Math.max(0, blackout.minutesTo ?? 0) })
        : t("intelNewsClear");

  // Drawdown
  const ddTone: Tone = drawdown.circuitTripped ? "down" : drawdown.riskScale < 1 ? "warn" : "calm";
  const ddRead = drawdown.circuitTripped
    ? t("intelDrawdownStop", { dd: drawdown.drawdownPct })
    : drawdown.riskScale < 1
      ? t("intelDrawdownCut", { dd: drawdown.drawdownPct, scale: (2 * drawdown.riskScale).toFixed(1) })
      : t("intelDrawdownFlat");

  // Expectancy — surface the current confident-losing bucket, else the worst confident one.
  const worst = expectancy.find((b) => b.confident);
  const expRead = worst
    ? `${t(SESSION_NAME[worst.bucket])}: ${signedMoney(worst.expectancy, cur)} · ${worst.n}`
    : t("intelExpNone");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("intelTitle")}</CardTitle>
        <CardDescription>{t("intelSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border py-0">
        <Row
          icon={<Activity className="size-4" strokeWidth={1.75} />}
          label={t("intelTilt")}
          chip={tiltChip}
          chipTone={tiltTone}
          read={tiltRead}
        />
        <Row
          icon={<CalendarClock className="size-4" strokeWidth={1.75} />}
          label={t("intelNews")}
          chip={blackout.state === "clear" ? "—" : blackout.event?.label ?? "News"}
          chipTone={newsTone}
          read={newsRead}
        />
        {vol ? (
          <Row
            icon={<Gauge className="size-4" strokeWidth={1.75} />}
            label={t("intelVol")}
            chip={vol.expansion ? t("intelVolExpansion") : t("intelVolCalm")}
            chipTone={vol.expansion ? "warn" : "calm"}
            read={t("intelVolCeiling", { pct: vol.habitPct })}
          />
        ) : null}
        <Row
          icon={<TrendingDown className="size-4" strokeWidth={1.75} />}
          label={t("intelDrawdown")}
          chip={`${drawdown.drawdownPct.toFixed(1)}%`}
          chipTone={ddTone}
          read={ddRead}
        />
        {rangeSpent != null ? (
          <Row
            icon={<Gauge className="size-4" strokeWidth={1.75} />}
            label={t("intelRange")}
            chip={`${rangeSpent}× ATR`}
            chipTone={rangeSpent >= 1 ? "warn" : "calm"}
            read={rangeSpent >= 1 ? t("intelRangeSpent", { spent: rangeSpent }) : t("intelRangeRoom", { spent: rangeSpent })}
          />
        ) : null}
        <Row
          icon={<Activity className="size-4" strokeWidth={1.75} />}
          label={t("intelExpectancy")}
          chip={worst ? `${worst.n}` : "—"}
          chipTone={worst && worst.expectancy < 0 ? "warn" : "calm"}
          read={expRead}
        />
        {sweep.level != null ? (
          <Row
            icon={<Waves className="size-4" strokeWidth={1.75} />}
            label={t("intelSweep")}
            chip={String(sweep.level)}
            chipTone="warn"
            read={t("intelSweepHit", { level: sweep.level })}
          />
        ) : null}
        {/* locale participates so the memo re-renders on language switch */}
        <span hidden>{locale}</span>
      </CardContent>
    </Card>
  );
}
