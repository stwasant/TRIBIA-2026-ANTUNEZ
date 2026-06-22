import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ALL_MATCHES } from '../data/matches';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ─── Helpers Supabase ──────────────────────────────────────────────────────
async function sbFetchAll() {
  const [usersRes, predsRes, resultsRes] = await Promise.all([
    supabase.from('users').select('*').order('created_at'),
    supabase.from('predictions').select('*').order('created_at'),
    supabase.from('match_results').select('*'),
  ]);

  const users = (usersRes.data || []).map(u => ({
    id: u.id, name: u.name, avatar: u.avatar, createdAt: u.created_at, points: u.points ?? 0,
  }));

  const predictions = (predsRes.data || []).map(p => ({
    id: p.id, userId: p.user_id, matchId: p.match_id,
    homeScore: p.home_score, awayScore: p.away_score,
    createdAt: p.created_at, updatedAt: p.updated_at,
  }));

  const matchResults = {};
  (resultsRes.data || []).forEach(r => {
    matchResults[r.match_id] = {
      homeScore: r.home_score, awayScore: r.away_score, status: r.status,
    };
  });

  return { users, predictions, matchResults };
}

// ─── Store ────────────────────────────────────────────────────────────────
const useStore = create(
  persist(
    (set, get) => ({
      // Estado de sincronización
      loading: false,
      synced: false,
      error: null,

      // ─── Usuarios ──────────────────────────────────────────
      users: [],
      currentUserId: null,

      addUser: async (name, avatar) => {
        const newUser = {
          id: `u-${Date.now()}`,
          name: name.trim(),
          avatar,
          points: 0,
          createdAt: new Date().toISOString(),
        };

        if (isSupabaseConfigured) {
          const { error } = await supabase.from('users').insert({
            id: newUser.id,
            name: newUser.name,
            avatar: newUser.avatar,
            created_at: newUser.createdAt,
          });
          if (error) { console.error('Error adding user:', error); return null; }
        }

        set(state => ({ users: [...state.users, newUser] }));
        return newUser.id;
      },

      removeUser: async (userId) => {
        if (isSupabaseConfigured) {
          await supabase.from('users').delete().eq('id', userId);
          // Las predicciones se borran en cascada por FK
        }
        set(state => ({
          users: state.users.filter(u => u.id !== userId),
          predictions: state.predictions.filter(p => p.userId !== userId),
          currentUserId: state.currentUserId === userId ? null : state.currentUserId,
        }));
      },

      setCurrentUser: (userId) => set({ currentUserId: userId }),

      // ─── Resultados de partidos ─────────────────────────────
      matchResults: {},

      setMatchResult: async (matchId, homeScore, awayScore) => {
        if (isSupabaseConfigured) {
          await supabase.from('match_results').upsert({
            match_id: matchId,
            home_score: homeScore,
            away_score: awayScore,
            status: 'finished',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'match_id' });
        }
        set(state => ({
          matchResults: {
            ...state.matchResults,
            [matchId]: { homeScore, awayScore, status: 'finished' },
          },
        }));
      },

      clearMatchResult: async (matchId) => {
        if (isSupabaseConfigured) {
          await supabase.from('match_results').delete().eq('match_id', matchId);
        }
        set(state => {
          const updated = { ...state.matchResults };
          delete updated[matchId];
          return { matchResults: updated };
        });
      },

      getAllMatches: () => {
        const { matchResults } = get();
        return ALL_MATCHES.map(m => {
          const override = matchResults[m.id];
          return override ? { ...m, ...override } : m;
        });
      },

      // ─── Predicciones ────────────────────────────────────────
      predictions: [],

      setPrediction: async (matchId, homeScore, awayScore) => {
        const { currentUserId } = get();
        if (!currentUserId) return;

        // Verificar permisos: solo el dueño o admin pueden editar
        const adminUnlocked = sessionStorage.getItem('tribia-admin-unlocked') === 'true';
        if (!adminUnlocked) {
          // Sin admin, solo puedes editar tus pronósticos
          const firstUserId = get().users[0]?.id;
          if (currentUserId !== firstUserId && !adminUnlocked) {
            console.warn('❌ No tienes permiso para editar este pronóstico');
            return;
          }
        }

        const now = new Date().toISOString();
        const existing = get().predictions.find(
          p => p.userId === currentUserId && p.matchId === matchId
        );

        if (isSupabaseConfigured) {
          await supabase.from('predictions').upsert({
            id: existing?.id ?? `p-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
            user_id: currentUserId,
            match_id: matchId,
            home_score: homeScore,
            away_score: awayScore,
            updated_at: now,
            created_at: existing?.createdAt ?? now,
          }, { onConflict: 'user_id,match_id' });
        }

        set(state => {
          const exists = state.predictions.find(
            p => p.userId === currentUserId && p.matchId === matchId
          );
          if (exists) {
            return {
              predictions: state.predictions.map(p =>
                p.userId === currentUserId && p.matchId === matchId
                  ? { ...p, homeScore, awayScore, updatedAt: now }
                  : p
              ),
            };
          }
          return {
            predictions: [
              ...state.predictions,
              {
                id: `p-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
                userId: currentUserId,
                matchId,
                homeScore,
                awayScore,
                createdAt: now,
                updatedAt: now,
              },
            ],
          };
        });
      },

      getPrediction: (matchId, userId) => {
        const uid = userId || get().currentUserId;
        return get().predictions.find(p => p.userId === uid && p.matchId === matchId) || null;
      },

      getUserPredictions: (userId) => {
        const uid = userId || get().currentUserId;
        return get().predictions.filter(p => p.userId === uid);
      },

      // ─── Sincronización con Supabase ─────────────────────────
      syncFromSupabase: async () => {
        if (!isSupabaseConfigured) return;
        set({ loading: true, error: null });
        try {
          const data = await sbFetchAll();
          set({ ...data, loading: false, synced: true });
        } catch (err) {
          set({ loading: false, error: err.message });
        }
      },

      // Suscripción en tiempo real
      subscribeRealtime: () => {
        if (!isSupabaseConfigured) return () => {};

        const channel = supabase
          .channel('tribia-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
            get().syncFromSupabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, () => {
            get().syncFromSupabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results' }, () => {
            get().syncFromSupabase();
          })
          .subscribe();

        return () => supabase.removeChannel(channel);
      },

      // ─── Importar datos históricos ───────────────────────────
      importHistoricalData: async (data) => {
        if (isSupabaseConfigured) {
          // Upsert en Supabase
          if (data.users?.length) {
            await supabase.from('users').upsert(
              data.users.map(u => ({
                id: u.id, name: u.name, avatar: u.avatar, created_at: u.createdAt,
              })),
              { onConflict: 'id' }
            );
          }
          if (data.predictions?.length) {
            await supabase.from('predictions').upsert(
              data.predictions.map(p => ({
                id: p.id, user_id: p.userId, match_id: p.matchId,
                home_score: p.homeScore, away_score: p.awayScore,
                created_at: p.createdAt, updated_at: p.updatedAt,
              })),
              { onConflict: 'id' }
            );
          }
          if (data.matchResults) {
            const rows = Object.entries(data.matchResults).map(([match_id, r]) => ({
              match_id, home_score: r.homeScore, away_score: r.awayScore,
              status: r.status || 'finished', updated_at: new Date().toISOString(),
            }));
            if (rows.length) {
              await supabase.from('match_results').upsert(rows, { onConflict: 'match_id' });
            }
          }
          // Refrescar estado desde Supabase
          await get().syncFromSupabase();
        } else {
          // Fallback: merge en local
          set(state => {
            const newState = { ...state };
            if (data.users) {
              const existingIds = new Set(state.users.map(u => u.id));
              newState.users = [...state.users, ...data.users.filter(u => !existingIds.has(u.id))];
            }
            if (data.predictions) {
              const existingIds = new Set(state.predictions.map(p => p.id));
              newState.predictions = [...state.predictions, ...data.predictions.filter(p => !existingIds.has(p.id))];
            }
            if (data.matchResults) {
              newState.matchResults = { ...state.matchResults, ...data.matchResults };
            }
            return newState;
          });
        }
      },

      exportData: () => {
        const { users, predictions, matchResults } = get();
        return JSON.stringify({ users, predictions, matchResults }, null, 2);
      },

      clearAll: async () => {
        if (isSupabaseConfigured) {
          await Promise.all([
            supabase.from('predictions').delete().neq('id', ''),
            supabase.from('match_results').delete().neq('match_id', ''),
            supabase.from('users').delete().neq('id', ''),
          ]);
        }
        set({ users: [], predictions: [], matchResults: {}, currentUserId: null });
      },
    }),
    {
      name: 'tribia-2026-storage',
      version: 2,
      // Solo persiste currentUserId localmente (los demás vienen de Supabase)
      partialize: (state) => ({
        currentUserId: state.currentUserId,
        // Si Supabase no está configurado, persistir todo localmente
        ...(isSupabaseConfigured ? {} : {
          users: state.users,
          predictions: state.predictions,
          matchResults: state.matchResults,
        }),
      }),
    }
  )
);

export default useStore;
