# Pesona.io

AI-native personal beauty & body coach for Indonesia. Handles skincare routines, weight management, body recomposition, and appearance improvement — powered by Gemini as the AI coach.

## Tech Stack
- Next.js 15 + TypeScript
- Supabase (auth, Postgres, storage)
- Google Gemini 2.5 Flash (main AI coach, chat, skin analysis via vision)
- Tailwind CSS
- Deployed on Vercel at pesona.io

## Product Positioning
Wellness & coaching product (NOT medical/telehealth). Strictly in the wellness lane — no diagnosis, no prescription, no clinical terms. The AI coach uses casual Bahasa Indonesia and refers users to dermatologists for anything medical.

## Key Entities
- skin_profiles: user skin type, concerns, quiz answers
- routines: morning/evening skincare routines with product recommendations
- photo_progress: timestamped skin/body photos (Supabase Storage with RLS)
- ai_conversations: chat history with the Gemini AI coach
- products: Indonesian skincare product database with affiliate links

## Brand Voice
Warm, Bahasa Indonesia native, like a knowledgeable best friend who helps you become the most attractive version of yourself. Uses casual language (kulit kusam, berjerawat, berminyak). Never uses clinical/medical terms. Knows Indonesian products (Skintific, Somethinc, Wardah, Glad2Glow, Kahf). Understands hijab, halal, tropical climate, Ramadan.

## Current Phase
Phase 1 MVP — skincare-first, targeting Indonesian women. Body/fitness modules come later.

## Pricing
Schema supports 4 tiers (Free / Plus / Pro / Elite). UI currently shows 2 paid.
- Free — `Pesona Coba`: 3 chats/day, 1 photo/week, read-only weekly report preview
- Rp 59,000/month — `Pesona Plus`: unlimited chat, 3 photos/day, full weekly report
- Rp 179,000/month — `Pesona Pro`: everything Plus + advanced analysis + priority
- Rp 499,000/month — `Pesona Glow`: everything Pro + dermatologist video consult

## App Navigation (Bottom Tabs)
1. **Home** (`/dashboard`) — Skin profile summary, today's routine, tips
2. **Routine** (`/log`) — Skincare routine log & tracking
3. **Coach** (`/chat`) — AI beauty coach (Gemini-powered)
4. **Progress** (`/friends`) — Photo progress tracking (repurposed route)
5. **Profile** (`/profile`) — Account settings, subscription (Langganan), preferences

### Other routes
- `/terms`, `/privacy` — Bahasa legal pages (UU PDP 27/2022), public
- `/subscription/checkout`, `/subscription/success`, `/subscription/failed` — Midtrans flow
- `/admin?secret=$ADMIN_SECRET` — internal metrics dashboard
- `/offline` — service worker fallback page

## Commands
- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Production build
- `npm run lint` — Lint code

## Environment Variables
Core:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` — LLM for coach chat, vision analysis, routine generator, weekly report summary

Payments (Midtrans):
- `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`

Analytics & monitoring:
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

WhatsApp (Wati), admin, cron:
- `WATI_API_KEY`, `WATI_API_URL`
- `ADMIN_SECRET` — required to access `/admin`
- `CRON_SECRET` — required for Vercel cron routes

App:
- `NEXT_PUBLIC_APP_URL` — e.g. `https://pesona.io`

See `docs/infra.md` for full setup.

## Conventions
- Use `'use client'` only when component needs browser APIs or hooks
- Prefer Supabase server client in Server Components, browser client in Client Components
- All database queries go through RLS — never use service_role key in client code
- Tailwind only — no inline styles, no CSS modules
- Mobile-first: design for 375px base, then scale up
- Use `dvh` not `vh` for full-height layouts (iOS Safari fix)
