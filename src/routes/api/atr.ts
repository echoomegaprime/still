import { createFileRoute } from "@tanstack/react-router";
import { fetchAtr } from "@/lib/still/atr";

export const Route = createFileRoute("/api/atr")({
  server: {
    handlers: {
      GET: async () => {
        const atr = await fetchAtr();
        if (!atr) return Response.json({ error: "No ATR" }, { status: 502 });
        return Response.json(atr, {
          // Daily bar — cache hard; a stale ATR is fine, a missing one is not.
          headers: { "Cache-Control": "public, max-age=3600, s-maxage=21600" },
        });
      },
    },
  },
});
