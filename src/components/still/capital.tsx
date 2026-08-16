import { useEffect, useState } from "react";
import { AlertSettings } from "@/components/still/alert-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money, pct } from "@/lib/still/format";
import { habitSizeWarning, lotsFromRisk, riskPct } from "@/lib/still/gold";
import { useStill } from "@/lib/still/store";
import { useT } from "@/lib/still/use-i18n";

export function CapitalView() {
  const { t } = useT();
  const settings = useStill((s) => s.settings);
  const updateSettings = useStill((s) => s.updateSettings);
  const resetSample = useStill((s) => s.resetSample);
  const wipeToBlank = useStill((s) => s.wipeToBlank);
  const markAlertsRead = useStill((s) => s.markAlertsRead);
  const [habit, setHabit] = useState("3500");

  useEffect(() => {
    markAlertsRead();
  }, [markAlertsRead]);

  const risk = (settings.trueCapital * settings.maxRiskPct) / 100;
  const habitN = Number(habit) || 0;
  const habitPct = riskPct(habitN, settings.trueCapital);
  const warn = habitSizeWarning(habitN, settings.trueCapital, settings.maxRiskPct);
  const hidden = settings.trueCapital - settings.friendsStory;
  const lotsAtOneR = lotsFromRisk(risk, 8);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("theBook")}
        </p>
        <h1 className="font-display text-4xl">{t("capitalHero")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("capitalBody", {
            story: money(settings.friendsStory, settings.currency),
            true: money(settings.trueCapital, settings.currency),
          })}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("trueCapital")}</CardTitle>
          <CardDescription>{t("trueCapitalDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("whatWeCall")}</Label>
            <Input
              id="name"
              value={settings.displayName}
              onChange={(e) => updateSettings({ displayName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="true">{t("trueBook")}</Label>
              <Input
                id="true"
                inputMode="decimal"
                value={String(settings.trueCapital)}
                onChange={(e) => updateSettings({ trueCapital: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="story">{t("whatFriendsThink")}</Label>
              <Input
                id="story"
                inputMode="decimal"
                value={String(settings.friendsStory)}
                onChange={(e) => updateSettings({ friendsStory: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(["USD", "NPR"] as const).map((c) => (
              <Button
                key={c}
                size="sm"
                variant={settings.currency === c ? "default" : "outline"}
                onClick={() => updateSettings({ currency: c })}
              >
                {c}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("gapLine", { gap: money(hidden, settings.currency) })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("habitTitle")}</CardTitle>
          <CardDescription>{t("habitDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="habit">{t("habitLoad")}</Label>
            <Input
              id="habit"
              inputMode="decimal"
              value={habit}
              onChange={(e) => setHabit(e.target.value)}
            />
          </div>
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p>
              {t("habitMath", {
                amount: money(habitN, settings.currency),
                pct: pct(habitPct),
              }).split(pct(habitPct)).map((part, i, arr) =>
                i < arr.length - 1 ? (
                  <span key={part}>
                    {part}
                    <span className={warn === "habit" ? "text-down" : "text-warn"}>{pct(habitPct)}</span>
                  </span>
                ) : (
                  <span key={part}>{part}</span>
                ),
              )}
            </p>
            <p className="mt-2 text-muted-foreground">
              {t("habitAllowed", {
                risk: money(risk, settings.currency),
                pct: settings.maxRiskPct,
                lots: lotsAtOneR.toFixed(2),
              })}
            </p>
            <p className="mt-2">{t("habitTwo")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sessionLimits")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Num
            label={t("riskPct")}
            value={settings.maxRiskPct}
            onChange={(n) => updateSettings({ maxRiskPct: n })}
          />
          <Num
            label={t("dailyLossPct")}
            value={settings.defaultMaxLossPct}
            onChange={(n) => updateSettings({ defaultMaxLossPct: n })}
          />
          <Num
            label={t("maxTrades")}
            value={settings.defaultMaxTrades}
            onChange={(n) => updateSettings({ defaultMaxTrades: n })}
          />
          <Num
            label={t("lossesThenStop")}
            value={settings.defaultMaxConsecutiveLosses}
            onChange={(n) => updateSettings({ defaultMaxConsecutiveLosses: n })}
          />
          <Num
            label={t("cooldownMin")}
            value={settings.defaultCooldownMinutes}
            onChange={(n) => updateSettings({ defaultCooldownMinutes: n })}
          />
        </CardContent>
      </Card>

      <AlertSettings />

      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={() => resetSample()}>
          {t("reloadSample")}
        </Button>
        <Button variant="ghost" onClick={() => wipeToBlank()}>
          {t("wipeBook")}
        </Button>
      </div>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        inputMode="decimal"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}
