-- Migration 004: Publication Settings
-- Description: Add global publication settings table

CREATE TABLE IF NOT EXISTS publication_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publications_per_day INTEGER NOT NULL DEFAULT 1,
  publish_days JSONB NOT NULL DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb,
  include_images BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO publication_settings (publications_per_day, publish_days, include_images)
VALUES (1, '["monday","tuesday","wednesday","thursday","friday"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Add column to scheduled_publications for automatic scheduling
ALTER TABLE scheduled_publications 
ADD COLUMN IF NOT EXISTS scheduled_automatically BOOLEAN DEFAULT false;

-- Create index for settings lookup
CREATE INDEX IF NOT EXISTS idx_publication_settings_updated 
ON publication_settings(updated_at DESC);

