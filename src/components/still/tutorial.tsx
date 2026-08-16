import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LangSwitch } from "@/components/still/lang-switch";
import { TUTORIAL_STEPS } from "@/lib/still/tutorial";
import { useStill } from "@/lib/still/store";
import { useT } from "@/lib/still/use-i18n";

export function Tutorial() {
  const { t } = useT();
  const done = useStill((s) => s.settings.tutorialDone);
  const hydrated = useStill((s) => s.hydrated);
  const finishTutorial = useStill((s) => s.finishTutorial);
  const [step, setStep] = useState(0);

  if (!hydrated || done) return null;

  const last = step >= TUTORIAL_STEPS.length - 1;
  const current = TUTORIAL_STEPS[step];
  if (!current) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/80 p-4 pb-24 md:items-center md:pb-4">
      <div className="w-full max-w-md rounded-xl bg-card p-5 shadow-[var(--shadow-border)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("tutKicker")}
          </p>
          <LangSwitch compact />
        </div>
        <p className="mt-4 text-xs tabular text-muted-foreground">
          {t("tutStep", { n: step + 1, of: TUTORIAL_STEPS.length })}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-paper transition-[width] duration-200 ease-[var(--ease-smooth-out)]"
            style={{ width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>
        <h2 className="mt-5 font-display text-3xl leading-tight">{t(current.title)}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(current.body)}</p>
        <div className="mt-6 flex items-center gap-2">
          {step > 0 ? (
            <Button variant="ghost" className="flex-1" onClick={() => setStep((n) => n - 1)}>
              {t("tutBack")}
            </Button>
          ) : (
            <Button variant="ghost" className="flex-1" onClick={() => finishTutorial()}>
              {t("tutSkip")}
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={() => {
              if (last) finishTutorial();
              else setStep((n) => n + 1);
            }}
          >
            {last ? t("tutDone") : t("tutNext")}
          </Button>
        </div>
      </div>
    </div>
  );
}
