-- ============================================
-- MarketAI SEO Module - Migration 003
-- Description: Add scheduled publications system and WordPress integration fields
-- ============================================

-- ============================================
-- 1. Add WordPress publication fields to drafts table
-- ============================================

ALTER TABLE drafts 
ADD COLUMN IF NOT EXISTS scheduled_publish_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS wordpress_post_id BIGINT,
ADD COLUMN IF NOT EXISTS wordpress_post_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS publish_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS publish_last_error TEXT;

-- Add index for scheduled drafts
CREATE INDEX IF NOT EXISTS idx_drafts_scheduled_publish ON drafts(scheduled_publish_date) 
WHERE scheduled_publish_date IS NOT NULL AND published_at IS NULL;

-- Add index for WordPress post ID lookup
CREATE INDEX IF NOT EXISTS idx_drafts_wordpress_post_id ON drafts(wordpress_post_id) 
WHERE wordpress_post_id IS NOT NULL;

-- ============================================
-- 2. Create scheduled_publications table
-- Description: Manages publication scheduling and execution
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    
    -- Scheduling details
    scheduled_date DATE NOT NULL,
    scheduled_time TIME DEFAULT '09:00:00',
    scheduled_datetime TIMESTAMP GENERATED ALWAYS AS (scheduled_date + scheduled_time) STORED,
    
    -- Publication status
    status VARCHAR(50) DEFAULT 'pending', -- pending, published, failed, cancelled
    
    -- WordPress integration
    wordpress_post_id BIGINT,
    wordpress_post_url VARCHAR(500),
    wordpress_status VARCHAR(50), -- publish, draft, future, private
    
    -- Execution tracking
    published_at TIMESTAMP,
    attempts INT DEFAULT 0,
    last_attempt_at TIMESTAMP,
    last_error TEXT,
    
    -- Metadata
    created_by VARCHAR(100),
    cancelled_by VARCHAR(100),
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_draft_scheduling UNIQUE (draft_id)
);

-- ============================================
-- 3. Create indexes for performance
-- ============================================

-- Index for finding pending publications to execute
CREATE INDEX IF NOT EXISTS idx_scheduled_pending_ready ON scheduled_publications(scheduled_datetime, status)
WHERE status = 'pending' AND scheduled_datetime <= CURRENT_TIMESTAMP;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_publications(status);

-- Index for date range queries (calendar view)
CREATE INDEX IF NOT EXISTS idx_scheduled_date_range ON scheduled_publications(scheduled_date, status);

-- Index for WordPress post ID lookup
CREATE INDEX IF NOT EXISTS idx_scheduled_wordpress_post ON scheduled_publications(wordpress_post_id)
WHERE wordpress_post_id IS NOT NULL;

-- ============================================
-- 4. Create trigger to update updated_at
-- ============================================

-- Create or replace the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to scheduled_publications
DROP TRIGGER IF EXISTS update_scheduled_publications_updated_at ON scheduled_publications;
CREATE TRIGGER update_scheduled_publications_updated_at
BEFORE UPDATE ON scheduled_publications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Create view for upcoming publications
-- ============================================

CREATE OR REPLACE VIEW v_upcoming_publications AS
SELECT 
    sp.id,
    sp.draft_id,
    sp.scheduled_date,
    sp.scheduled_time,
    sp.scheduled_datetime,
    sp.status,
    sp.attempts,
    sp.last_error,
    sp.created_at,
    d.title,
    d.meta_title,
    d.featured_image_url,
    d.status as draft_status,
    d.approved_at,
    d.approved_by,
    k.project_name,
    k.cluster_name
FROM scheduled_publications sp
JOIN drafts d ON d.id = sp.draft_id
LEFT JOIN keywords k ON k.id = d.keyword_cluster_id
WHERE sp.status IN ('pending', 'failed')
ORDER BY sp.scheduled_datetime ASC;

-- ============================================
-- 6. Add comment documentation
-- ============================================

COMMENT ON TABLE scheduled_publications IS 'Manages scheduled publication of approved drafts to WordPress';
COMMENT ON COLUMN scheduled_publications.scheduled_datetime IS 'Computed column: scheduled_date + scheduled_time';
COMMENT ON COLUMN scheduled_publications.status IS 'Publication status: pending, published, failed, cancelled';
COMMENT ON COLUMN scheduled_publications.attempts IS 'Number of publication attempts (for retry logic)';
COMMENT ON VIEW v_upcoming_publications IS 'Convenient view of pending/failed publications with draft metadata';

-- ============================================
-- Migration completed successfully
-- ============================================

