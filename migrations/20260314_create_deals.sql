-- Create deals table so prospects can be converted into live pipeline records.

CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  source_prospect_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  name text NOT NULL,
  owner text NOT NULL DEFAULT 'Alex Kim',
  stage text NOT NULL DEFAULT 'prospecting',
  value numeric,
  probability integer,
  deep_dive_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deals_stage_idx ON deals(stage);
CREATE INDEX IF NOT EXISTS deals_company_id_idx ON deals(company_id);
CREATE INDEX IF NOT EXISTS deals_source_prospect_id_idx ON deals(source_prospect_id);
