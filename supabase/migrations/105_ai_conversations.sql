CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  image_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users can manage own conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS skin_quiz_completed boolean DEFAULT false;
