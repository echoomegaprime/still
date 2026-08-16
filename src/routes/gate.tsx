import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { GateView } from "@/components/still/gate";
import { StillHydrate } from "@/components/still/hydrate";

export const Route = createFileRoute("/gate")({ component: GatePage });

function GatePage() {
  return (
    <AppShell>
      <StillHydrate>
        <GateView />
      </StillHydrate>
    </AppShell>
  );
}
