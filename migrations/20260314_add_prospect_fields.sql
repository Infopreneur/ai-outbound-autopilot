-- Add prospecting-specific columns to companies table

ALTER TABLE companies
  ADD COLUMN strategy text,
  ADD COLUMN deep_dive_note text,
  ADD COLUMN source_url text,
  ADD COLUMN converted_to_deal boolean DEFAULT false;

-- add index for faster filtering by strategy
CREATE INDEX IF NOT EXISTS idx_companies_strategy ON companies(strategy);
