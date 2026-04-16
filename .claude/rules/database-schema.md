---
description: Database schema reference for Pesona.io Supabase PostgreSQL tables
globs: ["**/*.ts", "**/*.tsx", "supabase/**"]
---

# Database Schema (Supabase PostgreSQL)

> **Note**: These tables are the target schema for Pesona.io. Legacy Rajin tables exist in migration files but will be replaced. Do NOT create new tables until Supabase credentials are configured.

## Pesona Target Tables

### profiles
- id (uuid, references auth.users)
- email, display_name, username, avatar_url
- skin_type (oily/dry/combination/sensitive/normal)
- skin_concerns (text[] — e.g., acne, dark_spots, dullness)
- date_of_birth, gender
- locale (id/en), onboarding_completed
- created_at, updated_at

### skin_profiles
- id (uuid), user_id
- quiz_answers (jsonb — skin quiz responses)
- skin_type, skin_concerns
- sensitivity_level, climate_zone
- created_at, updated_at

### routines
- id (uuid), user_id
- type (morning/evening)
- steps (jsonb[] — ordered array of product + instruction)
- is_active, created_at, updated_at

### photo_progress
- id (uuid), user_id
- photo_url (Supabase Storage path)
- photo_type (face_front/face_left/face_right/body)
- notes, taken_at, created_at

### ai_conversations
- id (uuid), user_id
- role (user/assistant)
- content (text)
- metadata (jsonb — parsed recommendations, product refs)
- created_at

### products
- id (uuid)
- name, brand, category
- description, ingredients
- price_idr, affiliate_url
- bpom_registered (boolean)
- halal_certified (boolean)
- suitable_skin_types (text[])
- created_at

### daily_checkins
- id (uuid), user_id, date
- morning_routine_done (boolean)
- evening_routine_done (boolean)
- photo_taken (boolean)
- notes, created_at

## RLS Rules
- All tables use RLS so users only access their own data
- Products table has public read access
- photo_progress uses Supabase Storage with per-user RLS buckets
