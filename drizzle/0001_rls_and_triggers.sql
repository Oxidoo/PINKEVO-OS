-- =============================================================================
-- PINKEVO OS — RLS policies, triggers, and bootstrap seeds
-- Run AFTER 0000_*.sql (Drizzle-generated schema).
-- All tables are RLS-enabled; access is gated by a role check on profiles.
-- =============================================================================

-- ─── Helper functions ────────────────────────────────────────────────────────

-- Resolve the current user's role from public.profiles.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, auth
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- True when the current user has any of the given roles.
create or replace function public.has_role(variadic roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(public.current_user_role() = any(roles), false)
$$;

-- Convenience: any authenticated team member (i.e. has a profile row).
create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (select 1 from public.profiles where id = auth.uid())
$$;

-- Auto-bump updated_at on row updates.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Apply updated_at trigger to every table in this migration.
do $$
declare
  t text;
  tables text[] := array[
    'profiles','team_invitations',
    'clients','contacts','leads','deals','activities',
    'projects','tasks','websites','audits',
    'agents','agent_runs','automations',
    'email_templates','email_campaigns','email_messages','calendar_events',
    'subscriptions','invoices','proposals','expenses','tool_subscriptions','api_usage',
    'documents','notifications','audit_logs','integrations'
  ];
begin
  foreach t in array tables loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.tg_set_updated_at();',
      t, t
    );
  end loop;
end$$;

-- Auto-create profile when a new auth.users row is inserted.
-- First user becomes owner; subsequent users land as viewer (promoted via invites).
create or replace function public.tg_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  is_first boolean;
  invited_role public.user_role;
  inv_email text;
begin
  select count(*) = 0 into is_first from public.profiles;
  inv_email := lower(new.email);

  -- Check for a pending invitation matching this email.
  select role into invited_role
  from public.team_invitations
  where lower(email) = inv_email
    and accepted_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    case
      when is_first then 'owner'::public.user_role
      when invited_role is not null then invited_role
      else 'viewer'::public.user_role
    end
  );

  -- Mark invitation accepted.
  update public.team_invitations
    set accepted_at = now()
  where lower(email) = inv_email
    and accepted_at is null
    and expires_at > now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_user();

-- ─── Enable RLS ──────────────────────────────────────────────────────────────

do $$
declare
  t text;
  tables text[] := array[
    'profiles','team_invitations',
    'clients','contacts','leads','deals','activities',
    'projects','tasks','websites','audits',
    'agents','agent_runs','automations',
    'email_templates','email_campaigns','email_messages','calendar_events',
    'subscriptions','invoices','proposals','expenses','tool_subscriptions','api_usage',
    'documents','notifications','audit_logs','integrations'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
  end loop;
end$$;

-- ─── Profiles ────────────────────────────────────────────────────────────────

-- Anyone in the team can see all profiles.
create policy profiles_select_team on public.profiles
  for select to authenticated using (public.is_team_member());

-- Users update their own profile (excluding role — owner/admin handle that).
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_user_role());

-- Owner/admin can update anyone (incl. role).
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.has_role('owner','admin'))
  with check (public.has_role('owner','admin'));

-- Owner/admin can delete profiles.
create policy profiles_delete_admin on public.profiles
  for delete to authenticated using (public.has_role('owner','admin'));

-- Insert is performed by the auth trigger as security definer — no policy needed.

-- ─── Team invitations ────────────────────────────────────────────────────────

create policy invites_select_admin on public.team_invitations
  for select to authenticated using (public.has_role('owner','admin'));

create policy invites_write_admin on public.team_invitations
  for all to authenticated
  using (public.has_role('owner','admin'))
  with check (public.has_role('owner','admin'));

-- ─── Generic policy helpers ──────────────────────────────────────────────────
-- For most CRM/projects/finance tables we apply the same matrix:
--   - read:   any team member
--   - write:  owner/admin/manager + role-specific allowances handled in app layer
-- Defense-in-depth: app code also calls requireRole().

do $$
declare
  t text;
  read_all text[] := array[
    'clients','contacts','leads','deals','activities',
    'projects','tasks','websites','audits',
    'agents','agent_runs','automations',
    'email_templates','email_campaigns','email_messages','calendar_events',
    'subscriptions','invoices','proposals','expenses','tool_subscriptions','api_usage',
    'documents','integrations'
  ];
  write_priv text[] := array[
    'clients','contacts','projects','tasks','websites','audits',
    'agents','automations','email_templates','email_campaigns',
    'expenses','tool_subscriptions','integrations'
  ];
