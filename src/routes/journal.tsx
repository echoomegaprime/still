import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { JournalView } from "@/components/still/journal";
import { StillHydrate } from "@/components/still/hydrate";

export const Route = createFileRoute("/journal")({ component: JournalPage });

function JournalPage() {
  return (
    <AppShell>
      <StillHydrate>
        <JournalView />
      </StillHydrate>
    </AppShell>
  );
}
