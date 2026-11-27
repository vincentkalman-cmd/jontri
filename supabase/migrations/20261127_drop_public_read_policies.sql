-- Remove public (anon) read access to clients and client_configs.
-- The site now reads these server-side with the service role, so nothing breaks.
drop policy if exists "anon_read_clients" on public.clients;
drop policy if exists "anon_read_client_configs" on public.client_configs;
drop policy if exists "anon_read_clients_by_slug" on public.clients;
drop policy if exists "anon_read_client_configs_by_slug" on public.client_configs;
