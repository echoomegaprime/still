import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LangSwitch } from "@/components/still/lang-switch";
import { normalizeNepalPhone } from "@/lib/still/contact";
import { useStill } from "@/lib/still/store";
import { useT } from "@/lib/still/use-i18n";

export function ClaimDesk() {
  const { t } = useT();
  const hydrated = useStill((s) => s.hydrated);
  const settings = useStill((s) => s.settings);
  const claimDesk = useStill((s) => s.claimDesk);
  const [name, setName] = useState(settings.displayName === "Trader" ? "" : settings.displayName);
  const [capital, setCapital] = useState(String(settings.trueCapital || 80_000));
  const [story, setStory] = useState(String(settings.friendsStory || 30_000));
  const [phone, setPhone] = useState(settings.phone || "+977");
  const [email, setEmail] = useState(settings.email || "");

  if (!hydrated || !settings.tutorialDone || settings.claimed) return null;

  function save(startFresh: boolean) {
    claimDesk({
      startFresh,
      settings: {
        displayName: name.trim() || "Trader",
        trueCapital: Number(capital) || 80_000,
        friendsStory: Number(story) || 30_000,
        phone: normalizeNepalPhone(phone),
        email: email.trim(),
      },
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/80 p-4 pb-24 md:items-center md:pb-4">
      <div className="w-full max-w-md rounded-xl bg-card p-5 shadow-[var(--shadow-border)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("claimKicker")}
          </p>
          <LangSwitch compact />
        </div>
        <h2 className="mt-4 font-display text-3xl leading-tight">{t("claimTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("claimBody")}</p>

        <div className="mt-5 space-y-3">
          <Field id="claim-name" label={t("whatWeCall")} value={name} onChange={setName} />
          <div className="grid grid-cols-2 gap-3">
            <Field id="claim-true" label={t("trueCapital")} value={capital} onChange={setCapital} />
            <Field id="claim-story" label={t("whatFriendsThink")} value={story} onChange={setStory} />
          </div>
          <Field id="claim-phone" label={t("phoneLabel")} value={phone} onChange={setPhone} tel />
          <Field id="claim-mail" label={t("emailLabel")} value={email} onChange={setEmail} email />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => save(false)}>{t("claimStudy")}</Button>
          <Button variant="outline" onClick={() => save(true)}>
            {t("claimFresh")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  tel,
  email,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  tel?: boolean;
  email?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={email ? "email" : tel ? "tel" : "text"}
        inputMode={tel ? "tel" : email ? "email" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
