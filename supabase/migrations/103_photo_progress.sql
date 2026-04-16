CREATE TABLE public.photo_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_type text CHECK (photo_type IN ('skin_face_front', 'skin_face_left', 'skin_face_right', 'body_front', 'body_side')) DEFAULT 'skin_face_front',
  ai_analysis jsonb,
  notes text,
  taken_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.photo_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own photos" ON public.photo_progress FOR ALL USING (auth.uid() = user_id);
