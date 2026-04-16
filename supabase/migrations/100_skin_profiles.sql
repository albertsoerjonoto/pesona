CREATE TABLE IF NOT EXISTS public.skin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skin_type text CHECK (skin_type IN ('oily', 'dry', 'combination', 'sensitive', 'normal')),
  concerns text[] DEFAULT '{}',
  skin_goals text[] DEFAULT '{}',
  sensitivity_level text CHECK (sensitivity_level IN ('none', 'mild', 'moderate', 'severe')) DEFAULT 'none',
  hijab_wearer boolean DEFAULT false,
  budget_range text CHECK (budget_range IN ('under_100k', '100k_300k', '300k_500k', 'over_500k')) DEFAULT '100k_300k',
  onboarding_photo_url text,
  ai_skin_analysis jsonb,
  quiz_completed boolean DEFAULT false,
  quiz_answers jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.skin_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users can view own skin profile" ON public.skin_profiles FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert own skin profile" ON public.skin_profiles FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update own skin profile" ON public.skin_profiles FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
