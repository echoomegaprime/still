import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Lock, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { money, remainingLabel, signedMoney } from "@/lib/still/format";
import { lockWord, type MessageKey, t as translate } from "@/lib/still/i18n";
import {
  currentEquity,
  equitySeries,
  goldSessionLabel,
  isFollowed,
  isSessionLocked,
  sessionPnl,
  sessionTrades,
  type SessionWindow,
  verdict,
} from "@/lib/still/stats";
import { getActiveSession, useStill } from "@/lib/still/store";
import { displayPattern, useT } from "@/lib/still/use-i18n";
import { GoldTape } from "@/components/still/gold-tape";
import { IntelPanel } from "@/components/still/intel-panel";
import { MasteryCard } from "@/components/still/mastery-card";
import { MotionsPanel } from "@/components/still/motions-panel";

const SESSION_COPY: Record<SessionWindow, { name: MessageKey; hint: MessageKey }> = {
  weekend: { name: "sessWeekend", hint: "sessWeekendHint" },
  overlap: { name: "sessOverlap", hint: "sessOverlapHint" },
  london: { name: "sessLondon", hint: "sessLondonHint" },
  ny: { name: "sessNy", hint: "sessNyHint" },
  asia: { name: "sessAsia", hint: "sessAsiaHint" },
  off: { name: "sessOff", hint: "sessOffHint" },
};

