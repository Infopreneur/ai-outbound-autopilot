-- Create table for outreach campaigns
-- Fields mirror the mock Campaign type used in UI.

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft', -- active | paused | draft | completed
  channel text NOT NULL DEFAULT 'email', -- email | linkedin | multi-channel
  leads integer NOT NULL DEFAULT 0,
  sent integer NOT NULL DEFAULT 0,
  opened integer NOT NULL DEFAULT 0,
  replied integer NOT NULL DEFAULT 0,
  meetings integer NOT NULL DEFAULT 0,
  open_rate double precision NOT NULL DEFAULT 0,
  reply_rate double precision NOT NULL DEFAULT 0,
  start_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- index for status queries
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
