-- Adds editable prompt override fields for drafts
ALTER TABLE drafts
    ADD COLUMN IF NOT EXISTS article_prompt_override TEXT,
    ADD COLUMN IF NOT EXISTS image_prompt_override TEXT;


