# Lighthouse Report

Recorded: 2026-04-17 (follow-up PR)
Ran against: `npm run start` (production build) on localhost:3000.
Lighthouse version: 13.1.0

## Scores (after fixes)

### `/` (landing)

| Category | Score | Target |
|----------|-------|--------|
| Performance | **92** | ≥85 ✓ |
| Accessibility | **95** | ≥85 ✓ |
| Best Practices | **100** | ≥85 ✓ |
| SEO | **100** | ≥85 ✓ |

### `/terms`

| Category | Score | Target |
|----------|-------|--------|
| Performance | **92** | ≥85 ✓ |
| Accessibility | **90** | ≥85 ✓ |
| Best Practices | **100** | ≥85 ✓ |
| SEO | **100** | ≥85 ✓ |

## Fixes applied in this PR

1. **Viewport now allows zoom** — previously `maximumScale: 1, userScalable: false`
   (blocks screen-magnifier users). Now `maximumScale: 5, userScalable: true`.
   Form-input auto-zoom on iOS is prevented by input font-size ≥16px in globals.css.
2. **`<main>` landmark added** to `/`, `/terms`, `/privacy`, `/offline`. Screen
   readers can jump to main content.
3. Public pages now use semantic `<main>` rather than plain `<div>`.

## Remaining finding (acknowledged, non-blocking)

- **color-contrast** on landing page. Some `text-text-tertiary` (#8E8AA0 on
  #FFFBFC) falls short of 4.5:1 for small text. Design-system level decision
  to defer — would require tweaking `--c-text-tertiary` across the token set.
  Filed as follow-up since the spec target of ≥85 is already met.

## How to re-run

```bash
npm run build && npm run start &
SERVER=$!
npx lighthouse http://localhost:3000/ \
  --output=json --output-path=/tmp/lh.json \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --quiet
kill $SERVER
```
