import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { goldPrice, lotsLabel, money, pct, remainingLabel, signedMoney } from "@/lib/still/format";
import { type MessageKey } from "@/lib/still/i18n";
import { habitSizeWarning, lotsFromRisk, pnlFromMove, riskPct, stopDistance } from "@/lib/still/gold";
import { isSessionLocked, sessionPnl, sessionTrades } from "@/lib/still/stats";
import { PLAN_ERROR_KEY, getActiveSession, useStill } from "@/lib/still/store";
import type { Emotion, Side } from "@/lib/still/types";
import { displayPattern, displayRule, useT } from "@/lib/still/use-i18n";
import { useGoldQuote } from "@/lib/still/use-gold-quote";
import { cn } from "@/lib/utils";

const EMOTIONS: { id: Emotion; key: MessageKey; ok: boolean }[] = [
  { id: "calm", key: "calm", ok: true },
  { id: "fear", key: "fear", ok: false },
  { id: "revenge", key: "revenge", ok: false },
  { id: "fomo", key: "fomo", ok: false },
];

export function GateView() {
  const sessions = useStill((s) => s.sessions);
  const trades = useStill((s) => s.trades);
  const session = getActiveSession(sessions);
  const locked = isSessionLocked(session);
  const openTrade = trades.find((t) => t.status === "open");

  if (locked && session) return <ReviewLock />;
  if (openTrade) return <CloseTrade tradeId={openTrade.id} />;
  if (!session) return <OpenSessionCard />;
  return <PlanTrade />;
}

function OpenSessionCard() {
  const { t } = useT();
  const settings = useStill((s) => s.settings);
  const openSession = useStill((s) => s.openSession);
  const maxLoss = Math.round((settings.trueCapital * settings.defaultMaxLossPct) / 100);
  const risk = Math.round((settings.trueCapital * settings.maxRiskPct) / 100);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("sessionGate")}
        </p>
        <h1 className="font-display text-4xl">{t("openTheDesk")}</h1>
        <p className="text-sm text-muted-foreground">{t("openDeskBody")}</p>
      </header>
      <Card>
        <CardContent className="space-y-4 pt-5">
          <Row label={t("trueBook")} value={money(settings.trueCapital, settings.currency)} />
          <Row label={t("perTradeRisk")} value={money(risk, settings.currency)} />
          <Row label={t("dailyLossCap")} value={money(maxLoss, settings.currency)} />
          <Row label={t("maxTrades")} value={String(settings.defaultMaxTrades)} />
          <Row
            label={t("stopAfter")}
            value={t("nLosses", { n: settings.defaultMaxConsecutiveLosses })}
          />
          <Row
            label={t("lossCooldown")}
            value={t("nMinutes", { n: settings.defaultCooldownMinutes })}
          />
          <Button className="w-full" onClick={() => openSession()}>
            {t("acceptLimits")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}

