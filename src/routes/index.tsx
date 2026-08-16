import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { DeskHome } from "@/components/still/desk-home";
import { StillHydrate } from "@/components/still/hydrate";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell>
      <StillHydrate>
        <DeskHome />
      </StillHydrate>
    </AppShell>
  );
}
