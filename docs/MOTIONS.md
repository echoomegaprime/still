# Motions — design doc

> **Status:** DESIGN ONLY. Not built. Live auto-execution is gated on a lawyer's
> read of the Nepal Rastra Bank question (§6) and on the user actually clearing
> the mastery gate (§3). This document is the synthesis of two independent
> reviews (Opus 5 and Fable 5), which converged almost completely.

Motions is the optional autonomous companion to **Still**. Still is a gold
trading **discipline** app — "it never clicks, it only tells you to sit." Motions
is the piece that *can* click. That is exactly why it is dangerous, and why every
decision below is about constraint, not capability.

---

## 1. The one principle everything derives from

> **A cage, not a gun.** Motions must be able to trade *less* than the user
> would by hand — smaller, rarer, rule-bound — and **never more**. The moment it
> has a knob for size, frequency, or "aggression," it has become the bigger gun
> that Still exists to take away.

Test for any proposed Motions feature: *does it let him do something riskier than
he could do himself?* If yes, it does not ship. An autopilot that can only
**open** trades is a bigger gun. An autopilot that can only **reduce** exposure
is a seatbelt. **Ship the seatbelt.**

His problem was never analysis or execution speed — it was impulse and size.
Motions does not remove the impulse; it removes the *friction between impulse and
size*. That is only safe if the machine is strictly dominated by Still's rules.

---

## 2. Scope by version

| Version | What it may do | What it may **not** do |
|---|---|---|
| **v1 — Enforcer / semi-auto** | Attach & tighten broker-side stops · close or partial-close · flatten + lock the account on a daily-loss / tilt breach · **propose** a single pre-approved setup that he taps to confirm within 60 s, then it manages the exit | Open any position he did not just approve · size beyond the fixed envelope · run more than one position |
| **v2 — Constrained autopilot (later, maybe)** | Execute *only* a setup class Still already teaches, at Still's fixed size, once per session, with "no valid setup" as the default output | Discretion, strategy selection, size/frequency knobs, martingale/averaging |

Full unattended autonomy on day one is off the table. Both reviewers said v1 =
semi-auto; v2 is the ceiling, not the start.

---

## 3. The mastery gate (built — `src/lib/still/mastery.ts`)

Motions stays dark until Still is **mastered**. Mastery is measured from **real
trade data, never self-report** — a man who lies to himself cannot be gated on
his own journaling. Today the data is his in-app log; when Motions is wired to a
broker, the *same* `masteryReport()` scores the **read-only broker statement**
unchanged.

**Discipline Score (0–1):**

```
DS = 0.40·adherence + 0.20·tiltAvoidance + 0.20·drawdownRespect + 0.20·breachCompliance
```

- **adherence** — trades that followed every rule, sized within cap, calm, not a post-loss trade.
- **tiltAvoidance** — 1 − (revenge / post-loss trades ÷ all trades).
- **drawdownRespect** — `clamp(1 − maxDrawdown / cap, 0, 1)` (cap = 10 % of peak).
- **breachCompliance** — 1 − (hard breaches ÷ all trades). A hard breach = oversize, revenge, or trading after a loss.

**Hard prerequisites (ALL must hold — time alone unlocks nothing):**

