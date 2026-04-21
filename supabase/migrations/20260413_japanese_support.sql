-- ── Japanese / Shuukatsu support migration ──────────────────────────────────
-- Run in Supabase SQL Editor → New query

-- 1. Add language and pipeline columns to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS language_preference VARCHAR(5)  NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS pipeline_type       VARCHAR(20) NOT NULL DEFAULT 'english';

-- Valid values: language_preference ∈ {'en','ja'}, pipeline_type ∈ {'english','shuukatsu'}

-- 2. Add Japanese Pro feature columns to applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS es_content     JSONB,
  ADD COLUMN IF NOT EXISTS spi_result     JSONB,
  ADD COLUMN IF NOT EXISTS naitei_details JSONB;

-- 3. Indexes for language/pipeline lookups
CREATE INDEX IF NOT EXISTS idx_users_language   ON users(language_preference);
CREATE INDEX IF NOT EXISTS idx_users_pipeline   ON users(pipeline_type);

-- 4. Comments for clarity
COMMENT ON COLUMN users.language_preference IS 'UI language: en (English) or ja (Japanese)';
COMMENT ON COLUMN users.pipeline_type       IS 'Pipeline mode: english (INTERNSHIP_STAGES/JOB_STAGES) or shuukatsu (Japanese recruiting stages)';
COMMENT ON COLUMN applications.es_content   IS 'JSON: { motivation, selfPR, gakuchika, other } — ES管理';
COMMENT ON COLUMN applications.spi_result   IS 'JSON: { format, examDate, result, memo } — SPI・適性検査記録';
COMMENT ON COLUMN applications.naitei_details IS 'JSON: { offerDate, acceptanceDeadline, conditions, department, compensation, comparisonNotes } — 内定管理';