function PlanTrade() {
  const { t, locale } = useT();
  const settings = useStill((s) => s.settings);
  const rules = useStill((s) => s.rules);
  const patterns = useStill((s) => s.patterns);
  const planTrade = useStill((s) => s.planTrade);
  const lockDesk = useStill((s) => s.lockDesk);
  const endSession = useStill((s) => s.endSession);

  const [side, setSide] = useState<Side>("long");
  const [patternId, setPatternId] = useState(patterns[0]?.id ?? "");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");
  const [emotion, setEmotion] = useState<Emotion>("calm");
  const [thesis, setThesis] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { quote } = useGoldQuote();

  const capRisk = (settings.trueCapital * settings.maxRiskPct) / 100;
  const entryN = Number(entry) || 0;
  const stopN = Number(stop) || 0;
  const dist = stopDistance(entryN, stopN);
  const lots = lotsFromRisk(capRisk, dist);
  const habit = habitSizeWarning(capRisk, settings.trueCapital, settings.maxRiskPct);
  const pattern = patterns.find((p) => p.id === patternId);
  const shownPattern = pattern ? displayPattern(pattern, locale) : null;
  const allChecked = rules.filter((r) => r.required).every((r) => checks[r.id]);

  const rMultiple = useMemo(() => {
    const tgt = Number(target) || 0;
    if (dist <= 0 || tgt <= 0) return 0;
    return Math.abs(tgt - entryN) / dist;
  }, [dist, entryN, target]);

  function submit() {
    const result = planTrade({
      side,
      patternId,
      entry: entryN,
      stop: stopN,
      target: Number(target) || undefined,
      riskUsd: capRisk,
      sizeUsd: capRisk,
      emotion,
      thesis,
      followedRules: checks,
    });
    if ("error" in result) {
      const key = PLAN_ERROR_KEY[result.error];
      setError(
        result.error === "risk-too-big"
          ? t(key, { pct: settings.maxRiskPct })
          : t(key),
      );
      return;
    }
    setError(null);
    toast.success(t("plannedToast"));
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("pretradeLock")}
        </p>
        <h1 className="font-display text-4xl">{t("nameIt")}</h1>
        <p className="text-sm text-muted-foreground">{t("nameItBody")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("state")}</CardTitle>
          <CardDescription>{t("stateDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {EMOTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setEmotion(item.id)}
              className={cn(
                "h-11 rounded-lg text-sm transition-colors duration-150",
                emotion === item.id
                  ? item.ok
                    ? "bg-primary text-primary-foreground"
                    : "bg-down text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {t(item.key)}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("pattern")}</CardTitle>
          <CardDescription>{t("patternDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {(["long", "short"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={cn(
                  "h-11 flex-1 rounded-lg text-sm",
                  side === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {t(s)}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            {patterns.map((p) => {
              const shown = displayPattern(p, locale);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPatternId(p.id)}
                  className={cn(
                    "rounded-lg px-3 py-3 text-left transition-colors duration-150",
                    patternId === p.id ? "bg-secondary" : "bg-muted/60 hover:bg-muted",
                  )}
                >
                  <p className="text-sm">{shown.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{shown.summary}</p>
                </button>
              );
            })}
          </div>
          {shownPattern ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("invalidWhen")}: {shownPattern.invalidWhen}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sizeFromBook")}</CardTitle>
          <CardDescription>
            {t("sizeFromBookDesc", {
              pct: settings.maxRiskPct,
              amount: money(capRisk, settings.currency),
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("entry")} value={entry} onChange={setEntry} />
            <Field label={t("stop")} value={stop} onChange={setStop} />
          </div>
          {quote ? (
            <button
              type="button"
              onClick={() => setEntry(quote.price.toFixed(2))}
              className="text-left text-xs text-paper underline-offset-4 hover:underline"
            >
              {t("useLive", { price: goldPrice(quote.price) })}
            </button>
          ) : null}
          <Field label={t("target")} value={target} onChange={setTarget} />
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("stopDistance")}</p>
              <p className="tabular">{goldPrice(dist)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("position")}</p>
              <p className="tabular">{lotsLabel(lots)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("risk")}</p>
              <p className="tabular">
                {money(capRisk, settings.currency)} · {pct(riskPct(capRisk, settings.trueCapital))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("rewardRisk")}</p>
              <p className="tabular">{rMultiple ? `${rMultiple.toFixed(1)}R` : "—"}</p>
            </div>
          </div>
          {habit === "habit" ? <p className="text-sm text-down">{t("habitRefuse")}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("rulesYouForget")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rules.map((rule) => {
            const on = Boolean(checks[rule.id]);
            return (
              <button
                key={rule.id}
                type="button"
                onClick={() => setChecks((c) => ({ ...c, [rule.id]: !c[rule.id] }))}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors duration-150",
                  on ? "bg-secondary" : "bg-muted/70",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm border",
                    on ? "border-primary bg-primary" : "border-border",
                  )}
                >
                  {on ? <span className="block size-1.5 rounded-full bg-primary-foreground" /> : null}
                </span>
                {displayRule(rule, locale)}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="thesis">{t("whyTrade")}</Label>
        <Textarea
          id="thesis"
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          placeholder={t("whyTradePh")}
        />
      </div>

      {error ? <p className="text-sm text-down">{error}</p> : null}

      <Button className="w-full" onClick={submit} disabled={!allChecked}>
        {t("lockThePlan")}
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => lockDesk("manual", 60)}>
          {t("lockMyself")}
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => endSession()}>
          {t("endSession")}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function CloseTrade({ tradeId }: { tradeId: string }) {
  const { t, locale } = useT();
  const trade = useStill((s) => s.trades.find((x) => x.id === tradeId));
  const settings = useStill((s) => s.settings);
  const patterns = useStill((s) => s.patterns);
  const rules = useStill((s) => s.rules);
  const closeTrade = useStill((s) => s.closeTrade);
  const cancelTrade = useStill((s) => s.cancelTrade);
  const [exit, setExit] = useState(trade ? String(trade.entry) : "");
  const [pnl, setPnl] = useState("");
  const [pnlTouched, setPnlTouched] = useState(false);
  const [notes, setNotes] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>(trade?.followedRules ?? {});
  const { quote } = useGoldQuote();

  if (!trade) return null;
  const pattern = patterns.find((p) => p.id === trade.patternId);
  const shown = pattern ? displayPattern(pattern, locale) : null;
  const exitN = Number(exit) || 0;
  const autoPnl = exitN > 0 ? Math.round(pnlFromMove(trade.side, trade.entry, exitN, trade.lots)) : 0;
  const pnlValue = pnlTouched ? pnl : exitN > 0 ? String(autoPnl) : pnl;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("openPlan")}
        </p>
        <h1 className="font-display text-4xl">
          {trade.side === "long" ? t("longGold") : t("shortGold")}
        </h1>
        <p className="text-sm text-muted-foreground">{shown?.name}</p>
      </header>
      <Card>
        <CardContent className="space-y-3 pt-5 text-sm">
          <Row label={t("entry")} value={goldPrice(trade.entry)} />
          <Row label={t("stop")} value={goldPrice(trade.stop)} />
          <Row label={t("risk")} value={money(trade.riskUsd, settings.currency)} />
          <Row label={t("position")} value={lotsLabel(trade.lots)} />
          <p className="pt-1 text-muted-foreground">{trade.thesis}</p>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("exit")} value={exit} onChange={setExit} />
        <Field
          label={t("pnl", { cur: settings.currency })}
          value={pnlValue}
          onChange={(v) => {
            setPnlTouched(true);
            setPnl(v);
          }}
        />
      </div>
      {quote ? (
        <button
          type="button"
          onClick={() => {
            setExit(quote.price.toFixed(2));
            setPnlTouched(false);
          }}
          className="text-left text-xs text-paper underline-offset-4 hover:underline"
        >
          {t("useLiveExit", { price: goldPrice(quote.price) })}
        </button>
      ) : exitN > 0 && !pnlTouched ? (
        <p className="text-xs text-muted-foreground">{t("fromExit")}</p>
      ) : null}
      <div className="space-y-2">
        {rules.map((rule) => {
          const on = Boolean(checks[rule.id]);
          return (
            <button
              key={rule.id}
              type="button"
              onClick={() => setChecks((c) => ({ ...c, [rule.id]: !c[rule.id] }))}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left text-sm",
                on ? "bg-secondary" : "bg-muted/70",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 size-4 shrink-0 rounded-sm border",
                  on ? "border-primary bg-primary" : "border-border",
                )}
              />
              {t("didIKeep")} {displayRule(rule, locale)}
            </button>
          );
        })}
      </div>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t("whatHappened")}
      />
      <Button
        className="w-full"
        onClick={() => {
          const n = Number(pnlValue);
          if (!Number.isFinite(n)) {
            toast.error(t("enterPnl"));
            return;
          }
          closeTrade(trade.id, {
            exit: Number(exit) || trade.entry,
            pnl: n,
            notes,
            followedRules: checks,
          });
          toast.message(n < 0 ? t("lossLogged") : t("winLogged"));
        }}
      >
        {t("closeAndLog")}
      </Button>
      <Button variant="ghost" className="w-full" onClick={() => cancelTrade(trade.id)}>
        {t("cancelPlan")}
      </Button>
    </div>
  );
}

function ReviewLock() {
  const { t, locale } = useT();
  const sessions = useStill((s) => s.sessions);
  const trades = useStill((s) => s.trades);
  const settings = useStill((s) => s.settings);
  const session = getActiveSession(sessions);
  const completeReview = useStill((s) => s.completeReview);
  const [broke, setBroke] = useState<boolean | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [nextTime, setNextTime] = useState("");

  if (!session) return null;
  const rows = sessionTrades(trades, session.id);
  const pnl = sessionPnl(trades, session);
  const ready = session.lockedUntil ? remainingLabel(session.lockedUntil) === "ready" : true;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-2">
        <Badge variant="down">{t("locked")}</Badge>
        <h1 className="font-display text-4xl">{t("sitWithLoss")}</h1>
        <p className="text-sm text-muted-foreground">
          {ready
            ? t("reviewReady")
            : t("reviewWait", {
                left: session.lockedUntil ? remainingLabel(session.lockedUntil) : "",
              })}
        </p>
      </header>
      <Card>
        <CardContent className="space-y-3 pt-5">
          {rows
            .filter((row) => row.status === "closed")
            .map((row) => (
              <div key={row.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t(row.side === "long" ? "long" : "short")} · {t(row.emotion)}
                </span>
                <span className={`tabular ${(row.pnl ?? 0) >= 0 ? "text-up" : "text-down"}`}>
                  {signedMoney(row.pnl ?? 0, settings.currency)}
                </span>
              </div>
            ))}
          <div className="flex justify-between border-t border-border pt-3 text-sm">
            <span>{t("session")}</span>
            <span className={`tabular ${pnl >= 0 ? "text-up" : "text-down"}`}>
              {signedMoney(pnl, settings.currency)}
            </span>
          </div>
        </CardContent>
      </Card>
      <YesNo question={t("brokeRuleQ")} value={broke} onChange={setBroke} yes={t("yes")} no={t("no")} />
      <YesNo
        question={t("patternValidQ")}
        value={valid}
        onChange={setValid}
        yes={t("yes")}
        no={t("no")}
      />
      <div className="space-y-1.5">
        <Label htmlFor="next">{t("nextTime")}</Label>
        <Textarea
          id="next"
          value={nextTime}
          onChange={(e) => setNextTime(e.target.value)}
          placeholder={t("nextTimePh")}
        />
      </div>
      <Button
        className="w-full"
        disabled={broke === null || valid === null || nextTime.trim().length < 8}
        onClick={() =>
          completeReview({
            brokeARule: Boolean(broke),
            patternWasValid: Boolean(valid),
            nextTime: nextTime.trim(),
          })
        }
      >
        {t("closeSession")}
      </Button>
    </div>
  );
}

function YesNo({
  question,
  value,
  onChange,
  yes,
  no,
}: {
  question: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  yes: string;
  no: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm">{question}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={value === true ? "default" : "outline"}
          onClick={() => onChange(true)}
        >
          {yes}
        </Button>
        <Button
          type="button"
          variant={value === false ? "default" : "outline"}
          onClick={() => onChange(false)}
        >
          {no}
        </Button>
      </div>
    </div>
  );
}
