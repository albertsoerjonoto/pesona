-- Create skin-photos storage bucket with per-user RLS
-- Users can only upload/read photos in their own folder: skin-photos/{user_id}/*

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'skin-photos',
  'skin-photos',
  false,
  20971520, -- 20MB max (matches client-side MAX_FILE_SIZE)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Upload policy: users can upload to their own folder
DO $$ BEGIN
CREATE POLICY "Users upload own skin photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'skin-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Read policy: users can read their own photos
DO $$ BEGIN
CREATE POLICY "Users read own skin photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'skin-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Update policy: users can update their own photos
DO $$ BEGIN
CREATE POLICY "Users update own skin photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'skin-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Delete policy: users can delete their own photos
DO $$ BEGIN
CREATE POLICY "Users delete own skin photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'skin-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
