# Bundle Size Report

Recorded: 2026-04-17 (follow-up PR)

## Summary

| Metric | Value | Status |
|--------|-------|--------|
| Total static chunks | 1.4 MB | ✓ |
| Largest client chunk | 220 KB raw / ~75 KB gzip | ✓ |
| Total chunks | 37 | ✓ |
| Build time | ~4s (Turbopack) | ✓ |

## Top client chunks

| Size (raw) | Likely contents |
|-----------|-----------------|
| 220 KB | React + Next.js runtime |
| 204 KB | App shell + Supabase client |
| 176 KB | Sentry client SDK (replay integration) |
| 112 KB | PostHog client |
| 112 KB | shadcn UI primitives |
| 44 KB | Coach chat page |
| 40 KB | Dashboard |
| <40 KB | Other route chunks |

## Per-route server output

| Route group | Size |
|-------------|------|
| `(app)` (authenticated) | 760 KB |
| `api/` | 596 KB |
| `(auth)` (login/signup) | 120 KB |
| `(onboarding)` | 60 KB |
| `admin`, `offline`, each static page | ~30-60 KB |

## Decisions

- **PaywallModal** is dynamic-imported — only pulled when user opens it.
- **ReferralCard** is dynamic-imported — only loaded on profile page mount.
- **Sentry replay integration** is the largest single dependency at 176 KB.
  Sampled at 10% sessions / 100% errors — acceptable cost for the observability payoff.
- **PostHog** at 112 KB is the second largest. Not lazy-loaded because we need
  pageview tracking from first paint.

## How to re-run

```bash
ANALYZE=true npm run build
```

Note: `@next/bundle-analyzer` only emits HTML when using the webpack builder.
Turbopack (the default in Next 16) doesn't emit the analysis. For the visual
treemap, pass `--no-turbopack` to `next build`.
