# Pesona Skincare Features — Data Flow Documentation

## Architecture Overview

```
User (Mobile PWA)
     |
     v
Next.js 16 App Router
     |
     +--> Supabase Auth (email/password)
     |
     +--> API Routes (/api/*)
     |       |
     |       +--> Gemini 2.5 Flash (AI Coach "Sona")
     |       |     - Coach chat (/api/coach)
     |       |     - Photo analysis (/api/analyze-photo)
     |       |     - Weekly reports (/api/weekly-report)
     |       |
     |       +--> Supabase Postgres (RLS)
     |             - skin_profiles, routines, routine_logs
     |             - products (155 seeded), photo_progress
     |             - daily_checkins, ai_conversations
     |             - coach_memory
     |
     +--> Supabase Storage
             - skin-photos bucket (per-user RLS)
```

## Feature Map

### 1. Photo Upload & Analysis
**Flow:** Upload → Compress → Storage → DB → Gemini Vision → Scores

```
User taps 📸
  → PhotoUpload component captures image (camera or gallery)
  → compressSkinPhoto() shrinks to <500KB JPEG
  → Upload to Supabase Storage: skin-photos/{user_id}/{timestamp}.jpg
  → Insert photo_progress record with photo_url
  → POST /api/analyze-photo with photoId + photoUrl
  → Gemini 2.5 Flash analyzes image (non-clinical vocabulary enforced)
  → Returns: overall_score, brightness, texture, hydration, concerns
  → Saves analysis JSON to photo_progress.ai_analysis
  → UI shows score bars + concern badges in detail modal
```

**Files:**
- `src/components/PhotoUpload.tsx` — Upload component with progress bar
- `src/lib/image.ts` — `compressSkinPhoto()` compression
- `src/app/api/analyze-photo/route.ts` — Gemini vision endpoint
- `src/app/(app)/friends/page.tsx` — Progress page with grid + detail modal

### 2. Before/After Comparison
**Flow:** Select 2 photos → Draggable slider → Analysis deltas

```
User selects "before" and "after" photos
  → PhotoCompare renders both images overlaid
  → Draggable slider reveals before/after by clip-path
  → If both have AI analysis, shows score deltas:
    brightness Δ, texture Δ, hydration Δ, overall Δ
```

**Files:**
- `src/components/PhotoCompare.tsx` — Slider comparison + analysis deltas

### 3. AI Coach ("Sona") Chat
**Flow:** Message → Context Build → Gemini → Validate → Save → Render

```
User types message in chat
  → POST /api/coach
  → Fetch in parallel:
    profiles, skin_profiles, routines, checkins,
    last 10 messages, 3 memory summaries
  → Build context string with all user data
  → Send to Gemini 2.5 Flash with system prompt
  → Parse JSON response: message, routine_suggestion,
    product_recommendations, daily_tip
  → Save both user + assistant messages to ai_conversations
  → Trigger memory compression if message_count % 20 == 0
  → Return parsed response to UI
  → Chat renders: message bubble + product cards + routine steps
  → "Pakai Routine Ini" button saves routine to DB → redirects to /log
```

**Files:**
- `src/app/api/coach/route.ts` — Coach API with memory compression
- `src/app/(app)/chat/page.tsx` — Chat UI with save routine

### 4. Coach Memory Compression
**Flow:** Every 20 messages → Summarize → Store → Load as context

```
After saving assistant message:
  → Check total message count
  → If count % 20 == 0:
    → Fetch uncompressed messages since last memory
    → Send to Gemini: "Summarize this skincare conversation"
    → Save summary to coach_memory table
  → On next chat:
    → Load 3 latest summaries + 10 recent messages
    → Include summaries in context for Gemini
```

**Files:**
- `supabase/migrations/108_coach_memory.sql` — Memory table
- `src/app/api/coach/route.ts` — `compressMemory()` function

### 5. Weekly Report
**Flow:** Fetch 7-day data → Calculate metrics → Gemini summary

```
GET /api/weekly-report
  → Fetch last 7 days: photos, checkins, routine_logs, skin_profile
  → Calculate: check-in count, routine completion rate,
    skin feelings distribution, score deltas
  → Send aggregated data to Gemini for Bahasa summary
  → Return: period, metrics, score_changes, ai_report

/reports page displays:
  → Metrics grid (check-ins, completion rate, morning/evening)
  → Skin feelings emoji distribution
  → Score change cards with delta badges (+/-)
  → AI summary with highlights and improvement areas
```

