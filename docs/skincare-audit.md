# Pesona Skincare Codebase Audit

**Date:** 2026-04-17
**Branch:** claude/nostalgic-kilby
**Auditor:** Claude Code (automated)

## What Exists

### Database (supabase/migrations/)
- **001-021**: Legacy Rajin tables (profiles, habits, food_logs, friends, etc.)
- **100**: `skin_profiles` — skin type, concerns, goals, budget, hijab, quiz answers
- **101**: `routines` + `routine_logs` — morning/evening skincare steps + daily completion
- **102**: `products` — full catalog schema (BPOM, halal, skin types, concerns, ingredients)
- **103**: `photo_progress` — photo URLs, AI analysis JSON, photo type
- **104**: `daily_checkins` — morning/evening done, skin feeling, streak
- **105**: `ai_conversations` — chat history with role/content/metadata
- **106**: Product seed data — 155 real Indonesian skincare products

### API Routes
- `/api/coach` — Gemini 2.5 Flash coach (POST), builds user context, validates response
- `/api/delete-account` — GDPR account deletion
- `/api/parse`, `/api/transcribe` — Legacy (unused)
- `/api/friends/*` — Legacy social (disabled)

### Pages
- `/dashboard` — Greeting, skin profile card, today's routines, daily check-in, streak, tips
- `/chat` — AI coach Sona with message history, quick actions, product/routine rendering
- `/log` — Morning/evening routine step checkboxes, progress bar, completion celebration
- `/friends` — Photo progress grid with upload, modal detail view
- `/products` — Searchable product catalog with filters, detail modals
- `/profile` — User settings (legacy body stats focused)
- `/onboarding` — 9-step wizard (name, gender, DOB, height/weight, skin type, concerns, goals, budget, hijab)

### Components
- Toast, ConfirmDialog, LoadingSkeleton, MarkdownContent
- Tour system (TourProvider, TourOverlay, TourBubble)
- Analytics charts (legacy Rajin — calorie, macro, exercise, weight, water, habit)

### Lib
- `types.ts` — Full skincare types (SkinProfile, Routine, Product, PhotoProgress, etc.)
- `image.ts` — compressAvatar (256x256 WebP) + compressChatImage (800px JPEG)
- `supabase/client.ts` + `server.ts` — Browser/server Supabase clients
- `i18n/translations.ts` — 600+ keys in ID/EN
- `validation.ts`, `utils.ts`, `streaks.ts`

### Tests (15 passing)
- `skin-types.test.ts` — Type enum validation
- `coach-response-validation.test.ts` — Coach API JSON parsing

## What's Missing (Tasks to Build)

| # | Feature | Status |
|---|---------|--------|
| 1 | Storage bucket `skin-photos` with per-user RLS | Missing — no migration 107 |
| 2 | PhotoUpload component (camera, compress, progress bar) | Missing — /friends uses basic upload |
| 3 | Gemini Vision analysis API (`/api/analyze-photo`) | Missing — no vision endpoint |
| 4 | Photo AI analysis wired into flow + detail view | Missing |
| 5 | Before/after photo comparison slider | Missing |
| 6 | Weekly report API (`/api/weekly-report`) | Missing |
| 7 | Weekly report UI with charts | Missing |
| 8 | Chat → product DB fuzzy matching | Missing — chat doesn't query products table |
| 9 | Save routine from chat ("Pakai Routine Ini") | Missing |
| 10 | Routine celebration confetti + streak update | Partial — basic celebration exists |
| 11 | Calendar history on /log (30-day grid) | Missing |
| 12 | Onboarding photo step 9 | Missing — step 8 is last (hijab) |
| 13 | Dashboard skin score + upload CTA | Partial — needs score display |
| 14 | Ingredient glossary page | Missing |
| 15 | Streak milestones (3/7/14/30/60/90) | Missing |
| 16 | Product search API with pagination | Missing — client-side only |
| 17 | Coach Gemini function calling (tools) | Missing |
| 18 | Coach memory compression | Missing |
| 19 | Full test coverage | 15 tests, needs expansion |

## Architecture Notes

- **AI**: Google Gemini 2.5 Flash (not Claude) for coach chat
- **Auth**: Supabase email/password, middleware protects (app)/* routes
- **Storage**: Supabase Storage with per-user paths
- **Styling**: Tailwind CSS v4, Bossy Pink #CE3D66 primary
- **i18n**: Full ID/EN support
- **Mobile-first**: Bottom tab nav, dvh viewport, iOS PWA safe
