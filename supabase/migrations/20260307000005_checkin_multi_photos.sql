-- Add photo_urls array to checkins for multiple photo support
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}';

-- Backfill existing rows that have a photo_url
UPDATE checkins SET photo_urls = ARRAY[photo_url] WHERE photo_url IS NOT NULL AND photo_urls = '{}';
