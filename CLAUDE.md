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
- Rp 59,000/month — Basic (skincare routine, AI coach chat, progress photos)
- Rp 99,000/month — Pro (+ body coaching, advanced skin analysis, product deals)

## App Navigation (Bottom Tabs)
1. **Home** (`/dashboard`) — Skin profile summary, today's routine, tips
2. **Routine** (`/log`) — Skincare routine log & tracking
3. **Coach** (`/chat`) — AI beauty coach (Gemini-powered)
4. **Progress** (`/friends`) — Photo progress tracking (repurposed route)
5. **Profile** (`/profile`) — Account settings, preferences

## Commands
- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Production build
- `npm run lint` — Lint code

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)
- `GEMINI_API_KEY` — Google Gemini API key (primary LLM for coach chat)
- `ANTHROPIC_API_KEY` — Anthropic API key (reserved for future background tasks)

## Conventions
- Use `'use client'` only when component needs browser APIs or hooks
- Prefer Supabase server client in Server Components, browser client in Client Components
- All database queries go through RLS — never use service_role key in client code
- Tailwind only — no inline styles, no CSS modules
- Mobile-first: design for 375px base, then scale up
- Use `dvh` not `vh` for full-height layouts (iOS Safari fix)
