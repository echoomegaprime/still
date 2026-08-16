export type GoldQuote = {
  price: number;
  previous?: number;
  change?: number;
  changePct?: number;
  updatedAt: string;
  source: "spot" | "futures";
  market: "open" | "closed";
};

const UA = "StillGoldDesk/1.0";

export async function fetchGoldQuote(): Promise<GoldQuote> {
  const [spot, futures] = await Promise.all([fetchSpot(), fetchFutures()]);
  if (spot && futures) {
    return {
      ...spot,
      previous: futures.previous,
      change: futures.change,
      changePct: futures.changePct,
    };
  }
  if (spot) return spot;
  if (futures) return futures;
  throw new Error("No gold print");
}

async function fetchSpot(): Promise<GoldQuote | null> {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU", {
      headers: { Accept: "application/json", "User-Agent": UA },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { price?: number; updatedAt?: string };
    const price = Number(data.price);
    if (!Number.isFinite(price) || price <= 0) return null;
    return {
      price,
      updatedAt: data.updatedAt ?? new Date().toISOString(),
      source: "spot",
      market: marketOpen(new Date()),
    };
  } catch {
    return null;
  }
}

async function fetchFutures(): Promise<GoldQuote | null> {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d",
      {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: AbortSignal.timeout(7000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number; previousClose?: number; chartPreviousClose?: number };
        }>;
      };
    };
    const meta = data.chart?.result?.[0]?.meta;
    const price = Number(meta?.regularMarketPrice);
    if (!Number.isFinite(price) || price <= 0) return null;
    const previous = Number(meta?.previousClose ?? meta?.chartPreviousClose);
    const hasPrev = Number.isFinite(previous) && previous > 0;
    return {
      price,
      previous: hasPrev ? previous : undefined,
      change: hasPrev ? price - previous : undefined,
      changePct: hasPrev ? ((price - previous) / previous) * 100 : undefined,
      updatedAt: new Date().toISOString(),
      source: "futures",
      market: marketOpen(new Date()),
    };
  } catch {
    return null;
  }
}

/** COMEX / most XAUUSD desks: closed Sat–Sun (NPT weekend already handled in session clock). */
export function marketOpen(now = new Date()): "open" | "closed" {
  const utcDay = now.getUTCDay();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (utcDay === 6 && utcMinutes > 21 * 60) return "closed";
  if (utcDay === 0) return "closed";
  if (utcDay === 1 && utcMinutes < 22 * 60) return "closed";
  return "open";
}
