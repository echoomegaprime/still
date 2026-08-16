import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isValidEmail,
  isValidNepalPhone,
  mailHref,
  normalizeNepalPhone,
  smsHref,
} from "@/lib/still/contact";
import { formatClock } from "@/lib/still/format";
import { useStill } from "@/lib/still/store";
import { useT } from "@/lib/still/use-i18n";
import { cn } from "@/lib/utils";

export function AlertSettings() {
  const { t } = useT();
  const settings = useStill((s) => s.settings);
  const alerts = useStill((s) => s.alerts);
  const updateSettings = useStill((s) => s.updateSettings);
  const pushAlert = useStill((s) => s.pushAlert);
  const markAlertsRead = useStill((s) => s.markAlertsRead);
  const startTutorial = useStill((s) => s.startTutorial);
  const [phone, setPhone] = useState(settings.phone || "+977");
  const [email, setEmail] = useState(settings.email);
  const [saved, setSaved] = useState(false);
  const [pushNote, setPushNote] = useState("");
  const [copied, setCopied] = useState(false);

  const phoneOk = isValidNepalPhone(phone);
  const emailOk = isValidEmail(email);
  const unread = alerts.filter((a) => !a.read).length;
  const testBody = t("botNeverClicks");

  function save() {
    updateSettings({
      phone: normalizeNepalPhone(phone),
      email: email.trim(),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  async function allowPush() {
    if (typeof Notification === "undefined") {
      setPushNote(t("pushDenied"));
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      updateSettings({ alertPush: true });
      setPushNote(t("pushOn"));
      try {
        new Notification(t("botName"), { body: t("botNeverClicks") });
      } catch {
        /* ignore */
      }
    } else {
      updateSettings({ alertPush: false });
      setPushNote(t("pushDenied"));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("alertsTitle")}</CardTitle>
          <CardDescription>{t("alertsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("phoneLabel")}</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("phonePh")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {phone && !phoneOk ? <p className="text-xs text-down">{t("phoneBad")}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mail">{t("emailLabel")}</Label>
            <Input
              id="mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("emailPh")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email && !emailOk ? <p className="text-xs text-down">{t("emailBad")}</p> : null}
          </div>

          <Toggle
            label={t("channelSms")}
            on={settings.alertSms}
            onClick={() => updateSettings({ alertSms: !settings.alertSms })}
          />
          <Toggle
            label={t("channelEmail")}
            on={settings.alertEmail}
            onClick={() => updateSettings({ alertEmail: !settings.alertEmail })}
          />
          <Toggle
            label={t("channelPush")}
            on={settings.alertPush}
            onClick={() => updateSettings({ alertPush: !settings.alertPush })}
          />
          <Toggle
            label={t("whenSit")}
            on={settings.alertOnSit}
            onClick={() => updateSettings({ alertOnSit: !settings.alertOnSit })}
          />
          <Toggle
            label={t("whenLevel")}
            on={settings.alertOnLevel}
            onClick={() => updateSettings({ alertOnLevel: !settings.alertOnLevel })}
          />
          <Toggle
            label={t("whenLondon")}
            on={settings.alertOnLondon}
            onClick={() => updateSettings({ alertOnLondon: !settings.alertOnLondon })}
          />

          <p className="text-sm leading-relaxed text-muted-foreground">{t("alertsHow")}</p>

          <div className="flex flex-col gap-2">
            <Button onClick={save}>{saved ? t("contactSaved") : t("saveContact")}</Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                disabled={!phoneOk || !settings.alertSms}
                onClick={() => {
                  pushAlert({ kind: "test", title: t("botName"), body: testBody });
                  window.location.href = smsHref(phone, `${t("botName")}. ${testBody}`);
                }}
              >
                {t("testSms")}
              </Button>
              <Button
                variant="outline"
                disabled={!emailOk || !settings.alertEmail}
                onClick={() => {
                  pushAlert({ kind: "test", title: t("botName"), body: testBody });
                  window.location.href = mailHref(email, t("botName"), testBody);
                }}
              >
                {t("testEmail")}
              </Button>
            </div>
            <Button variant="ghost" onClick={() => void allowPush()}>
              {t("allowPush")}
            </Button>
            {pushNote ? <p className="text-xs text-muted-foreground">{pushNote}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t("botName")}</CardTitle>
            {unread > 0 ? (
              <button type="button" onClick={() => markAlertsRead()} className="text-xs text-paper">
                {t("unreadN", { n: unread })}
              </button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("inboxEmpty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {alerts.slice(0, 8).map((alert) => (
                <li key={alert.id} className="py-3 first:pt-0">
                  <p className="text-xs text-muted-foreground">{formatClock(alert.at)}</p>
                  <p className="mt-1 text-sm leading-relaxed">{alert.body}</p>
                  <div className="mt-2 flex gap-3">
                    {settings.alertSms && phoneOk ? (
                      <a
                        className="text-xs text-paper underline-offset-4 hover:underline"
                        href={smsHref(phone, `${alert.title}. ${alert.body}`)}
                      >
                        {t("sendThisSms")}
                      </a>
                    ) : null}
                    {settings.alertEmail && emailOk ? (
                      <a
                        className="text-xs text-paper underline-offset-4 hover:underline"
                        href={mailHref(email, alert.title, alert.body)}
                      >
                        {t("sendThisEmail")}
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("installTitle")}</CardTitle>
          <CardDescription>{t("installBody")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("installIos")}</p>
          <p className="text-sm text-muted-foreground">{t("installAndroid")}</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.origin);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? t("linkCopied") : t("copyLink")}
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => startTutorial()}>
        {t("replayTutorial")}
      </Button>
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-between gap-3 rounded-lg bg-muted px-3 text-left text-sm"
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          on ? "bg-paper" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-ink transition-transform",
            on ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