- ≥ **100** counted trades (a trade counts only if it risked ≥ 0.1 % of capital — no micro-lot farming)
- ≥ **90 days** of history **and** ≥ **8 distinct calendar weeks** (anti-cramming)
- **Zero hard breaches in the trailing 60 days** — any breach **resets progress**
- **Non-negative expectancy** (top 1 % of wins winsorized, so one lucky candle can't buy the gate)
- **DS ≥ 0.92**

`unlocked = every prerequisite met`. **Any breach after unlock → instant re-lock
+ cooldown; the gate must be re-earned.** The UI shows an honest, monotonic
`progressPct` so he can see how close he is — and see a breach set him back.

Why gate on *discipline* and not *profit*: requiring profitability gates on luck,
not behavior. We require he doesn't **lose** on expectation, and that he **obeys
the rules** — that is the thing that transfers to an autopilot.

---

## 4. Trading architecture

**Venue.** OANDA v20 does not onboard Nepal; regulated prop-firm APIs ban
third-party automation. The realistic path for a retail Nepali user is **MT5 at
the offshore broker he already uses** (e.g. Exness / XM / Octa), driven either by:

- an **Expert Advisor (EA)** on a cheap ($5/mo) Singapore/Frankfurt **VPS**, or
- a cloud **MT5 bridge (MetaApi)**.

Prefer **cTrader Open API** if his broker offers it (cleaner), else MT5.

**Where the limits live — non-negotiable.** Every hard cap lives **broker-side,
in the EA / on the order**, *not* in our server. If our control plane dies, the
caps still hold and open positions still have stops.

```
 ┌────────────┐  signed config blob   ┌──────────────┐   orders + stops   ┌────────┐
 │  Control   │ ───────────────────▶  │  EA / MetaApi │ ─────────────────▶ │ Broker │
 │  plane     │ ◀─────────────────    │  (VPS/cloud)  │ ◀───────────────── │  (MT5) │
 │ (advisory, │      telemetry        │  ENFORCES     │      fills          └────────┘
 │  config)   │                       │  caps locally │
 └────────────┘                       └──────────────┘
        ▲                                    ▲
        │ monitor + KILL only                │ broker-side SL on every order
   ┌─────────┐
   │ Phone   │  (never trades from the phone)
   └─────────┘
```

- **Control plane / server:** advisory only — pushes a *signed* config blob (the
  envelope), collects telemetry, serves the dashboard. It cannot itself place a
  trade.
- **EA / bridge:** the only thing that touches the account. Enforces every cap
  locally. Attaches a broker-side stop **at order submission** — never a
  mental/server-managed stop.
- **Client app:** display + a single **kill button**. Never an order origin.

**Envelope (immutable, no user knobs):**

- **1 open position, ever.**
- Risk **0.25–0.5 %** of equity per trade.
- Stop = **1.5 × ATR(14, H1)**, attached at submission.
- **2 consecutive losses → session lock.**
- **−2 to −3 % day → flat + account lock;** **−5 to −6 % week → lock the week** (manual re-arm).
- **News blackout ±30 min** around high-impact USD/gold events (NFP, CPI, FOMC); whole-day stand-down on NFP/FOMC.
- **London / NY hours only;** no entries in the first/last 5 min of a session.
- **Max slippage ~10 pips or cancel.**
- **Only the setup classes Still already teaches** (e.g. trend pullback). "No valid setup" is the **default** output.

**Kill-switch.** The EA polls a **signed halt token**; a *missing* heartbeat means
**no new entries** — but do **not** auto-flatten on heartbeat loss (that is a fresh
way to lose money; the attached broker-side stop is the backstop). A master kill
must also be reachable when the app is down (SMS / a hosted page) and can revoke
the API key.

---

## 5. Failure modes (disclose in writing)

- Gold **gaps through the stop** on a flash move / weekend gap → realized loss can exceed planned risk.
- **API / VPS outage** with a position open → the broker-side stop is the only thing that saves you.
- **Slippage / requotes** on news spikes.
- **Swap/carry bleed** on held longs.
- **Broker-side stop hunting.**

The single design invariant that survives all of these: **a broker-side stop on
every order, placed at submission.** Everything else is convenience; that is
safety.

---

## 6. Safety, legal, ethics — read this before writing any code

> ⚠️ **BLOCKER — get a lawyer's read first.** Both reviewers independently
> flagged that **retail forex / CFD / margin trading by Nepal residents is
> prohibited under Nepal Rastra Bank (NRB) foreign-exchange rules.** He is
> presumably already trading offshore, which is his own decision — but shipping
> him **purpose-built auto-execution software** is a materially different, higher
> exposure than a journaling app. Separately, in many jurisdictions *selling*
> automated trade execution can trigger investment-adviser / CTA-type
> registration. **Disclaimers do not cure either issue.**

Non-negotiables regardless of the legal outcome:

- **Never custody his funds.** His broker, his account, his API token.
- Credentials scoped **trade-only, withdrawal-disabled**, stored encrypted; keep a separate read-only credential for the mastery scoring.
- **Master kill-switch** that halts entries and can revoke the API key, reachable even when the app is down.
- **Irresponsible to ship:** server-side-only limits · no attached stop · full autonomy on day one · performance marketing · sold publicly to a known blow-up risk.
- **Responsible to ship:** personal-use software · one account · caps enforced broker-side · a hard kill · and it can only ever *reduce* exposure.

---

## 7. Business

- The **"earn it by mastering Still"** gate is good psychology and a great story
  ("the app you can't buy") — and it is *real protection* only because it is
  verified against broker data.
- It is **bad economics as a paid product**: the people who would pay for an
  autopilot are exactly the ones who never unlock it. For one user this is a
  **feature, not a business.**
- **Monetize Still**, not Motions: a flat sub (≈ $5–25/mo), or free for Aakash.
  Make Motions a **free unlockable guardrail / top tier.**
- **Never performance fees.** They are misaligned and a regulatory magnet — and,
  the sharpest point from the review: *the moment you charge for the autopilot,
  you have financially incentivized yourself to loosen the gate — the exact
  corruption Still exists to prevent.*

---

## 8. Build order (when/if unblocked)

1. ✅ **Mastery gate scoring + UI** — done, in Still now (`mastery.ts` + the Mastery card). Useful on its own.
2. **Legal read** on the NRB / adviser-registration questions. **Gate.**
3. **Read-only broker connection** → score mastery from the real statement (replace the in-app-log input, same function).
4. **v1 Enforcer** — EA/MetaApi that can only attach stops, close, flatten, and lock; broker-side caps; kill-switch; dashboard = monitor + kill.
5. **Semi-auto** — propose one pre-approved setup, 60-s human confirm, then manage.
6. **(Ceiling) v2 constrained autopilot** — only after v1 has run clean on Aakash's account for a long, boring stretch.

---

*Sources: independent design reviews by Opus 5 and Fable 5, 2026-08-18. The
mastery gate in §3 is implemented; everything else is design pending the §6 legal
gate.*
