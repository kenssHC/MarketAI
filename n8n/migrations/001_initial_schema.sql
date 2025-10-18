-- ============================================
-- MarketAI SEO Module - Initial Schema
-- Version: 001
-- Description: Creates base tables for SEO content pipeline
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: keywords
-- Description: Stores analyzed and clustered keywords
-- ============================================
CREATE TABLE IF NOT EXISTS keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación
    project_name VARCHAR(255),
    cluster_name VARCHAR(255) NOT NULL,
    
    -- Keyword data
    keyword_principal VARCHAR(500) NOT NULL,
    keywords_secundarias JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata from GKP or manual input
    source VARCHAR(50) DEFAULT 'manual', -- 'gkp' or 'manual'
    search_volume INTEGER,
    competition VARCHAR(50),
    search_intent VARCHAR(100), -- informational, transactional, navigational
    
    -- Processing status
    status VARCHAR(50) DEFAULT 'pending', -- pending, processed, used, archived
    processed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT keywords_keyword_principal_key UNIQUE (keyword_principal)
);

CREATE INDEX idx_keywords_cluster ON keywords(cluster_name);
CREATE INDEX idx_keywords_status ON keywords(status);
CREATE INDEX idx_keywords_created_at ON keywords(created_at DESC);

-- ============================================
-- Table: ideas
-- Description: Stores generated content ideas (30 per keyword cluster)
-- ============================================
CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    keyword_cluster_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
    
    -- Idea data
    idea_title VARCHAR(500) NOT NULL,
    categoria VARCHAR(100) NOT NULL, -- 'Requiere investigación' or 'No requiere investigación'
    
    -- Optional metadata
    description TEXT,
    estimated_word_count INTEGER DEFAULT 600,
    target_audience VARCHAR(255),
    
    -- Processing status
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, draft_created, published, rejected
    priority INTEGER DEFAULT 0, -- for sorting
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE INDEX idx_ideas_keyword_cluster ON ideas(keyword_cluster_id);
CREATE INDEX idx_ideas_categoria ON ideas(categoria);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_priority ON ideas(priority DESC);

-- ============================================
-- Table: drafts
-- Description: Stores article drafts with SEO metadata
-- ============================================
CREATE TABLE IF NOT EXISTS drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    keyword_cluster_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
    
    -- Article content
    title VARCHAR(255) NOT NULL,
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    tags TEXT[], -- Array of tags
    
    -- Content
    content_markdown TEXT NOT NULL,
    content_html TEXT,
    word_count INTEGER DEFAULT 0,
    
    -- Research data (if applicable)
    research_data JSONB, -- Structured data from Perplexity/Serper
    research_sources JSONB DEFAULT '[]'::jsonb, -- Array of sources with author, year, url
    
    -- Images
    featured_image_url VARCHAR(500),
    featured_image_alt TEXT,
    featured_image_prompt TEXT, -- The prompt used to generate the image
    additional_images JSONB DEFAULT '[]'::jsonb, -- Array of image objects
    
    -- SEO Quality Assurance
    qa_passed BOOLEAN DEFAULT false,
    qa_report JSONB, -- Detailed QA checks (meta lengths, keyword density, etc.)
    qa_checked_at TIMESTAMP,
    
    -- Publishing
    wordpress_post_id INTEGER,
    wordpress_post_url VARCHAR(500),
    wordpress_permalink VARCHAR(500),
    published_at TIMESTAMP,
    
    -- Social media copies
    linkedin_copy TEXT,
    facebook_copy TEXT,
    
    -- Status workflow
    status VARCHAR(50) DEFAULT 'draft', -- draft, review, approved, publishing, published, rejected
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by VARCHAR(255)
);

CREATE INDEX idx_drafts_idea_id ON drafts(idea_id);
CREATE INDEX idx_drafts_keyword_cluster_id ON drafts(keyword_cluster_id);
CREATE INDEX idx_drafts_status ON drafts(status);
CREATE INDEX idx_drafts_qa_passed ON drafts(qa_passed);
CREATE INDEX idx_drafts_created_at ON drafts(created_at DESC);
CREATE INDEX idx_drafts_published_at ON drafts(published_at DESC NULLS LAST);

