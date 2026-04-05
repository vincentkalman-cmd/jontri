-- Run this in the Supabase SQL Editor to create the required tables

create table if not exists clients (
  slug text primary key,
  name text not null,
  industry text default '',
  description text default '',
  contact_name text default '',
  contact_email text default '',
  contact_phone text default '',
  services jsonb default '{}'::jsonb,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists client_configs (
  slug text primary key references clients(slug) on delete cascade,
  config jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);
