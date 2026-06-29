-- =====================================================
-- MIGRACIÓN: Agregar soporte para penales
-- Ejecuta esto en el SQL Editor de Supabase
-- =====================================================

-- Agregar columnas de penales a match_results
alter table public.match_results 
  add column if not exists home_penalties integer,
  add column if not exists away_penalties integer;

-- Agregar columnas de penales a predictions
alter table public.predictions 
  add column if not exists penalty_winner text,
  add column if not exists home_penalties integer,
  add column if not exists away_penalties integer;

-- Verificar que las columnas se crearon correctamente
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' 
  and table_name = 'predictions'
order by ordinal_position;
