import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signedMoney } from "@/lib/still/format";
import { patternStats } from "@/lib/still/stats";
import { useStill } from "@/lib/still/store";
import { displayPattern, displayRule, useT } from "@/lib/still/use-i18n";

export function PlaybookView() {
  const { t, locale } = useT();
  const patterns = useStill((s) => s.patterns);
  const trades = useStill((s) => s.trades);
  const rules = useStill((s) => s.rules);
  const settings = useStill((s) => s.settings);
  const updateRule = useStill((s) => s.updateRule);
  const addRule = useStill((s) => s.addRule);
  const removeRule = useStill((s) => s.removeRule);
  const [draft, setDraft] = useState("");
  const stats = patternStats(trades, patterns);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("playbook")}
        </p>
        <h1 className="font-display text-4xl">{t("playbookHero")}</h1>
        <p className="max-w-xl text-sm text-muted-foreground">{t("playbookBody")}</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">{t("rulesSurvive")}</h2>
        <ul className="space-y-2">
          {rules.map((rule, index) => (
            <li key={rule.id} className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
              <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {t("ruleN", { n: index + 1 })}
              </p>
              {locale === "np" ? (
                <p className="text-sm leading-relaxed">{displayRule(rule, locale)}</p>
              ) : (
                <textarea
                  value={rule.text}
                  onChange={(e) => updateRule(rule.id, e.target.value)}
                  className="min-h-16 w-full resize-none bg-transparent text-sm outline-none"
                />
              )}
              {rules.length > 3 ? (
                <button
                  type="button"
                  onClick={() => removeRule(rule.id)}
                  className="mt-2 text-xs text-muted-foreground hover:text-down"
                >
                  {t("remove")}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("addRulePh")}
          />
          <Button
            variant="outline"
            onClick={() => {
              if (!draft.trim()) return;
              addRule(draft);
              setDraft("");
            }}
          >
            {t("add")}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">{t("goldPatterns")}</h2>
        <div className="grid gap-3">
          {stats.map(({ pattern, count, pnl, followedPnl, brokenPnl, wins }) => {
            const shown = displayPattern(pattern, locale);
            return (
              <Card key={pattern.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-xl">{shown.name}</CardTitle>
                    <p className={`tabular text-sm ${pnl >= 0 ? "text-up" : "text-down"}`}>
                      {count === 0 ? t("unused") : signedMoney(pnl, settings.currency)}
                    </p>
                  </div>
                  <CardDescription>{shown.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                    {shown.tells.map((tell) => (
                      <li key={tell}>{tell}</li>
                    ))}
                  </ul>
                  <p className="text-sm">
                    {t("invalidWhen")}:{" "}
                    <span className="text-muted-foreground">{shown.invalidWhen}</span>
                  </p>
                  {count > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {t("patternStats", {
                        wins,
                        count,
                        followed: signedMoney(followedPnl, settings.currency),
                        broken: signedMoney(brokenPnl, settings.currency),
                      })}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