-- ============================================
-- Table: jobs_log
-- Description: Logs all job executions for monitoring and debugging
-- ============================================
CREATE TABLE IF NOT EXISTS jobs_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Job identification
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(100) NOT NULL, -- 'keyword_analysis', 'idea_generation', 'draft_creation', 'image_generation', 'publishing', etc.
    
    -- Relations (nullable - depends on job type)
    related_keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
    related_idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
    related_draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
    
    -- Job execution
    status VARCHAR(50) NOT NULL, -- 'started', 'success', 'failed', 'retry', 'dlq'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER, -- Duration in milliseconds
    
    -- Input/Output
    input_data JSONB,
    output_data JSONB,
    
    -- Error handling
    error_message TEXT,
    error_stack TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- DLQ (Dead Letter Queue)
    moved_to_dlq_at TIMESTAMP,
    dlq_reason TEXT,
    
    -- Metadata
    worker_id VARCHAR(255), -- Which worker processed this
    api_calls_made INTEGER DEFAULT 0, -- Track API usage
    tokens_used INTEGER DEFAULT 0, -- Track LLM token usage
    cost_estimate DECIMAL(10, 4), -- Estimated cost in USD
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_log_job_type ON jobs_log(job_type);
CREATE INDEX idx_jobs_log_status ON jobs_log(status);
CREATE INDEX idx_jobs_log_created_at ON jobs_log(created_at DESC);
CREATE INDEX idx_jobs_log_keyword_id ON jobs_log(related_keyword_id);
CREATE INDEX idx_jobs_log_idea_id ON jobs_log(related_idea_id);
CREATE INDEX idx_jobs_log_draft_id ON jobs_log(related_draft_id);

-- ============================================
-- Triggers for automatic timestamp updates
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drafts_updated_at BEFORE UPDATE ON drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Utility Views for common queries
-- ============================================

-- View: Active pipeline overview
CREATE OR REPLACE VIEW v_pipeline_overview AS
SELECT 
    k.cluster_name,
    k.keyword_principal,
    COUNT(DISTINCT i.id) as total_ideas,
    COUNT(DISTINCT CASE WHEN i.categoria = 'Requiere investigación' THEN i.id END) as ideas_con_investigacion,
    COUNT(DISTINCT CASE WHEN i.categoria = 'No requiere investigación' THEN i.id END) as ideas_sin_investigacion,
    COUNT(DISTINCT d.id) as total_drafts,
    COUNT(DISTINCT CASE WHEN d.qa_passed = true THEN d.id END) as drafts_approved,
    COUNT(DISTINCT CASE WHEN d.status = 'published' THEN d.id END) as articles_published,
    k.created_at as keyword_created_at
FROM keywords k
LEFT JOIN ideas i ON i.keyword_cluster_id = k.id
LEFT JOIN drafts d ON d.keyword_cluster_id = k.id
GROUP BY k.id, k.cluster_name, k.keyword_principal, k.created_at
ORDER BY k.created_at DESC;

-- View: Recent job failures for monitoring
CREATE OR REPLACE VIEW v_recent_job_failures AS
SELECT 
    job_name,
    job_type,
    status,
    error_message,
    retry_count,
    created_at,
    completed_at,
    duration_ms
FROM jobs_log
WHERE status IN ('failed', 'dlq')
ORDER BY created_at DESC
LIMIT 100;

-- ============================================
-- Initial data (optional examples)
-- ============================================

-- Insert example project configuration (optional)
-- INSERT INTO keywords (cluster_name, keyword_principal, keywords_secundarias, source, status)
-- VALUES ('Ejemplo', 'marketing digital', '["estrategias de marketing", "publicidad online"]'::jsonb, 'manual', 'pending');

-- ============================================
-- Schema version tracking
-- ============================================
CREATE TABLE IF NOT EXISTS schema_versions (
    version INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_versions (version, description) 
VALUES (1, 'Initial schema with keywords, ideas, drafts, and jobs_log tables')
ON CONFLICT (version) DO NOTHING;

-- ============================================
-- Grants (adjust based on your security needs)
-- ============================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO marketai_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO marketai_user;

-- End of migration

