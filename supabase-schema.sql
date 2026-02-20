-- Supabase SQL: Run this in the Supabase SQL Editor to create the jobs table
-- Dashboard → SQL Editor → New Query → Paste & Run

CREATE TABLE IF NOT EXISTS analysis_jobs (
  job_id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  topic TEXT NOT NULL,
  intent_variants JSONB DEFAULT '[]'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  stage INTEGER NOT NULL DEFAULT 0,
  stage_label TEXT NOT NULL DEFAULT 'Job created',
  created_at BIGINT NOT NULL,
  completed_at BIGINT,
  user_email TEXT,
  error TEXT,
  discovery_results JSONB,
  extraction_results JSONB,
  domain_analysis JSONB,
  pattern_results JSONB,
  generated_assets JSONB,
  advanced_research JSONB,
  api_tracking JSONB,
  pdf_url TEXT,
  brand_voice_samples JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast history queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON analysis_jobs (created_at DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_jobs_status ON analysis_jobs (status);

-- Index for domain lookups (re-run / trend tracking)
CREATE INDEX IF NOT EXISTS idx_jobs_domain ON analysis_jobs (domain);

-- Disable RLS for hackathon (no auth required)
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Allow all operations without auth (hackathon mode)
CREATE POLICY "Allow all reads" ON analysis_jobs FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON analysis_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON analysis_jobs FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON analysis_jobs FOR DELETE USING (true);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timestamp
  BEFORE UPDATE ON analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
