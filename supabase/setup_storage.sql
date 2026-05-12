-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Creates the property-images storage bucket and its access policies.

-- 1. Create the bucket (public = images are accessible without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760,  -- 10 MB max per file
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload their own images
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- 3. Allow users to update/delete their own images
CREATE POLICY "Users can manage their own images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Allow public read access to all images
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');