**Files:**
- `src/app/api/weekly-report/route.ts` — Report API
- `src/app/(app)/reports/page.tsx` — Report UI

### 6. Routine Tracking
**Flow:** View steps → Toggle checkboxes → Track completion → Calendar

```
/log page:
  → Morning/Evening tab toggle (auto-selects based on time)
  → Fetch active routines + today's logs
  → Render step cards with checkboxes
  → Toggle → upsert routine_logs (completed_steps[], percentage)
  → When all done → celebration 🎉 → update daily_checkins
  → 30-day calendar grid shows history:
    green = both routines done, semi = one done, gray = missed
```

**Files:**
- `src/app/(app)/log/page.tsx` — Routine log with calendar

### 7. Product Catalog & Search
**Flow:** Client-side browse + server-side search API

```
/products page:
  → Loads all 155 products from Supabase
  → Client-side filters: category, skin type, search
  → Click product → detail modal with badges

/api/products/search (server):
  → GET with query params: q, category, skin_type, concern
  → Paginated (page, limit) with fuzzy match on name/brand
  → Returns products + total count + hasMore
```

**Files:**
- `src/app/(app)/products/page.tsx` — Product catalog
- `src/app/api/products/search/route.ts` — Search API

### 8. Ingredient Glossary
**Flow:** Static data → Search + filter → Expandable cards

```
/ingredients page:
  → 15 hardcoded Indonesian skincare ingredients
  → Search by name (English or Bahasa)
  → Filter by category (Brightening, Hydration, etc.)
  → Click to expand: description, benefits, skin types, caution
```

**Files:**
- `src/app/(app)/ingredients/page.tsx` — Glossary page

### 9. Dashboard
**Flow:** Parallel fetch → Skin score + routines + check-in + CTA

```
/dashboard:
  → Fetch: profile, skin_profile, routines, logs, checkins,
    latest photo analysis, streak count
  → Display: greeting with streak 🔥
  → Skin score ring (from latest AI analysis)
  → Weekly photo upload CTA (if >7 days since last)
  → Today's routine progress bars
  → Daily check-in emoji selector (5 feelings)
  → Tip of the day (rotates by skin type)
```

**Files:**
- `src/app/(app)/dashboard/page.tsx` — Dashboard page

## Database Tables (Pesona-specific)

| Table | Migration | Purpose |
|-------|-----------|---------|
| skin_profiles | 100 | User skin type, concerns, quiz |
| routines | 101 | Morning/evening routine steps |
| routine_logs | 101 | Daily completion tracking |
| products | 102+106 | 155 seeded Indonesian products |
| photo_progress | 103 | Photos + AI analysis JSON |
| daily_checkins | 104 | Daily feelings + streak |
| ai_conversations | 105 | Chat history |
| coach_memory | 108 | Compressed conversation summaries |

## Storage Buckets

| Bucket | Migration | Access |
|--------|-----------|--------|
| skin-photos | 107 | Per-user RLS (upload/read/delete) |

## Test Coverage (42 tests)

| File | Tests | Coverage |
|------|-------|----------|
| skin-types.test.ts | 5 | Type enum validation |
| coach-response-validation.test.ts | 9 | Coach JSON parsing |
| photo-analysis.test.ts | 10 | Clinical term filter, score normalization |
| ingredients.test.ts | 12 | Data validation, search filtering |
| weekly-report.test.ts | 6 | Metrics calculation, score deltas |

## Non-Clinical Vocabulary (enforced)

All AI outputs are filtered against 23 forbidden clinical terms.
Violations trigger re-generation or escalation template.

| Forbidden | Use Instead |
|-----------|-------------|
| rosacea | kulit sensitif yang sering kemerahan |
| melasma | flek hitam di pipi atau dahi |
| dermatitis | reaksi kulit / kulit sensitif |
| acne vulgaris | jerawat / breakout |
| PIH / PIE | bekas jerawat yang menghitam/kemerahan |
| comedones | bruntusan / pori tersumbat |
