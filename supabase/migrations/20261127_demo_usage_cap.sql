-- Daily cap for the public homepage AI demos (site score + demo chatbot).
-- One row per UTC day; claim_demo_run() atomically increments and refuses past the limit.

create table if not exists public.demo_usage (
  day  date primary key,
  runs integer not null default 0 check (runs >= 0)
);

alter table public.demo_usage enable row level security;
-- No policies: only the service role (server-side API routes) may touch this table.

create or replace function public.claim_demo_run(p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed boolean;
begin
  insert into public.demo_usage as u (day, runs)
  values ((now() at time zone 'utc')::date, 1)
  on conflict (day) do update
    set runs = u.runs + 1
    where u.runs < p_limit
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

revoke all on function public.claim_demo_run(integer) from public, anon, authenticated;
grant execute on function public.claim_demo_run(integer) to service_role;
