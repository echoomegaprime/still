# Motions on Cloudflare

The serverless host for the Motions autopilot — a Cron Trigger + a single Durable
Object driving MetaApi over REST. No VPS. Same decision engine, envelope, and news
calendar as the app and the FORGE daemon (imported from `../src`, one source of truth).

Why a Worker and not a VPS: MetaApi's cloud holds the live MT5 connection, so we
only make stateless REST calls — which fits Workers perfectly. The cron fires once
a minute; that's plenty because Motions runs one conservative position and the stop
lives **broker-side**, protecting against fast moves regardless of tick cadence.

## Three safety-gated states
- **SHADOW** (no creds) — simulate, place nothing.
- **LIVE-DRY** (`METAAPI_TOKEN` + `MT5_ACCOUNT_ID` set, `MOTIONS_ARM` unset) — read the
  real account, decide, **log what it would do, place nothing**.
- **LIVE-ARMED** (`MOTIONS_ARM=1`) — place/close real orders, each with a broker-side stop.

Kill-switch: `POST /kill` (admin-token). `POST /arm` re-arms. Both hit the DO.

## Deploy (Cloudflare account: the authorized new account)
```bash
cd cf-worker
npm i -D wrangler @cloudflare/workers-types
npx wrangler login              # or CLOUDFLARE_API_TOKEN for the new account

# Secrets (never committed):
npx wrangler secret put ADMIN_TOKEN
# --- to go live, also: ---
npx wrangler secret put METAAPI_TOKEN
npx wrangler secret put MT5_ACCOUNT_ID
npx wrangler secret put METAAPI_BASE_URL   # region base, e.g. https://mt-client-api-v1.new-york.agiliumtrade.ai

npx wrangler deploy
```

Deploying with no MetaApi secrets runs it in SHADOW immediately (cron ticks, `/status`
shows it). Add the two MetaApi secrets → LIVE-DRY. Set `MOTIONS_ARM=1` (a `vars` edit
or `wrangler secret put`) → LIVE-ARMED.

## Endpoints
- `GET /health` — mode.
- `GET /status` — account, position, day/week PnL, lock/kill, envelope.
- `POST /kill`, `POST /arm`, `POST /reset` — require header `x-admin-token: <ADMIN_TOKEN>`.

## ⚠ Validate on first token
The MetaApi client REST paths + region base URL (`METAAPI_BASE_URL`) are written per the
current docs but have not been exercised against a live account. On the first real token,
confirm `/account-information`, `/positions`, and `/trade` against the account's region in
LIVE-DRY before setting `MOTIONS_ARM=1`.
