# Pesona.io QA Report

**Branch:** `claude/exciting-franklin`
**Date:** 2026-04-17
**Scope:** Quality polish — tests, i18n, a11y, TypeScript, visual QA

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

- `npm run build`: Pass (all routes compile)
- `npx tsc --noEmit`: **0 errors** (was 45 — fixed vitest globals types)
- No console errors in browser

## i18n Coverage

- **Total keys:** 720+ (id + en for every key)
- **Landing page:** Fully converted from hardcoded to `t()` (60+ new keys)
- **Chat page:** Welcome message, capabilities, routine labels converted
- **Products page:** Title, search placeholder, results count, modal labels converted
- **Dashboard:** "Belum ada profil kulit" hardcoded string fixed
- **Remaining hardcoded:** Products category/skin filter labels (Semua, Cleanser etc.) — these are universal terms used in both languages

## Accessibility

- Landing page: **0 axe violations** (jest-axe automated)
- Added `role="banner"` to landing header, `role="contentinfo"` to footer
- Added `aria-label` to:
  - Chat textarea, send button
  - Product search input, modal close button
  - Photo upload file input
- Focus-visible styles present via Tailwind defaults

## Visual QA (Browser)

### Landing Page
- **Mobile (375px):** Hero, features, pricing, FAQ, footer all render correctly
- **Light mode:** Clean layout, proper contrast, pink accent visible
- **Dark mode:** Good contrast, gradient text visible, icon colors correct
- **No overflow issues at 375px**

### Auth Pages
- Login: ID/EN toggle, email + Google buttons, correct Bahasa text
- Signup: Mirror of login with "Daftar" instead of "Masuk"

### Protected Pages (require auth)
- Dashboard, Chat, Products, Log, Progress: All redirect to login when unauthenticated (correct behavior)

## Issues Found & Fixed

1. **45 TypeScript errors** — vitest globals not typed → added `types: ["vitest/globals"]` to tsconfig
2. **30+ hardcoded Indonesian strings** in landing page → converted to i18n `t()` calls
3. **Hardcoded welcome text** in chat page → converted to i18n
4. **Hardcoded labels** in products page (title, search, results count, modal) → converted
5. **Duplicate i18n key** (`chat.placeholder` defined twice) → removed duplicate
6. **Missing localStorage polyfill** in test env → added to setup.ts
7. **Missing scrollIntoView mock** → added Element.prototype mock
8. **No ARIA labels** on interactive elements → added to key inputs/buttons

## Known Remaining Items

- [ ] Products page filter labels still hardcoded (universal terms)
- [ ] Dashboard skin tips are hardcoded arrays (not user-facing i18n priority)
- [ ] Legacy Rajin types tagged but not removed (waiting for full migration)
- [ ] Legacy API routes (friends, shared-habits, parse, transcribe) still exist
- [ ] No Playwright E2E tests yet (would require auth flow setup)
- [ ] No visual regression snapshots yet
