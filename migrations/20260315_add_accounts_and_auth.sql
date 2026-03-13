-- Enterprise foundation: accounts, memberships, and account scoping.

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, user_id)
);

CREATE INDEX IF NOT EXISTS account_memberships_user_id_idx ON account_memberships(user_id);

ALTER TABLE IF EXISTS companies ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS campaigns ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS outreach_messages ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS discovery_jobs ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS discovery_queue ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS reputation_reports ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS companies_account_id_idx ON companies(account_id);
CREATE INDEX IF NOT EXISTS deals_account_id_idx ON deals(account_id);
CREATE INDEX IF NOT EXISTS campaigns_account_id_idx ON campaigns(account_id);
CREATE INDEX IF NOT EXISTS outreach_messages_account_id_idx ON outreach_messages(account_id);
CREATE INDEX IF NOT EXISTS discovery_jobs_account_id_idx ON discovery_jobs(account_id);
CREATE INDEX IF NOT EXISTS discovery_queue_account_id_idx ON discovery_queue(account_id);
CREATE INDEX IF NOT EXISTS reputation_reports_account_id_idx ON reputation_reports(account_id);

ALTER TABLE IF EXISTS companies DROP CONSTRAINT IF EXISTS companies_place_id_key;
ALTER TABLE IF EXISTS companies
  ADD CONSTRAINT companies_account_id_place_id_key UNIQUE (account_id, place_id);

ALTER TABLE IF EXISTS discovery_queue DROP CONSTRAINT IF EXISTS discovery_queue_keyword_city_state_key;
ALTER TABLE IF EXISTS discovery_queue
  ADD CONSTRAINT discovery_queue_account_keyword_city_state_key UNIQUE (account_id, keyword, city, state);

DO $$
DECLARE
  only_account_id uuid;
  account_count integer;
BEGIN
  SELECT COUNT(*), MIN(id)
  INTO account_count, only_account_id
  FROM accounts;

  IF account_count = 1 AND only_account_id IS NOT NULL THEN
    UPDATE companies SET account_id = only_account_id WHERE account_id IS NULL;
    UPDATE deals SET account_id = only_account_id WHERE account_id IS NULL;
    UPDATE campaigns SET account_id = only_account_id WHERE account_id IS NULL;
    UPDATE outreach_messages SET account_id = only_account_id WHERE account_id IS NULL;
    UPDATE discovery_jobs SET account_id = only_account_id WHERE account_id IS NULL;
    UPDATE discovery_queue SET account_id = only_account_id WHERE account_id IS NULL;
    UPDATE reputation_reports SET account_id = only_account_id WHERE account_id IS NULL;
  END IF;
END $$;
