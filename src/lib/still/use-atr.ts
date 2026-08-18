import { useEffect, useState } from "react";
import type { AtrSnapshot } from "./intel";

/**
 * Daily ATR from /api/atr. Polls slowly (it's a daily bar) and fails soft —
 * a null ATR simply means the volatility gate stays quiet, never blocking.
 */
export function useAtr(intervalMs = 30 * 60_000) {
  const [atr, setAtr] = useState<AtrSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      try {
        const res = await fetch("/api/atr");
        if (!res.ok) return;
        const data = (await res.json()) as AtrSnapshot;
        if (!cancelled && Number.isFinite(data.atr14) && data.atr14 > 0) setAtr(data);
      } catch {
        /* fail soft — leave atr as-is */
      }
    }
    void pull();
    const id = window.setInterval(() => void pull(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return atr;
}
