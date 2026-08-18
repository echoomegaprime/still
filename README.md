# Still

Gold-only desk. When you lose, you stop.

This is not a trading bot. It does not click. It locks the next trade after a loss, sizes from the true book, and speaks Nepali (Roman) or English.

**Live:** https://still-coral-theta.vercel.app

Installable — open it on your phone and **Add to Home Screen** to run it full-screen, like a native app.

Harauda, timi rok.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:8080
```

## Deploy

Deployed on **Vercel** (server runtime): the desk state lives client-side, while
the gold price, the PWA manifest/head, and Better Auth run in the serverless
function. Build locally with `npx vite build` (nitro's default `vercel` preset)
and ship with `vercel deploy --prebuilt --prod`. Set `DATABASE_URL` (Neon) to
move persistence off the per-instance PGLite fallback onto a durable Postgres.
