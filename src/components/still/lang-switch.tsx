import { useStill } from "@/lib/still/store";
import { useLocale } from "@/lib/still/use-i18n";
import { cn } from "@/lib/utils";

export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const updateSettings = useStill((s) => s.updateSettings);

  return (
    <div
      className={cn(
        "inline-flex rounded-full bg-secondary p-0.5",
        compact ? "h-8" : "h-9",
      )}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => updateSettings({ locale: "en" })}
        className={cn(
          "rounded-full px-2.5 text-[11px] font-medium tracking-wide transition-colors duration-150",
          locale === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => updateSettings({ locale: "np" })}
        className={cn(
          "rounded-full px-2.5 text-[11px] font-medium tracking-wide transition-colors duration-150",
          locale === "np"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        NP
      </button>
    </div>
  );
}
