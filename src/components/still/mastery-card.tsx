import { Check, Lock, LockOpen, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { masteryReport, type Prereq } from "@/lib/still/mastery";
import { closedTrades } from "@/lib/still/stats";
import { useStill } from "@/lib/still/store";
import { useT } from "@/lib/still/use-i18n";

const SEED_START = 80_000;

export function MasteryCard() {
  const { t, locale } = useT();
  const trades = useStill((s) => s.trades);
  const settings = useStill((s) => s.settings);

  if (closedTrades(trades).length === 0) return null;

  const report = masteryReport(trades, settings, SEED_START);
  const scorePct = Math.round(report.score * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{t("masteryTitle")}</CardTitle>
          <Badge variant={report.unlocked ? "paper" : "down"}>
            {report.unlocked ? (
              <span className="inline-flex items-center gap-1">
                <LockOpen className="size-3" strokeWidth={2} />
                {t("masteryUnlocked")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3" strokeWidth={2} />
                {t("masteryLocked")}
              </span>
            )}
          </Badge>
        </div>
        <CardDescription>{t("masterySubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("masteryScore")}
            </p>
            <p className="mt-1 font-display text-4xl tabular tracking-tight">
              {scorePct}
              <span className="text-lg text-muted-foreground">/100</span>
            </p>
          </div>
          <p className="pb-1 text-sm text-muted-foreground">
            {t("masteryProgress", { pct: report.progressPct })}
          </p>
        </div>

        <Progress
          value={report.progressPct}
          barClassName={report.unlocked ? "bg-up" : "bg-paper"}
        />

        <ul className="space-y-2.5">
          {report.prerequisites.map((p) => (
            <PrereqRow key={p.key} p={p} label={t(p.key, { have: p.have, need: p.need })} />
          ))}
        </ul>

        <p className="text-xs leading-relaxed text-muted-foreground">{t("masteryFootnote")}</p>
        <span hidden>{locale}</span>
      </CardContent>
    </Card>
  );
}

function PrereqRow({ p, label }: { p: Prereq; label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span
        className={
          p.met
            ? "flex size-5 items-center justify-center rounded-full bg-up/15 text-up"
            : "flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground"
        }
      >
        {p.met ? <Check className="size-3.5" strokeWidth={2.5} /> : <Minus className="size-3.5" strokeWidth={2} />}
      </span>
      <span className={p.met ? "text-foreground/90" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}
