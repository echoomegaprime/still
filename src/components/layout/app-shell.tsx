import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Landmark, Lock, NotebookPen, Scale } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { ClaimDesk } from "@/components/still/claim";
import { LangSwitch } from "@/components/still/lang-switch";
import { Tutorial } from "@/components/still/tutorial";
import { WatchmanWatcher } from "@/components/still/watchman-watcher";
import { UserButton, SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useStill } from "@/lib/still/store";
import { useLocale, useT } from "@/lib/still/use-i18n";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPending } = useCurrentUserState();
  const { t } = useT();
  const locale = useLocale();
  const startTutorial = useStill((s) => s.startTutorial);
  const unread = useStill((s) => s.alerts.filter((a) => !a.read).length);

  useEffect(() => {
    document.documentElement.lang = locale === "np" ? "ne" : "en";
  }, [locale]);

  const nav = [
    { to: "/", label: t("navDesk"), icon: Landmark },
    { to: "/gate", label: t("navGate"), icon: Lock },
    { to: "/journal", label: t("navJournal"), icon: NotebookPen },
    { to: "/playbook", label: t("navPlaybook"), icon: BookOpen },
    { to: "/capital", label: t("navBook"), icon: Scale },
  ] as const;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-6xl">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border px-4 py-6 md:flex">
          <Brand sub={t("brandSub")} />
          <nav className="mt-10 flex flex-col gap-1">
            {nav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" strokeWidth={1.75} />
                  <span className="flex items-center gap-2">
                    {item.label}
                    {item.to === "/capital" && unread > 0 ? (
                      <span className="size-1.5 rounded-full bg-paper" />
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-4 pt-6">
            <button
              type="button"
              onClick={() => startTutorial()}
              className="text-left text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("howLink")}
            </button>
            <LangSwitch />
            <AuthChip pending={isPending} signIn={t("signIn")} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:hidden">
            <Brand compact sub={t("brandSub")} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startTutorial()}
                className="text-[11px] uppercase tracking-wider text-muted-foreground"
              >
                {t("howLink")}
              </button>
              <LangSwitch compact />
              <AuthChip pending={isPending} compact signIn={t("signIn")} />
            </div>
          </header>
          <main className="flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-wider",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-4" strokeWidth={1.75} />
                  <span className="flex items-center gap-1">
                    {item.label}
                    {item.to === "/capital" && unread > 0 ? (
                      <span className="size-1 rounded-full bg-paper" />
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <WatchmanWatcher />
      <Tutorial />
      <ClaimDesk />
    </div>
  );
}

function Brand({ compact = false, sub }: { compact?: boolean; sub: string }) {
  return (
    <Link to="/" className="flex items-baseline gap-2">
      <span className="font-display text-2xl tracking-tight">Still</span>
      {!compact && (
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {sub}
        </span>
      )}
    </Link>
  );
}

function AuthChip({
  pending,
  compact = false,
  signIn,
}: {
  pending: boolean;
  compact?: boolean;
  signIn: string;
}) {
  if (pending) {
    return <div className="h-8 w-24 animate-pulse rounded-full bg-secondary" />;
  }
  return (
    <>
      <SignedIn>
        <div className={cn("text-muted-foreground", compact && "[&_span:nth-of-type(2)]:hidden")}>
          <UserButton />
        </div>
      </SignedIn>
      <SignedOut>
        <Link
          to="/login"
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {signIn}
        </Link>
      </SignedOut>
    </>
  );
}
