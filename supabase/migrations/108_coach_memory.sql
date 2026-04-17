-- Coach memory: compressed conversation summaries
CREATE TABLE IF NOT EXISTS public.coach_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary text NOT NULL,
  message_count integer NOT NULL DEFAULT 0,
  covers_from timestamptz NOT NULL,
  covers_to timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_memory_user ON public.coach_memory (user_id, created_at DESC);

ALTER TABLE public.coach_memory ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can manage own coach memory"
  ON public.coach_memory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
