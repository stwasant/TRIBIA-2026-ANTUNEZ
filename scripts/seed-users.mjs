// ============================================================
// Seed de participantes con su puntaje base (Puntos Totales)
// Uso:  node scripts/seed-users.mjs
//
// Requisitos previos:
//   1) En Supabase (SQL Editor) ejecuta:
//        alter table public.users add column if not exists points integer not null default 0;
//   2) Tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local
//
// Usa la API REST (PostgREST) con fetch nativo: no requiere @supabase/supabase-js
// (evita el problema de WebSocket/Realtime en Node < 22).
// ============================================================
import { readFileSync } from 'node:fs';

// --- Cargar credenciales desde .env.local ---
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.trimStart().startsWith('#') && l.includes('='))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('❌ Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local');
  process.exit(1);
}

// --- Participantes [nombre, puntosTotales, avatar] ---
const PARTICIPANTES = [
  ['Tio Tobias', 25, '🦁'],
  ['Stewar',     24, '⭐'],
  ['Tio Sergio', 19, '🦊'],
  ['Angie',      17, '🦋'],
  ['Sergio R',   16, '🐯'],
  ['Nena',       14, '🌟'],
  ['Wilmer',     14, '🦅'],
  ['Robinson',   12, '🐻'],
  ['Mathias',    12, '🐉'],
  ['Alex',       11, '🦈'],
  ['Eduardo',     8, '🦝'],
  ['Tito',        5, '🐺'],
];

const slug = (s) =>
  'u-seed-' +
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const rows = PARTICIPANTES.map(([name, points, avatar]) => ({
  id: slug(name),
  name,
  avatar,
  points,
  created_at: new Date().toISOString(),
}));

// Upsert vía PostgREST (resolución de duplicados por PK)
const res = await fetch(`${url}/rest/v1/users`, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  },
  body: JSON.stringify(rows),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`❌ Error ${res.status} al cargar usuarios:`, text);
  if (/points/i.test(text) && /column/i.test(text)) {
    console.error('   ➜ Falta la columna "points". Ejecuta primero el ALTER TABLE indicado arriba.');
  }
  process.exit(1);
}

console.log(`✅ ${rows.length} participantes cargados con su puntaje base:`);
rows
  .slice()
  .sort((a, b) => b.points - a.points)
  .forEach((r, i) => console.log(`   ${String(i + 1).padStart(2)}. ${r.name.padEnd(12)} ${r.points} pts`));
