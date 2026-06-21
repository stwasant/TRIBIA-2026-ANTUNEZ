-- =====================================================
-- TRIBIA 2026 - Schema para Supabase
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- =====================================================

-- Tabla de usuarios
create table if not exists public.users (
  id text primary key,
  name text not null,
  avatar text not null default '⚽',
  created_at timestamptz not null default now()
);

-- Tabla de pronósticos
create table if not exists public.predictions (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  match_id text not null,
  home_score integer not null,
  away_score integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, match_id)
);

-- Tabla de resultados de partidos
create table if not exists public.match_results (
  match_id text primary key,
  home_score integer not null,
  away_score integer not null,
  status text not null default 'finished',
  updated_at timestamptz not null default now()
);

-- Acceso público de lectura (anon key puede leer todo)
alter table public.users enable row level security;
alter table public.predictions enable row level security;
alter table public.match_results enable row level security;

-- Políticas: cualquiera puede leer y escribir (app familiar sin auth)
create policy "Lectura pública - users" on public.users
  for select using (true);
create policy "Escritura pública - users" on public.users
  for insert with check (true);
create policy "Borrado público - users" on public.users
  for delete using (true);

create policy "Lectura pública - predictions" on public.predictions
  for select using (true);
create policy "Escritura pública - predictions" on public.predictions
  for insert with check (true);
create policy "Actualización pública - predictions" on public.predictions
  for update using (true);
create policy "Borrado público - predictions" on public.predictions
  for delete using (true);

create policy "Lectura pública - match_results" on public.match_results
  for select using (true);
create policy "Escritura pública - match_results" on public.match_results
  for insert with check (true);
create policy "Actualización pública - match_results" on public.match_results
  for update using (true);
create policy "Borrado público - match_results" on public.match_results
  for delete using (true);
