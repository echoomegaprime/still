import { useEffect, type ReactNode } from "react";
import { useStill } from "@/lib/still/store";

export function StillHydrate({ children }: { children: ReactNode }) {
  const hydrated = useStill((s) => s.hydrated);
  const setHydrated = useStill((s) => s.setHydrated);

  useEffect(() => {
    const unsub = useStill.persist.onFinishHydration(() => setHydrated(true));
    if (useStill.persist.hasHydrated()) setHydrated(true);
    const fallback = window.setTimeout(() => setHydrated(true), 400);
    return () => {
      unsub();
      window.clearTimeout(fallback);
    };
  }, [setHydrated]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pt-10">
        <div className="h-10 w-40 animate-pulse rounded-md bg-secondary" />
        <div className="h-40 animate-pulse rounded-xl bg-card" />
        <div className="h-28 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  return <>{children}</>;
}
