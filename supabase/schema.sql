-- PostgreSQL schema for Supabase migration (from Prisma/MySQL)
-- Execute this script in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id text primary key default gen_random_uuid()::text,
  email text not null unique,
  name text,
  password text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key default gen_random_uuid()::text,
  invoice_number text not null unique,
  date timestamptz not null,
  due_date timestamptz not null,
  client_name text not null,
  client_email text not null,
  client_address text not null,
  subtotal numeric(12, 2) not null,
  tax numeric(12, 2) not null,
  total numeric(12, 2) not null,
  status text not null default 'pending',
  user_id text not null references public.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id text primary key default gen_random_uuid()::text,
  description text not null,
  quantity integer not null,
  price numeric(12, 2) not null,
  total numeric(12, 2) not null,
  invoice_id text not null references public.invoices(id) on update cascade on delete restrict
);

create index if not exists idx_invoices_user_id on public.invoices(user_id);
create index if not exists idx_invoice_items_invoice_id on public.invoice_items(invoice_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_due_date on public.invoices(due_date);