begin
  foreach t in array read_all loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_team_member());',
      t || '_select_team', t
    );
  end loop;

  foreach t in array write_priv loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.has_role(''owner'',''admin'',''manager''));',
      t || '_insert_priv', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.has_role(''owner'',''admin'',''manager'')) with check (public.has_role(''owner'',''admin'',''manager''));',
      t || '_update_priv', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.has_role(''owner'',''admin''));',
      t || '_delete_admin', t
    );
  end loop;
end$$;

-- ─── Sales-focused tables (leads, deals, proposals, email_messages, calendar) ─

-- Sales role can write these too (in addition to owner/admin/manager).
do $$
declare
  t text;
  sales_write text[] := array['leads','deals','proposals','email_messages','calendar_events','activities'];
begin
  foreach t in array sales_write loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.has_role(''owner'',''admin'',''manager'',''sales''));',
      t || '_insert_sales', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.has_role(''owner'',''admin'',''manager'',''sales'')) with check (public.has_role(''owner'',''admin'',''manager'',''sales''));',
      t || '_update_sales', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.has_role(''owner'',''admin''));',
      t || '_delete_admin', t
    );
  end loop;
end$$;

-- Invoices & subscriptions: read team, write owner/admin only (Stripe-sync via service role).
create policy invoices_write_admin on public.invoices
  for all to authenticated
  using (public.has_role('owner','admin'))
  with check (public.has_role('owner','admin'));

create policy subscriptions_write_admin on public.subscriptions
  for all to authenticated
  using (public.has_role('owner','admin'))
  with check (public.has_role('owner','admin'));

-- Agent runs: any team member can run; only the runner/admin can update/delete.
create policy agent_runs_insert_team on public.agent_runs
  for insert to authenticated with check (public.is_team_member());
create policy agent_runs_update_owner on public.agent_runs
  for update to authenticated
  using (triggered_by = auth.uid() or public.has_role('owner','admin'))
  with check (triggered_by = auth.uid() or public.has_role('owner','admin'));
create policy agent_runs_delete_admin on public.agent_runs
  for delete to authenticated using (public.has_role('owner','admin'));

-- Documents: producer/manager/admin/owner can upload; sales can read only.
create policy documents_insert_priv on public.documents
  for insert to authenticated
  with check (public.has_role('owner','admin','manager','producer'));
create policy documents_update_priv on public.documents
  for update to authenticated
  using (public.has_role('owner','admin','manager','producer'))
  with check (public.has_role('owner','admin','manager','producer'));
create policy documents_delete_admin on public.documents
  for delete to authenticated using (public.has_role('owner','admin'));

-- ─── Notifications ───────────────────────────────────────────────────────────
create policy notif_select_self on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notif_update_self on public.notifications
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Audit logs ──────────────────────────────────────────────────────────────
create policy audit_select_admin on public.audit_logs
  for select to authenticated using (public.has_role('owner','admin'));
-- Inserts done via service role.

-- ─── Seed: bootstrap the 5 agents ────────────────────────────────────────────
insert into public.agents (slug, name, description, system_prompt, model, config)
values
  ('lead_prospector', 'Lead Prospector',
   'Scrape Google Maps + sites pour générer des leads qualifiés.',
   'Tu es un expert en prospection B2B locale. Pour chaque entreprise donnée, extrais nom du dirigeant, email, téléphone, taille estimée. Réponds en JSON.',
   'claude-opus-4-5', '{"max_results": 50}'::jsonb),
  ('lead_qualifier', 'Lead Qualifier',
   'Enrichit et score les leads (fit PINKEVO) sur 100.',
   'Tu es un expert en qualification de leads pour une agence digitale. Score le fit de 0 à 100 et justifie.',
   'claude-haiku-4-5', '{}'::jsonb),
  ('proposal_writer', 'Proposal Writer',
   'Rédige des propales structurées (setup + récurrent) en JSON puis PDF.',
   'Tu es un rédacteur senior de propositions commerciales pour PINKEVO. Structure : contexte, objectifs, livrables, planning, prix setup + récurrent.',
   'claude-opus-4-5', '{}'::jsonb),
  ('seo_auditor', 'SEO Auditor',
   'Audit SEO complet (Search Console + PSI) avec 10 actions priorisées.',
   'Tu es un consultant SEO senior. Analyse les données fournies et propose 10 actions priorisées par impact × effort.',
   'claude-opus-4-5', '{}'::jsonb),
  ('perf_auditor', 'Perf Auditor',
   'Audit performance (PSI mobile + desktop) avec quick wins.',
   'Tu es un expert performance web. Identifie les quick wins (images, JS, fonts) et résume en français pour le client.',
   'claude-haiku-4-5', '{}'::jsonb)
on conflict (slug) do nothing;
