import { type MessageKey, t } from "./i18n";
import { DEFAULT_PATTERNS, DEFAULT_RULES } from "./seed";
import { useStill } from "./store";
import type { Locale, Pattern, Rule } from "./types";

export function useLocale(): Locale {
  const raw = useStill((s) => s.settings.locale);
  return raw === "np" ? "np" : "en";
}

export function useT() {
  const locale = useLocale();
  return {
    locale,
    t: (key: MessageKey, vars?: Record<string, string | number>) => t(locale, key, vars),
  };
}

export function displayRule(rule: Rule, locale: Locale): string {
  if (locale === "en") return rule.text;
  const def = DEFAULT_RULES.find((r) => r.id === rule.id);
  if (def && def.text === rule.text) {
    const key = `rule.${rule.id}` as MessageKey;
    return t(locale, key);
  }
  return rule.text;
}

export function displayPattern(pattern: Pattern, locale: Locale): Pattern {
  if (locale === "en") return pattern;
  const def = DEFAULT_PATTERNS.find((p) => p.id === pattern.id);
  if (!def || def.name !== pattern.name) return pattern;
  const id = pattern.id;
  return {
    ...pattern,
    name: t(locale, `pat.${id}.name` as MessageKey),
    summary: t(locale, `pat.${id}.summary` as MessageKey),
    invalidWhen: t(locale, `pat.${id}.invalid` as MessageKey),
    tells: [0, 1, 2].map((i) => t(locale, `pat.${id}.t${i}` as MessageKey)),
  };
}
