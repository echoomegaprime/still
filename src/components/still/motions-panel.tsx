import { CircleStop, Lock, Play, Power, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { goldPrice, money, signedMoney } from "@/lib/still/format";
import type { MessageKey } from "@/lib/still/i18n";
import { closedTrades } from "@/lib/still/stats";
import { useStill } from "@/lib/still/store";
import { useT } from "@/lib/still/use-i18n";
import { dayPnlPct, weekPnlPct } from "@/lib/motions/engine";
import type { MotionsAccount, MotionsAction } from "@/lib/motions/types";
import { useMotions } from "@/lib/motions/use-motions";

type Tone = "sit" | "act" | "down";

function readAction(action: MotionsAction): {
  statusKey: MessageKey;
  tone: Tone;
  reasonKey: MessageKey;
  vars?: Record<string, string | number>;
} {
  switch (action.type) {
    case "killed":
      return { statusKey: "motionsStatusKilled", tone: "down", reasonKey: "motionsRsnKilled" };
    case "locked": {
      const reasonKey: MessageKey =
        action.lock === "day-stop"
          ? "motionsRsnDayStop"
          : action.lock === "week-stop"
            ? "motionsRsnWeekStop"
            : "motionsRsnStreak";
      return { statusKey: "motionsStatusLocked", tone: "down", reasonKey };
    }
    case "manage":
      return { statusKey: "motionsStatusManage", tone: "act", reasonKey: "motionsRsnManage" };
    case "propose":
      return { statusKey: "motionsStatusPropose", tone: "act", reasonKey: "motionsRsnSetup" };
    case "flatten": {
      const reasonKey: MessageKey =
        action.reason === "day-stop"
          ? "motionsRsnDayStop"
          : action.reason === "week-stop"
            ? "motionsRsnWeekStop"
            : "motionsRsnManage";
      return { statusKey: "motionsStatusFlatten", tone: "down", reasonKey };
    }
    default: {
      const r = action.reason;
      const reasonKey: MessageKey =
        r === "off-window"
          ? "motionsRsnOffWindow"
          : r === "no-print"
            ? "motionsRsnNoPrint"
            : r === "no-setup" || r === "no-size"
              ? "motionsRsnNoSetup"
              : "motionsRsnWatchman";
      return { statusKey: "motionsStatusSit", tone: "sit", reasonKey, vars: { why: r } };
    }
  }
}

function Monitor({
  account,
  action,
  onKill,
  onArm,
  onReset,
}: {
  account: MotionsAccount;
  action: MotionsAction;
  onKill: () => void;
  onArm: () => void;
  onReset: () => void;
}) {
  const { t } = useT();
  const cur = "USD" as const;
  const info = readAction(action);
  const pos = account.position;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={info.tone === "down" ? "down" : info.tone === "act" ? "warn" : "paper"}>
            {t(info.statusKey)}
          </Badge>
          <Badge variant="default">{t("motionsPaper")}</Badge>
        </div>
        <p className="tabular text-sm text-muted-foreground">
          {t("motionsEquity")} {money(account.equity, cur)}
        </p>
      </div>

      <p className="text-sm leading-snug text-foreground/90">{t(info.reasonKey, info.vars)}</p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">{t("motionsDay")}</p>
          <p className={`tabular ${dayPnlPct(account) < 0 ? "text-down" : "text-up"}`}>
            {signedMoney(account.equity - account.dayAnchor, cur)}
          </p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">{t("motionsWeek")}</p>
          <p className={`tabular ${weekPnlPct(account) < 0 ? "text-down" : "text-up"}`}>
            {signedMoney(account.equity - account.weekAnchor, cur)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        {pos ? (
          <div className="space-y-1">
            <p className="text-sm tabular">
              {t("motionsPositionLine", {
                side: pos.side,
                lots: pos.lots.toFixed(2),
                entry: goldPrice(pos.entry),
              })}
            </p>
            <p className="text-xs text-muted-foreground tabular">
              {t("motionsStopTarget", { stop: goldPrice(pos.stop), target: goldPrice(pos.target) })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("motionsFlat")}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {account.killed ? (
          <Button size="sm" onClick={onArm}>
            <Power className="size-3.5" />
            {t("motionsArm")}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onKill}
            className="border-down/40 text-down hover:bg-down/10"
          >
            <CircleStop className="size-3.5" />
            {t("motionsKill")}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onReset}>
          <RotateCcw className="size-3.5" />
          {t("motionsReset")}
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{t("motionsEnvelope")}</p>
    </div>
  );
}

export function MotionsPanel() {
  const { t, locale } = useT();
  const { account, action, mastery, kill, arm, reset } = useMotions();
  const trades = useStill((s) => s.trades);
  const [showPaper, setShowPaper] = useState(false);

  if (closedTrades(trades).length === 0) return null;

  const unlocked = mastery.unlocked;
  const showMonitor = unlocked || showPaper;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{t("motionsTitle")}</CardTitle>
          <Badge variant={unlocked ? "paper" : "down"}>
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" strokeWidth={2} />
              {unlocked ? t("masteryUnlocked") : t("masteryLocked")}
            </span>
          </Badge>
        </div>
        <CardDescription>{t("motionsTagline")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!unlocked ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{t("motionsLockedNote")}</p>
        ) : null}

        {showMonitor ? (
          <Monitor account={account} action={action} onKill={kill} onArm={arm} onReset={reset} />
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowPaper(true)}>
            <Play className="size-3.5" />
            {t("motionsWatchPaper")}
          </Button>
        )}

        {!unlocked && showPaper ? (
          <Button size="sm" variant="ghost" onClick={() => setShowPaper(false)}>
            {t("motionsHide")}
          </Button>
        ) : null}
        <span hidden>{locale}</span>
      </CardContent>
    </Card>
  );
}
