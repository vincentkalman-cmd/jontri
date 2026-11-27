-- Client lifecycle (Phase 1): private portal links, stages, checklist, click-to-accept.
-- Run once in the Supabase SQL Editor.

alter table public.clients
  add column if not exists portal_token text,
  add column if not exists stage text not null default 'signed_up',
  add column if not exists billing_status text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists contract_accepted_name text,
  add column if not exists contract_accepted_at timestamptz,
  add column if not exists contract_accepted_ip text,
  add column if not exists checklist jsonb not null default '[]'::jsonb,
  add column if not exists notes text not null default '';

-- Existing clients were set up by hand: give them a private link and mark them live.
update public.clients
set portal_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    stage = 'live'
where portal_token is null;

alter table public.clients alter column portal_token set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clients_portal_token_key') then
    alter table public.clients add constraint clients_portal_token_key unique (portal_token);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'clients_stage_check') then
    alter table public.clients add constraint clients_stage_check
      check (stage in ('signed_up','kickoff','building','review','live','proposal','paused'));
  end if;
end $$;
