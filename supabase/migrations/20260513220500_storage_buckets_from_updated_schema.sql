-- Seed storage bucket rows required by the app.
-- Values are based on the existing `sql/updated_schema.sql` snapshot.

INSERT INTO storage.buckets (
  id,
  name,
  owner,
  created_at,
  updated_at,
  public,
  avif_autodetection,
  file_size_limit,
  allowed_mime_types,
  owner_id,
  type
)
VALUES
  (
    'items',
    'items',
    NULL,
    timezone('utc', now()),
    timezone('utc', now()),
    true,
    false,
    NULL,
    NULL,
    NULL,
    'STANDARD'
  ),
  (
    'profilePictures',
    'profilePictures',
    NULL,
    timezone('utc', now()),
    timezone('utc', now()),
    true,
    false,
    NULL,
    NULL,
    NULL,
    'STANDARD'
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  owner = EXCLUDED.owner,
  owner_id = EXCLUDED.owner_id,
  type = EXCLUDED.type,
  updated_at = EXCLUDED.updated_at;
