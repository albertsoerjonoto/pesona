# Pesona.io QA Report

**Branch:** `claude/exciting-franklin`
**Date:** 2026-04-17
**Scope:** Quality polish — tests, i18n, a11y, TypeScript, error handling, visual QA

---

## Test Coverage

| Area | Tests | Status |
|------|-------|--------|
| Coach response validation | 13 | Pass |
| Skin types & categories | 5 | Pass |
| Landing page (hero, features, pricing, FAQ, a11y) | 9 | Pass |
| Dashboard (greeting, skin card, routines, check-in) | 8 | Pass |
| Chat (header, welcome, chips, send, response) | 10 | Pass |
| Routine Log (tabs, switching, empty state) | 6 | Pass |
| Products (search, filters, loading, empty, chips) | 9 | Pass |
| Photo Progress (title, upload, empty state) | 6 | Pass |
| i18n completeness (locales, keys, naming) | 15 | Pass |
| **Total** | **76** | **All pass** |

## Build & TypeScript

- `npm run build`: Pass (all routes compile, no warnings)
- `npx tsc --noEmit`: **0 errors** (was 45 — fixed vitest globals types)
- `npm test`: **76/76 pass** across 9 test files
- Zero console errors in browser across all pages

## i18n Coverage

- **Total keys:** 780+ (id + en for every key)
- **Landing page:** Fully converted from hardcoded to `t()` (60+ new keys)
- **Chat page:** Welcome message, capabilities list, routine labels converted
- **Products page:** Title, search placeholder, results count, empty state, modal labels, error state converted
- **Dashboard:** "Belum ada profil kulit" and error state converted
- **Error page (error.tsx):** Converted to i18n Bahasa Indonesia
- **Not Found page (not-found.tsx):** Converted to i18n Bahasa Indonesia
- **Progress page:** All 4 toast messages (upload success/fail, size error) converted to i18n
- **Routine log:** Error state message converted to i18n
- **Verified EN locale:** Landing page renders fully in English when locale switched

## Error Handling (NEW)

| Page | Loading State | Error State | Retry | Before |
|------|:---:|:---:|:---:|---|
| Dashboard | Skeleton shimmer | Error card + retry button | Yes | No try/catch, no loading UI |
| Routine Log | Skeleton shimmer | Error card + retry button | Yes | No try/catch, no loading UI |
| Products | Skeleton shimmer (existing) | Error card + retry button | Yes | No error handling |
| Chat | Loaded flag (existing) | Error message in chat (existing) | — | Already had error handling |
| Progress | Loaded flag (existing) | Toast on upload fail (existing) | — | Had upload error handling |
| Profile | PageSkeleton (existing) | Toast on save fail (existing) | — | Already had save error handling |

## Accessibility

- Landing page: **0 axe violations** (jest-axe automated)
- Added `role="banner"` to landing header, `role="contentinfo"` to footer
- Added `aria-label` to:
  - Chat textarea, send button
  - Product search input, modal close button
  - Photo upload file input
- Focus-visible styles present via Tailwind defaults

## Visual QA (Browser — Verified with Screenshots)

### Landing Page
- **Mobile 375px light:** Hero, badge, gradient text, CTA, features, pricing, FAQ, footer — all correct
- **Mobile 375px dark:** Proper contrast, gradient visible, icon colors correct, no invisible text
- **EN locale:** All text switches correctly — "Become the most attractive version of yourself", "Get Started", "Why Pesona?", "FAQ", pricing features, footer disclaimer
- **No overflow issues** at any viewport

### Auth Pages
- **Login (ID):** "Masuk dengan Email", "Masuk dengan Google", "Belum punya akun? Daftar dong"
- **Login (EN):** "Sign in with Email", "Sign in with Google", "Don't have an account? Sign up"
- **Signup (ID):** "Daftar dengan Email", "Daftar dengan Google", "Sudah punya akun? Masuk"
- **ID/EN toggle** visible and functional on both pages

### Protected Pages (require Supabase auth)
- Dashboard, Chat, Products, Log, Progress, Profile: Middleware redirects to /login when unauthenticated
- When Supabase not configured (dev without credentials): middleware passes through, pages render blank (expected — no user object)

### Console Errors
- **0 errors** across all page navigations
- Only standard React DevTools info and HMR connected logs

## All Issues Found & Fixed

### Pass 1 — Test Infrastructure & i18n
1. **45 TypeScript errors** — vitest globals not typed → added `types: ["vitest/globals"]` to tsconfig
2. **30+ hardcoded Indonesian strings** in landing page → converted to i18n `t()` calls with 60+ new keys
3. **Hardcoded welcome text** in chat page → converted to i18n
4. **Hardcoded labels** in products page → converted to i18n
5. **Duplicate i18n key** (`chat.placeholder` defined twice) → removed duplicate
6. **Missing localStorage polyfill** in test env → added to setup.ts
7. **Missing scrollIntoView mock** → added Element.prototype mock
8. **No ARIA labels** on interactive elements → added to key inputs/buttons

### Pass 2 — Error Handling & States
9. **Dashboard: no error handling** — Promise.all() had no try/catch → added try/catch + loading skeleton + error state with retry
10. **Routine Log: no error handling** — Promise.all() had no try/catch → added try/catch + loading skeleton + error state with retry
11. **Products: no error handling** — product query silently failed → added try/catch + error state with retry
12. **error.tsx: English only** — "Something went wrong" → converted to i18n Bahasa Indonesia
13. **not-found.tsx: English only** — "Page not found" → converted to i18n Bahasa Indonesia
14. **Progress toasts hardcoded** — 4 Indonesian strings → converted to i18n t() calls
15. **Products page hardcoded** — category labels, filter labels, results count, modal text → 15+ new i18n keys

## Known Remaining Items

- [ ] Dashboard skin tips are hardcoded arrays (30 tips in Indonesian — not i18n priority, content is always Indonesian-first)
- [ ] Products QUICK_CHIPS in chat use i18n keys but the text values are in `translations.ts` — correct behavior
- [ ] Legacy Rajin types tagged with "safe to remove" but not deleted (waiting for full migration)
- [ ] Legacy API routes (friends, shared-habits, parse, transcribe) still exist (out of scope per task rules)
- [ ] No Playwright E2E tests (would require Supabase auth flow + test account)
- [ ] No visual regression snapshots (no baseline images yet)
- [ ] Onboarding flow cannot be tested without auth
