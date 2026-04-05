-- Jontri v2 Migration: Tiers, Outreach Hub, SEO Services
-- Run this in the Supabase SQL Editor AFTER the initial schema

-- ============================================================
-- 1. Extend clients table for tier support
-- ============================================================
alter table clients add column if not exists tier_id text;
alter table clients add column if not exists billing_type text default 'a-la-carte';
alter table clients add column if not exists monthly_rate integer default 0;

-- Index for filtering clients by tier
create index if not exists idx_clients_tier_id on clients (tier_id) where tier_id is not null;
create index if not exists idx_clients_billing_type on clients (billing_type);

-- ============================================================
-- 2. Outreach campaigns
-- ============================================================
create table if not exists outreach_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  query text not null,
  mode text default 'email',          -- 'email' | 'website-agent'
  status text default 'draft',        -- draft | discovering | qualifying | generating | sending | completed | failed
  config jsonb default '{}'::jsonb,   -- search params, filters, email tone, ICP, etc.
  stats jsonb default '{}'::jsonb,    -- { leads_found, qualified, emails_sent, ... }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_outreach_campaigns_status on outreach_campaigns (status);
create index if not exists idx_outreach_campaigns_created on outreach_campaigns (created_at desc);

-- ============================================================
-- 3. Outreach leads
-- ============================================================
create table if not exists outreach_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references outreach_campaigns(id) on delete cascade,

  -- Business info
  company text not null,
  contact_name text default '',
  email text default '',
  phone text default '',
  website text default '',
  address text default '',
  city text default '',
  state text default '',
  industry text default '',
  rating numeric default 0,
  review_count integer default 0,
  google_maps_url text default '',

  -- AI qualification
  ai_score integer,
  ai_reasoning text default '',
  pain_points text default '',
  personalized_hook text default '',

  -- Website scoring (website-agent mode)
  site_score integer,
  site_issues text default '',
  demo_url text default '',

  -- Email
  email_subject text default '',
  email_body text default '',
  email_status text default 'pending',   -- pending | generated | sent | failed

  -- Lead status
  status text default 'discovered',      -- discovered | qualified | disqualified | email_generated | sent
  created_at timestamptz default now()
);

create index if not exists idx_outreach_leads_campaign on outreach_leads (campaign_id);
create index if not exists idx_outreach_leads_status on outreach_leads (status);
create index if not exists idx_outreach_leads_score on outreach_leads (ai_score desc nulls last);

-- ============================================================
-- 4. Row-Level Security (optional — enable when auth is configured)
-- ============================================================
-- alter table outreach_campaigns enable row level security;
-- alter table outreach_leads enable row level security;
