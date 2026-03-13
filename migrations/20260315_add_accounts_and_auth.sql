-- Enterprise foundation: accounts, memberships, and account scoping.

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.account_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, user_id)
);

CREATE INDEX IF NOT EXISTS account_memberships_user_id_idx ON public.account_memberships(user_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS companies_account_id_idx ON public.companies(account_id);
    ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_place_id_key;
    ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_account_id_place_id_key;
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_account_id_place_id_key UNIQUE (account_id, place_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') THEN
    ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS deals_account_id_idx ON public.deals(account_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS campaigns_account_id_idx ON public.campaigns(account_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'outreach_messages') THEN
    ALTER TABLE public.outreach_messages ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS outreach_messages_account_id_idx ON public.outreach_messages(account_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discovery_jobs') THEN
    ALTER TABLE public.discovery_jobs ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS discovery_jobs_account_id_idx ON public.discovery_jobs(account_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discovery_queue') THEN
    ALTER TABLE public.discovery_queue ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS discovery_queue_account_id_idx ON public.discovery_queue(account_id);
    ALTER TABLE public.discovery_queue DROP CONSTRAINT IF EXISTS discovery_queue_keyword_city_state_key;
    ALTER TABLE public.discovery_queue DROP CONSTRAINT IF EXISTS discovery_queue_account_keyword_city_state_key;
    ALTER TABLE public.discovery_queue
      ADD CONSTRAINT discovery_queue_account_keyword_city_state_key UNIQUE (account_id, keyword, city, state);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reputation_reports') THEN
    ALTER TABLE public.reputation_reports ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS reputation_reports_account_id_idx ON public.reputation_reports(account_id);
  END IF;
END $$;

DO $$
DECLARE
  only_account_id uuid;
  account_count integer;
BEGIN
  SELECT COUNT(*), MIN(id)
  INTO account_count, only_account_id
  FROM public.accounts;

  IF account_count = 1 AND only_account_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
      UPDATE public.companies SET account_id = only_account_id WHERE account_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') THEN
      UPDATE public.deals SET account_id = only_account_id WHERE account_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
      UPDATE public.campaigns SET account_id = only_account_id WHERE account_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'outreach_messages') THEN
      UPDATE public.outreach_messages SET account_id = only_account_id WHERE account_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discovery_jobs') THEN
      UPDATE public.discovery_jobs SET account_id = only_account_id WHERE account_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discovery_queue') THEN
      UPDATE public.discovery_queue SET account_id = only_account_id WHERE account_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reputation_reports') THEN
      UPDATE public.reputation_reports SET account_id = only_account_id WHERE account_id IS NULL;
    END IF;
  END IF;
END $$;
