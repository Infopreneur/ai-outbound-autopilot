-- Enable row-level security and account-membership policies.

CREATE OR REPLACE FUNCTION public.is_account_member(target_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_memberships m
    WHERE m.account_id = target_account_id
      AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_account_role(target_account_id uuid, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_memberships m
    WHERE m.account_id = target_account_id
      AND m.user_id = auth.uid()
      AND m.role = ANY(allowed_roles)
  );
$$;

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounts_select_policy ON public.accounts;
CREATE POLICY accounts_select_policy
ON public.accounts
FOR SELECT
USING (public.is_account_member(id));

DROP POLICY IF EXISTS accounts_insert_policy ON public.accounts;
CREATE POLICY accounts_insert_policy
ON public.accounts
FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS accounts_update_policy ON public.accounts;
CREATE POLICY accounts_update_policy
ON public.accounts
FOR UPDATE
USING (public.has_account_role(id, ARRAY['owner','admin']))
WITH CHECK (public.has_account_role(id, ARRAY['owner','admin']));

DROP POLICY IF EXISTS membership_select_policy ON public.account_memberships;
CREATE POLICY membership_select_policy
ON public.account_memberships
FOR SELECT
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS membership_insert_policy ON public.account_memberships;
CREATE POLICY membership_insert_policy
ON public.account_memberships
FOR INSERT
WITH CHECK (public.has_account_role(account_id, ARRAY['owner','admin']));

DROP POLICY IF EXISTS membership_update_policy ON public.account_memberships;
CREATE POLICY membership_update_policy
ON public.account_memberships
FOR UPDATE
USING (public.has_account_role(account_id, ARRAY['owner','admin']))
WITH CHECK (public.has_account_role(account_id, ARRAY['owner','admin']));

DROP POLICY IF EXISTS membership_delete_policy ON public.account_memberships;
CREATE POLICY membership_delete_policy
ON public.account_memberships
FOR DELETE
USING (public.has_account_role(account_id, ARRAY['owner','admin']));

DROP POLICY IF EXISTS invitations_select_policy ON public.account_invitations;
CREATE POLICY invitations_select_policy
ON public.account_invitations
FOR SELECT
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS invitations_insert_policy ON public.account_invitations;
CREATE POLICY invitations_insert_policy
ON public.account_invitations
FOR INSERT
WITH CHECK (public.has_account_role(account_id, ARRAY['owner','admin']));

DROP POLICY IF EXISTS invitations_update_policy ON public.account_invitations;
CREATE POLICY invitations_update_policy
ON public.account_invitations
FOR UPDATE
USING (public.has_account_role(account_id, ARRAY['owner','admin']))
WITH CHECK (public.has_account_role(account_id, ARRAY['owner','admin']));

DROP POLICY IF EXISTS invitations_delete_policy ON public.account_invitations;
CREATE POLICY invitations_delete_policy
ON public.account_invitations
FOR DELETE
USING (public.has_account_role(account_id, ARRAY['owner','admin']));

DROP POLICY IF EXISTS companies_select_policy ON public.companies;
CREATE POLICY companies_select_policy
ON public.companies
FOR SELECT
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS companies_insert_policy ON public.companies;
CREATE POLICY companies_insert_policy
ON public.companies
FOR INSERT
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS companies_update_policy ON public.companies;
CREATE POLICY companies_update_policy
ON public.companies
FOR UPDATE
USING (public.is_account_member(account_id))
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS companies_delete_policy ON public.companies;
CREATE POLICY companies_delete_policy
ON public.companies
FOR DELETE
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS deals_select_policy ON public.deals;
CREATE POLICY deals_select_policy
ON public.deals
FOR SELECT
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS deals_insert_policy ON public.deals;
CREATE POLICY deals_insert_policy
ON public.deals
FOR INSERT
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS deals_update_policy ON public.deals;
CREATE POLICY deals_update_policy
ON public.deals
FOR UPDATE
USING (public.is_account_member(account_id))
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS deals_delete_policy ON public.deals;
CREATE POLICY deals_delete_policy
ON public.deals
FOR DELETE
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS campaigns_select_policy ON public.campaigns;
CREATE POLICY campaigns_select_policy
ON public.campaigns
FOR SELECT
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS campaigns_insert_policy ON public.campaigns;
CREATE POLICY campaigns_insert_policy
ON public.campaigns
FOR INSERT
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS campaigns_update_policy ON public.campaigns;
CREATE POLICY campaigns_update_policy
ON public.campaigns
FOR UPDATE
USING (public.is_account_member(account_id))
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS outreach_messages_select_policy ON public.outreach_messages;
CREATE POLICY outreach_messages_select_policy
ON public.outreach_messages
FOR SELECT
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS outreach_messages_insert_policy ON public.outreach_messages;
CREATE POLICY outreach_messages_insert_policy
ON public.outreach_messages
FOR INSERT
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS outreach_messages_update_policy ON public.outreach_messages;
CREATE POLICY outreach_messages_update_policy
ON public.outreach_messages
FOR UPDATE
USING (public.is_account_member(account_id))
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS outreach_messages_delete_policy ON public.outreach_messages;
CREATE POLICY outreach_messages_delete_policy
ON public.outreach_messages
FOR DELETE
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS discovery_jobs_select_policy ON public.discovery_jobs;
CREATE POLICY discovery_jobs_select_policy
ON public.discovery_jobs
FOR SELECT
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS discovery_jobs_insert_policy ON public.discovery_jobs;
CREATE POLICY discovery_jobs_insert_policy
ON public.discovery_jobs
FOR INSERT
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS discovery_jobs_update_policy ON public.discovery_jobs;
CREATE POLICY discovery_jobs_update_policy
ON public.discovery_jobs
FOR UPDATE
USING (public.is_account_member(account_id))
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS discovery_queue_select_policy ON public.discovery_queue;
CREATE POLICY discovery_queue_select_policy
ON public.discovery_queue
FOR SELECT
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS discovery_queue_insert_policy ON public.discovery_queue;
CREATE POLICY discovery_queue_insert_policy
ON public.discovery_queue
FOR INSERT
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS discovery_queue_update_policy ON public.discovery_queue;
CREATE POLICY discovery_queue_update_policy
ON public.discovery_queue
FOR UPDATE
USING (public.is_account_member(account_id))
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS reputation_reports_select_policy ON public.reputation_reports;
CREATE POLICY reputation_reports_select_policy
ON public.reputation_reports
FOR SELECT
USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS reputation_reports_insert_policy ON public.reputation_reports;
CREATE POLICY reputation_reports_insert_policy
ON public.reputation_reports
FOR INSERT
WITH CHECK (public.is_account_member(account_id));

DROP POLICY IF EXISTS reputation_reports_update_policy ON public.reputation_reports;
CREATE POLICY reputation_reports_update_policy
ON public.reputation_reports
FOR UPDATE
USING (public.is_account_member(account_id))
WITH CHECK (public.is_account_member(account_id));
