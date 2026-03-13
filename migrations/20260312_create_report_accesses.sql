-- Migration: Create report_accesses table to log who views shared reports

CREATE TABLE IF NOT EXISTS report_accesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES reputation_reports(id) ON DELETE CASCADE,
  share_token text NOT NULL,
  email text NOT NULL,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_accesses_share_token_idx
  ON report_accesses (share_token);
