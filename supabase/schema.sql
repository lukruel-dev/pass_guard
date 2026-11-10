-- ==============================================================================
-- PASSGUARD - SUPABASE SCHEMA (PostgreSQL + RLS)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==============================================================================

-- 1. Habilitar extensão pgcrypto (caso necessária para gen_random_uuid)
create extension if not exists "pgcrypto";

-- 2. Tabela de Perfis de Usuário (vinculada ao auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  two_factor_enabled boolean default false not null,
  two_factor_secret text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Ativar RLS em profiles
alter table public.profiles enable row level security;

-- Políticas de RLS para profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Tabela de Cofre de Senhas (password_entries)
create table if not exists public.password_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  username text not null,
  encrypted_password text not null,
  url text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Índices para buscas rápidas por usuário e nome
create index if not exists idx_password_entries_user_id on public.password_entries(user_id);
create index if not exists idx_password_entries_created_at on public.password_entries(created_at desc);

-- Ativar RLS em password_entries
alter table public.password_entries enable row level security;

-- Políticas de RLS para password_entries
drop policy if exists "Users can view own passwords" on public.password_entries;
create policy "Users can view own passwords"
  on public.password_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own passwords" on public.password_entries;
create policy "Users can insert own passwords"
  on public.password_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own passwords" on public.password_entries;
create policy "Users can update own passwords"
  on public.password_entries for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own passwords" on public.password_entries;
create policy "Users can delete own passwords"
  on public.password_entries for delete
  using (auth.uid() = user_id);

-- 4. Função e Trigger para criar perfil automaticamente no cadastro (auth.users)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, two_factor_enabled)
  values (new.id, new.email, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

