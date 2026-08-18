/**
 * News blackout — the high-impact USD events that produce gold's worst whipsaws.
 *
 * Both Opus 5 and Fable 5 said the same thing: ship a small, self-owned calendar,
 * not a free API. FOMC dates are published years ahead; NFP is deterministic (the
 * first Friday, 08:30 ET). So we COMPUTE what is computable and hardcode the rest,
 * and treat the whole thing as refreshed quarterly. The blackout is advisory — it
 * only ever pushes the Watchman toward "wait" / "sit", never toward a trade.
 */
export type EconImpact = "high";
export type EconEvent = {
  /** Release moment, UTC ISO. */
  at: string;
  label: string; // "NFP", "CPI", "FOMC"
  impact: EconImpact;
};

/* --- US Eastern <-> UTC, DST-aware (2nd Sun Mar .. 1st Sun Nov) --------- */

function nthWeekdayUtc(year: number, month0: number, weekday: number, nth: number): number {
  // day-of-month of the nth given weekday (1-based nth) in month0 (0-11), UTC.
  const first = new Date(Date.UTC(year, month0, 1)).getUTCDay();
  const offset = (weekday - first + 7) % 7;
  return 1 + offset + (nth - 1) * 7;
}

/** True when US Eastern observes daylight time (EDT, UTC-4) at this instant. */
function isUsEdt(d: Date): boolean {
  const y = d.getUTCFullYear();
  const start = Date.UTC(y, 2, nthWeekdayUtc(y, 2, 0, 2), 7); // 2nd Sun Mar, 02:00 ET = 07:00 UTC
  const end = Date.UTC(y, 10, nthWeekdayUtc(y, 10, 0, 1), 6); // 1st Sun Nov, 02:00 EDT = 06:00 UTC
  const t = d.getTime();
  return t >= start && t < end;
}

/** An 08:30-ET (or given ET hh:mm) wall time on a UTC calendar day -> UTC ISO. */
function etToUtcIso(year: number, month0: number, day: number, hourEt: number, minEt: number): string {
  // Build a provisional UTC noon to decide DST for that date, then apply offset.
  const probe = new Date(Date.UTC(year, month0, day, 12, 0));
  const offset = isUsEdt(probe) ? 4 : 5; // EDT=UTC-4, EST=UTC-5
  return new Date(Date.UTC(year, month0, day, hourEt + offset, minEt)).toISOString();
}

/** First Friday of a month, NFP at 08:30 ET. */
function nfpForMonth(year: number, month0: number): EconEvent {
  const day = nthWeekdayUtc(year, month0, 5 /* Fri */, 1);
  return { at: etToUtcIso(year, month0, day, 8, 30), label: "NFP", impact: "high" };
}

/**
 * FOMC decision days (statement 14:00 ET) — 2026 scheduled meetings, decision on
 * the second day. Verify/refresh against federalreserve.gov each quarter.
 */
const FOMC_DECISION_DAYS_2026: Array<[number, number]> = [
  [0, 28], // Jan 27-28
  [2, 18], // Mar 17-18
  [3, 29], // Apr 28-29
  [5, 17], // Jun 16-17
  [6, 29], // Jul 28-29
  [8, 16], // Sep 15-16
  [9, 28], // Oct 27-28
  [11, 16], // Dec 15-16
];

function fomcEvents(): EconEvent[] {
  return FOMC_DECISION_DAYS_2026.map(([m, d]) => ({
    at: etToUtcIso(2026, m, d, 14, 0),
    label: "FOMC",
    impact: "high" as const,
  }));
}

/** All computed/known high-impact events in a window around `now`. */
export function econEvents(now = new Date()): EconEvent[] {
  const y = now.getUTCFullYear();
  const nfp: EconEvent[] = [];
  // NFP for the surrounding 6 months (covers any horizon we care about).
  for (let i = -1; i <= 5; i += 1) {
    const d = new Date(Date.UTC(y, now.getUTCMonth() + i, 1));
    nfp.push(nfpForMonth(d.getUTCFullYear(), d.getUTCMonth()));
  }
  return [...nfp, ...fomcEvents()].sort((a, b) => a.at.localeCompare(b.at));
}

/* --- The blackout gate ------------------------------------------------- */

export type BlackoutState = "clear" | "approach" | "blackout";

export type BlackoutReport = {
  state: BlackoutState;
  event: EconEvent | null;
  /** Minutes until the event (negative = minutes since). */
  minutesTo: number | null;
};

const MS_MIN = 60_000;

/**
 * blackout: T-30m .. T+15m around any high-impact event.
 * approach:  T-120m .. T-30m — visible warning, still only "wait".
 */
export function blackoutReport(now = new Date(), events?: EconEvent[]): BlackoutReport {
  const list = events ?? econEvents(now);
  const t = now.getTime();
  let best: BlackoutReport = { state: "clear", event: null, minutesTo: null };
  for (const e of list) {
    const dtMin = (Date.parse(e.at) - t) / MS_MIN;
    if (dtMin >= -15 && dtMin <= 30) {
      // Inside the whipsaw window — hard sit. Nearest wins.
      if (best.state !== "blackout" || Math.abs(dtMin) < Math.abs(best.minutesTo ?? Infinity)) {
        best = { state: "blackout", event: e, minutesTo: Math.round(dtMin) };
      }
    } else if (dtMin > 30 && dtMin <= 120 && best.state === "clear") {
      best = { state: "approach", event: e, minutesTo: Math.round(dtMin) };
    }
  }
  return best;
}
