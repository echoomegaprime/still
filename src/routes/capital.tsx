import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { CapitalView } from "@/components/still/capital";
import { StillHydrate } from "@/components/still/hydrate";

export const Route = createFileRoute("/capital")({ component: CapitalPage });

function CapitalPage() {
  return (
    <AppShell>
      <StillHydrate>
        <CapitalView />
      </StillHydrate>
    </AppShell>
  );
}
