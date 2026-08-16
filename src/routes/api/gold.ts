import { createFileRoute } from "@tanstack/react-router";
import { fetchGoldQuote } from "@/lib/still/quote";

export const Route = createFileRoute("/api/gold")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const quote = await fetchGoldQuote();
          return Response.json(quote, {
            headers: { "Cache-Control": "public, max-age=10" },
          });
        } catch {
          return Response.json({ error: "No gold print" }, { status: 502 });
        }
      },
    },
  },
});
