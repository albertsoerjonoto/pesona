# Pesona Infrastructure Documentation

## Environment Variables

### Required

| Variable | Description | Where |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Server only |
| `GEMINI_API_KEY` | Google Gemini API key | Server only |

### Payments (Midtrans)

| Variable | Description |
|----------|-------------|
| `MIDTRANS_SERVER_KEY` | Midtrans server key (sandbox or production) |
| `MIDTRANS_CLIENT_KEY` | Midtrans client key |
| `MIDTRANS_IS_PRODUCTION` | `true` for production, omit for sandbox |

### Analytics & Monitoring

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog instance host |
| `SENTRY_DSN` | Sentry DSN (server-side) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (client-side) |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps |

### WhatsApp (Wati)

| Variable | Description |
|----------|-------------|
| `WATI_API_KEY` | Wati API key |
| `WATI_API_URL` | Wati API base URL |

### Admin

| Variable | Description |
|----------|-------------|
| `ADMIN_SECRET` | Secret for /admin access |
| `CRON_SECRET` | Vercel cron job authorization |

### App

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | App URL (https://pesona.io) |
| `ANTHROPIC_API_KEY` | Reserved for future use |

---

## Webhooks

### Midtrans Payment Webhook

- **URL:** `https://pesona.io/api/webhooks/midtrans`
- **Method:** POST
- **Auth:** Signature verification (SHA512 of order_id + status_code + gross_amount + server_key)
- **Idempotent:** Yes, by order_id. Re-processing a settled order is a no-op.
- **Setup:** Configure in Midtrans Dashboard → Settings → Configuration → Payment Notification URL

**Handled statuses:**
- `settlement` / `capture` → activate subscription
- `deny` / `cancel` / `expire` → mark as failed
- `pending` → no change

### Wati WhatsApp Webhook

- **URL:** `https://pesona.io/api/webhooks/wati` (scaffold)
- **Setup:** Configure in Wati Dashboard → Webhooks

---

## Cron Jobs (Vercel)

Configured in `vercel.json`. All use UTC times.

| Route | Schedule (UTC) | WIB | Purpose |
|-------|---------------|-----|---------|
| `/api/cron/morning-nudge` | `0 0 * * *` | 07:00 | Queue morning routine nudges |
| `/api/cron/evening-nudge` | `0 14 * * *` | 21:00 | Queue evening routine nudges |
| `/api/cron/weekly-checkin` | `0 12 * * 0` | 19:00 Sun | Queue weekly check-in nudges |

All cron routes require `Authorization: Bearer $CRON_SECRET` header.

---

## Subscription Tiers

| Tier | Bahasa Name | Price/mo | Chat/day | Photo/day | Weekly Report |
|------|-------------|----------|----------|-----------|---------------|
| free | Pesona Coba | Rp 0 | 3 | 1 | Preview only |
| plus | Pesona Plus | Rp 59,000 | Unlimited | 3 | Full |
| pro | Pesona Pro | Rp 179,000 | Unlimited | Unlimited | Full + advanced |
| elite | Pesona Glow | Rp 499,000 | Unlimited | Unlimited | Full + advanced |

Annual plans: 10x monthly (2 months free).

---

## Rate Limiting

Supabase-backed, counts daily usage per user:
- **Chat:** Count `ai_messages` where role=user, created today (WIB)
- **Photo/Vision:** Count `photo_progress` created today (WIB)

Limits reset at midnight WIB (UTC+7).

---

## Security Headers

Applied via `next.config.ts`:
- `Content-Security-Policy` — default-src self, scripts from self + PostHog + Sentry
- `Strict-Transport-Security` — max-age=31536000; includeSubDomains
- `X-Frame-Options` — DENY
- `X-Content-Type-Options` — nosniff
- `Referrer-Policy` — strict-origin-when-cross-origin
- `Permissions-Policy` — camera=(self), microphone=()

---

## PWA

- **Manifest:** `public/manifest.json`
- **Service Worker:** `public/sw.js`
  - Static assets: stale-while-revalidate
  - Pages: network-first with cache fallback
  - Offline: inline Bahasa offline page
- **Theme:** #CE3D66 (Pesona rose)
- **Icons:** 192px, 512px (+ maskable)

---

## Setup for New Developer

1. Clone repo, checkout branch
2. Copy `.env.local.example` to `.env.local`, fill values
3. `npm install`
4. Run Supabase migrations: `npx supabase db push`
5. `npm run dev`
6. Configure Midtrans sandbox webhook URL to your tunnel/ngrok URL
7. Register Wati templates per `docs/wati-templates.md`
