import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PlaybookView } from "@/components/still/playbook";
import { StillHydrate } from "@/components/still/hydrate";

export const Route = createFileRoute("/playbook")({ component: PlaybookPage });

function PlaybookPage() {
  return (
    <AppShell>
      <StillHydrate>
        <PlaybookView />
      </StillHydrate>
    </AppShell>
  );
}
