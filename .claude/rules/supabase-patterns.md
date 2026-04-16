---
description: Supabase usage patterns, RLS rules, and migration conventions for Pesona.io
globs: ["**/supabase/**", "**/lib/supabase/**", "**/*.sql"]
---

# Supabase Patterns

## Client Usage
- Server Components / Route Handlers → use `createClient()` from `@/lib/supabase/server`
- Client Components → use `createClient()` from `@/lib/supabase/client` (singleton)
- Never use the service_role key in client-side code

## RLS (Row Level Security)
- Every table has RLS enabled
- All policies filter by `auth.uid() = user_id`
- Products table has public read access (no auth required)
- photo_progress uses Storage RLS (per-user bucket paths)
- When creating new tables, always add RLS policies before inserting data

## Migrations
- SQL migrations live in `supabase/migrations/`
- Legacy Rajin migrations (001-021) exist but will be superseded by Pesona schema
- New Pesona migrations should start at 100+ to avoid conflicts
- Always include both the schema change and the RLS policy in the same migration
- Test migrations against the existing schema before applying

## Auth
- Email/password auth
- Google OAuth (configured in Supabase dashboard)
- Apple OAuth (planned, currently disabled)
- Auth state managed via `@/hooks/useAuth`
- Middleware at `src/middleware.ts` protects (app)/* routes

## Storage
- `avatars` bucket — user profile photos
- `skin_photos` bucket (planned) — progress photos with per-user RLS
- Always compress images client-side before upload (see `@/lib/image.ts`)
