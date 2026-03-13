CREATE TABLE IF NOT EXISTS account_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  invited_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, email)
);

CREATE INDEX IF NOT EXISTS account_invitations_account_id_idx ON account_invitations(account_id);
CREATE INDEX IF NOT EXISTS account_invitations_email_idx ON account_invitations(email);
