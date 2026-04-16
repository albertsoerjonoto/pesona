CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  morning_routine_done boolean DEFAULT false,
  evening_routine_done boolean DEFAULT false,
  photo_uploaded boolean DEFAULT false,
  skin_feeling text CHECK (skin_feeling IN ('great', 'good', 'okay', 'bad', 'terrible')),
  notes text,
  streak_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own checkins" ON public.daily_checkins FOR ALL USING (auth.uid() = user_id);
