import { createFileRoute, Link } from "@tanstack/react-router";
import { LangSwitch } from "@/components/still/lang-switch";
import { Button } from "@/components/ui/button";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useT } from "@/lib/still/use-i18n";
import { StillHydrate } from "@/components/still/hydrate";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <StillHydrate>
      <LoginInner />
    </StillHydrate>
  );
}

function LoginInner() {
  const { t } = useT();
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-end">
          <LangSwitch />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("loginKicker")}
          </p>
          <h1 className="font-display text-4xl">{t("loginTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("loginBody")}</p>
        </div>
        {authEnabled ? (
          <div className="space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                {t("continueWith", { label: p.label })}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("signInDisabled")}</p>
        )}
        <Link
          to="/"
          className="block text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("backToDesk")}
        </Link>
      </div>
    </main>
  );
}
