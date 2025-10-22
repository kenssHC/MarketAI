-- ============================================
-- MarketAI SEO Module - Migration 002
-- Description: Create research_reports table to store structured investigative data
-- ============================================

-- Table: research_reports
-- Stores normalized research outputs (Perplexity / o4-mini-deep-research) linked to ideas
CREATE TABLE IF NOT EXISTS research_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relations
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    keyword_cluster_id UUID REFERENCES keywords(id) ON DELETE SET NULL,

    -- Metadata
    idea_title VARCHAR(500) NOT NULL,
    idea_category VARCHAR(100),
    model_used VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed', -- pending, in_progress, completed, failed

    -- Research data
    search_queries JSONB DEFAULT '[]'::jsonb,
    research_json JSONB NOT NULL,
    summary TEXT,
    key_insights JSONB DEFAULT '[]'::jsonb,
    key_statistics JSONB DEFAULT '[]'::jsonb,
    trends JSONB DEFAULT '[]'::jsonb,
    sources JSONB DEFAULT '[]'::jsonb,
    raw_response JSONB,

    -- Usage metrics
    tokens_used INTEGER,
    cost_estimate DECIMAL(10, 4),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_reports_idea_id ON research_reports(idea_id);
CREATE INDEX IF NOT EXISTS idx_research_reports_status ON research_reports(status);
CREATE INDEX IF NOT EXISTS idx_research_reports_cluster_id ON research_reports(keyword_cluster_id);

-- Trigger to keep updated_at in sync
CREATE TRIGGER update_research_reports_updated_at
BEFORE UPDATE ON research_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

