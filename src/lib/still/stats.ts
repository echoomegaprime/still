import type { Pattern, Session, Trade } from "./types";

export function isFollowed(trade: Trade): boolean {
  return Object.values(trade.followedRules).every(Boolean);
}

export function closedTrades(trades: Trade[]): Trade[] {
  return trades.filter((t) => t.status === "closed" && t.pnl !== undefined);
}

export function sessionTrades(trades: Trade[], sessionId: string): Trade[] {
  return trades.filter((t) => t.sessionId === sessionId);
}

export function sumPnl(trades: Trade[]): number {
  return trades.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
}

export function consecutiveLosses(trades: Trade[]): number {
  const closed = [...closedTrades(trades)].sort((a, b) =>
    (a.closedAt ?? a.openedAt).localeCompare(b.closedAt ?? b.openedAt),
  );
  let n = 0;
  for (let i = closed.length - 1; i >= 0; i -= 1) {
    if ((closed[i]?.pnl ?? 0) < 0) n += 1;
    else break;
  }
  return n;
}

export function verdict(trades: Trade[]) {
  const closed = closedTrades(trades);
  const followed = closed.filter(isFollowed);
  const broken = closed.filter((t) => !isFollowed(t));
  const followedPnl = sumPnl(followed);
  const brokenPnl = sumPnl(broken);
  const revenge = closed.filter((t) => t.brokeRuleAfterLoss || t.emotion === "revenge");
  const revengePnl = sumPnl(revenge);
  const plannedLosses = followed.filter((t) => (t.pnl ?? 0) < 0);
  return {
    closed,
    followed,
    broken,
    followedPnl,
    brokenPnl,
    revenge,
    revengePnl,
    plannedLosses,
    winRateFollowed:
      followed.length === 0
        ? 0
        : followed.filter((t) => (t.pnl ?? 0) > 0).length / followed.length,
    winRateBroken:
      broken.length === 0
        ? 0
        : broken.filter((t) => (t.pnl ?? 0) > 0).length / broken.length,
  };
}

export function patternStats(trades: Trade[], patterns: Pattern[]) {
  return patterns
    .map((pattern) => {
      const rows = closedTrades(trades).filter((t) => t.patternId === pattern.id);
      const followed = rows.filter(isFollowed);
      const broken = rows.filter((t) => !isFollowed(t));
      return {
        pattern,
        count: rows.length,
        pnl: sumPnl(rows),
        followedPnl: sumPnl(followed),
        brokenPnl: sumPnl(broken),
        wins: rows.filter((t) => (t.pnl ?? 0) > 0).length,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function equitySeries(starting: number, trades: Trade[]) {
  const closed = [...closedTrades(trades)].sort((a, b) =>
    (a.closedAt ?? a.openedAt).localeCompare(b.closedAt ?? b.openedAt),
  );
  let equity = starting;
  const points = [{ label: "Start", equity, pnl: 0, followed: true }];
  for (const trade of closed) {
    equity += trade.pnl ?? 0;
    points.push({
      label: trade.closedAt ?? trade.openedAt,
      equity,
      pnl: trade.pnl ?? 0,
      followed: isFollowed(trade),
    });
  }
  return points;
}

export function currentEquity(starting: number, trades: Trade[]): number {
  return starting + sumPnl(closedTrades(trades));
}

export function sessionPnl(trades: Trade[], session: Session): number {
  return sumPnl(sessionTrades(trades, session.id));
}

export function isSessionLocked(session: Session | undefined): boolean {
  if (!session || session.endedAt) return false;
  return Boolean(session.lockReason);
}

export type SessionWindow = "weekend" | "overlap" | "london" | "ny" | "asia" | "off";

export function goldSessionLabel(now = new Date()): {
  id: SessionWindow;
  nepal: string;
} {
  const npt = new Date(now.getTime() + (5 * 60 + 45) * 60_000);
  const minutes = npt.getUTCHours() * 60 + npt.getUTCMinutes();
  const hh = String(npt.getUTCHours()).padStart(2, "0");
  const mm = String(npt.getUTCMinutes()).padStart(2, "0");
  const nepal = `${hh}:${mm} NPT`;
  const day = npt.getUTCDay();
  if (day === 0 || (day === 6 && minutes > 3 * 60) || (day === 1 && minutes < 4 * 60)) {
    return { id: "weekend", nepal };
  }
  if (minutes >= 18 * 60 + 30 && minutes < 22 * 60) {
    return { id: "overlap", nepal };
  }
  if (minutes >= 13 * 60 + 45 && minutes < 22 * 60) {
    return { id: "london", nepal };
  }
  if (minutes >= 18 * 60 + 30 || minutes < 3 * 60) {
    return { id: "ny", nepal };
  }
  if (minutes >= 5 * 60 && minutes < 12 * 60) {
    return { id: "asia", nepal };
  }
  return { id: "off", nepal };
}
