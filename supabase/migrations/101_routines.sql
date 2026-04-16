CREATE TABLE IF NOT EXISTS public.routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('morning', 'evening')),
  steps jsonb NOT NULL DEFAULT '[]',
  generated_by text CHECK (generated_by IN ('ai', 'manual')) DEFAULT 'ai',
  active boolean DEFAULT true,
  ai_reasoning text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users can manage own routines" ON public.routines FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.routine_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id uuid REFERENCES public.routines(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('morning', 'evening')),
  date date NOT NULL,
  completed_steps jsonb DEFAULT '[]',
  completed boolean DEFAULT false,
  completion_percentage integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type, date)
);
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users can manage own routine logs" ON public.routine_logs FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
