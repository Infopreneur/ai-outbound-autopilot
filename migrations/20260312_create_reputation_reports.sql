-- Migration: Create reputation_reports table for the Online Positioning Report feature
-- Run this in your Supabase SQL editor or via `supabase db reset` / migration tooling.

CREATE TABLE IF NOT EXISTS reputation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_niche text,
  company_city text,
  company_state text,
  company_rating float,
  company_reviews int,
  company_website text,
  company_phone text,
  overall_score int,
  visibility_score int,
  review_velocity float,
  lost_revenue_estimate int,
  score_breakdown jsonb,
  ai_action_plan jsonb,
  generated_at timestamptz DEFAULT now(),
  share_token text UNIQUE DEFAULT gen_random_uuid()::text
);

-- Optional index to quickly find reports by company
CREATE UNIQUE INDEX IF NOT EXISTS reputation_reports_company_id_idx
  ON reputation_reports (company_id);
