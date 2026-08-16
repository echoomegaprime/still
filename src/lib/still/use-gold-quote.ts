import { useEffect, useState } from "react";
import { marketOpen, type GoldQuote } from "./quote";

export function useGoldQuote(intervalMs = 20_000) {
  const [quote, setQuote] = useState<GoldQuote | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function pull() {
      try {
        const data = (await fetchLocalGold()) ?? (await fetchPublicGold());
        if (!data || cancelled || !Number.isFinite(data.price)) {
          if (!cancelled) setError(true);
          return;
        }
        setQuote(data);
        setError(false);
        setHistory((h) => {
          const next = h.length && h[h.length - 1] === data.price ? h : [...h, data.price];
          return next.slice(-48);
        });
      } catch {
        if (!cancelled) setError(true);
      }
    }

    void pull();
    const id = window.setInterval(() => void pull(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return { quote, history, error };
}

async function fetchLocalGold(): Promise<GoldQuote | null> {
  try {
    const res = await fetch("/api/gold");
    if (!res.ok) return null;
    const data = (await res.json()) as GoldQuote;
    return Number.isFinite(data.price) ? data : null;
  } catch {
    return null;
  }
}

async function fetchPublicGold(): Promise<GoldQuote | null> {
  const res = await fetch("https://api.gold-api.com/price/XAU", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const raw = (await res.json()) as { price?: number; updatedAt?: string };
  const price = Number(raw.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    price,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    source: "spot",
    market: marketOpen(new Date()),
  };
}
