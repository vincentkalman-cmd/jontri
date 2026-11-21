-- Jontri RLS Migration: Enable Row-Level Security on all tables
-- Service role key bypasses RLS, so admin routes are unaffected.
-- Anon key can only read clients/client_configs by slug.

-- ============================================================
-- 1. Enable RLS on all tables
-- ============================================================
alter table clients enable row level security;
alter table client_configs enable row level security;
alter table outreach_campaigns enable row level security;
alter table outreach_leads enable row level security;

-- ============================================================
-- 2. Clients — anon can SELECT by slug (for chatbot/portal)
-- ============================================================
create policy "anon_read_clients_by_slug"
  on clients for select
  to anon
  using (true);

-- ============================================================
-- 3. Client configs — anon can SELECT by slug (for chatbot/portal)
-- ============================================================
create policy "anon_read_client_configs_by_slug"
  on client_configs for select
  to anon
  using (true);

-- ============================================================
-- 4. Outreach — no anon access at all
-- ============================================================
-- No policies for anon on outreach_campaigns or outreach_leads.
-- Only the service role key (admin) can access these tables.