export function DeskHome() {
  const { t, locale } = useT();
  const settings = useStill((s) => s.settings);
  const trades = useStill((s) => s.trades);
  const sessions = useStill((s) => s.sessions);
  const patterns = useStill((s) => s.patterns);
  const session = getActiveSession(sessions);
  const locked = isSessionLocked(session);
  const v = verdict(trades);
  const seedStart = 80_000;
  const equity = currentEquity(seedStart, trades);
  const series = equitySeries(seedStart, trades);
  const clock = goldSessionLabel();
  const sessionRows = session ? sessionTrades(trades, session.id) : [];
  const sPnl = session ? sessionPnl(trades, session) : 0;
  const usedLoss = session ? Math.min(100, (Math.max(0, -sPnl) / session.maxLossUsd) * 100) : 0;
  const usedTrades = session
    ? (sessionRows.filter((t) => t.status === "closed").length / session.maxTrades) * 100
    : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {t(SESSION_COPY[clock.id].name)} · {clock.nepal}
        </p>
        <h1 className="max-w-xl font-display text-4xl font-medium tracking-tight md:text-5xl">
          {t("hero")}
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
          {t(SESSION_COPY[clock.id].hint)} {t("heroBody")}
        </p>
      </header>

      {locked && session ? <LockPanel sessionId={session.id} /> : null}

      <GoldTape />

      <IntelPanel />

      <MasteryCard />

      <MotionsPanel />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={t("trueBook")}
          value={money(settings.trueCapital, settings.currency)}
          hint={t("friendsThink", { amount: money(settings.friendsStory, settings.currency) })}
        />
        <Stat
          label={t("risk1")}
          value={money((settings.trueCapital * settings.maxRiskPct) / 100, settings.currency)}
          hint={t("habitHint")}
        />
        <Stat
          label={t("sampleEquity")}
          value={money(equity, settings.currency)}
          hint={t("from80k")}
          tone={equity >= seedStart ? "up" : "down"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("verdict")}</CardTitle>
          <CardDescription>{t("verdictDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <VerdictCell
              label={t("rulesFollowed")}
              countLabel={t("nTrades", { n: v.followed.length })}
              pnl={v.followedPnl}
              currency={settings.currency}
              note={t("includesPlanned")}
            />
            <VerdictCell
              label={t("rulesBroken")}
              countLabel={t("nTrades", { n: v.broken.length })}
              pnl={v.brokenPnl}
              currency={settings.currency}
              note={t("thisIsBlank")}
            />
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            {t("plannedLosses", {
              n: v.plannedLosses.length,
              revenge: v.revenge.length,
              pnl: signedMoney(v.revengePnl, settings.currency),
            })}
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-paper)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-paper)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis hide domain={["dataMin - 800", "dataMax + 800"]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(value) => {
                    const n = typeof value === "number" ? value : Number(value);
                    return [money(Number.isFinite(n) ? n : 0, settings.currency), t("equity")];
                  }}
                  labelFormatter={() => t("book")}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="var(--color-paper)"
                  fill="url(#eq)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {session && !session.endedAt ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{t("openSession")}</CardTitle>
              {locked ? (
                <Badge variant="down">{t("locked")}</Badge>
              ) : (
                <Badge variant="paper">{t("live")}</Badge>
              )}
            </div>
            <CardDescription>
              {t("sessionLimitsLine", {
                loss: money(session.maxLossUsd, settings.currency),
                trades: session.maxTrades,
                losses: session.maxConsecutiveLosses,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>{t("lossBudget")}</span>
                <span className="tabular">{signedMoney(sPnl, settings.currency)}</span>
              </div>
              <Progress
                value={usedLoss}
                barClassName={usedLoss > 70 ? "bg-down" : "bg-paper"}
              />
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>{t("tradesUsed")}</span>
                <span className="tabular">
                  {sessionRows.filter((row) => row.status === "closed").length}/{session.maxTrades}
                </span>
              </div>
              <Progress value={usedTrades} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1">
          <Link to="/gate">
            {locked ? t("openTheLock") : session ? t("planNext") : t("openASession")}
            <ArrowUpRight />
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/journal">{t("readTheWeek")}</Link>
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">{t("recentGold")}</h2>
        <ul className="divide-y divide-border rounded-xl bg-card shadow-[var(--shadow-border)]">
          {trades
            .slice()
            .reverse()
            .slice(0, 5)
            .map((trade) => {
              const pattern = patterns.find((p) => p.id === trade.patternId);
              const shown = pattern ? displayPattern(pattern, locale) : null;
              const ok = isFollowed(trade);
              return (
                <li key={trade.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {translate(locale, trade.side === "long" ? "long" : "short")}{" "}
                      {shown?.name ?? t("unnamed")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ok ? t("rulesHeld") : t("rulesBroken")}
                      {trade.brokeRuleAfterLoss ? ` · ${t("afterALoss")}` : ""}
                    </p>
                  </div>
                  <span
                    className={`tabular text-sm ${
                      (trade.pnl ?? 0) >= 0 ? "text-up" : "text-down"
                    }`}
                  >
                    {trade.pnl === undefined
                      ? t("open")
                      : signedMoney(trade.pnl, settings.currency)}
                  </span>
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p
        className={`mt-2 font-display text-2xl tabular tracking-tight ${
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function VerdictCell({
  label,
  countLabel,
  pnl,
  currency,
  note,
}: {
  label: string;
  countLabel: string;
  pnl: number;
  currency: "USD" | "NPR";
  note: string;
}) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl tabular">{countLabel}</p>
      <p className={`mt-1 text-sm tabular ${pnl >= 0 ? "text-up" : "text-down"}`}>
        {signedMoney(pnl, currency)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function LockPanel({ sessionId }: { sessionId: string }) {
  const { t, locale } = useT();
  const session = useStill((s) => s.sessions.find((x) => x.id === sessionId));
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!session?.lockReason) return null;
  const left = session.lockedUntil ? remainingLabel(session.lockedUntil) : "held";

  return (
    <div className="rounded-xl bg-secondary p-5 shadow-[var(--shadow-border)]">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 size-4 text-down" strokeWidth={1.75} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-down">{t("deskLocked")}</p>
          <p className="font-display text-2xl leading-snug">
            {lockWord(locale, session.lockReason)}
          </p>
          <p className="text-sm text-muted-foreground">
            {left === "ready" ? t("cooldownReady") : t("cooldownLeft", { left })} {t("writeReview")}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm">
              <Link to="/gate">
                <TimerReset className="size-3.5" />
                {t("doTheReview")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
