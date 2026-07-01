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
    penaltyWinner: p.penalty_winner || null,
    homePenalties: p.home_penalties ?? null,
    awayPenalties: p.away_penalties ?? null,
    createdAt: p.created_at, updatedAt: p.updated_at,
  }));

  const matchResults = {};
  (resultsRes.data || []).forEach(r => {
    matchResults[r.match_id] = {
      homeScore: r.home_score, awayScore: r.away_score, status: r.status,
      homePenalties: r.home_penalties ?? null,
      awayPenalties: r.away_penalties ?? null,
      updatedAt: r.updated_at ?? null,
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

      // ─── Actualizaciones de equipos (R32, etc.) ─────────
      matchUpdates: {},

      updateMatchTeams: async (updates) => {
        // updates: [{matchId, home, away, homeFlag, awayFlag}]
        if (!updates || updates.length === 0) return;

        const newUpdates = { ...get().matchUpdates };
        updates.forEach(update => {
          newUpdates[update.matchId] = {
            home: update.home,
            away: update.away,
            homeFlag: update.homeFlag,
            awayFlag: update.awayFlag,
          };
          console.log(`[Store] Updated ${update.matchId}: ${update.home} vs ${update.away}`);
        });

        set({ matchUpdates: newUpdates });

        // Opcionalmente guardar en Supabase (crear tabla match_updates si es necesario)
        // Por ahora solo en localStorage via persist
      },

      // ─── Resultados de partidos ─────────────────
      matchResults: {},

      setLiveScore: async (matchId, homeScore, awayScore, homePenalties, awayPenalties) => {
        const nowIso = new Date().toISOString();
        if (isSupabaseConfigured) {
          await supabase.from('match_results').upsert({
            match_id: matchId,
            home_score: homeScore,
            away_score: awayScore,
            home_penalties: homePenalties,
            away_penalties: awayPenalties,
            status: 'live',
            updated_at: nowIso,
          }, { onConflict: 'match_id' });
        }
        set(state => ({
          matchResults: {
            ...state.matchResults,
            [matchId]: { 
              homeScore, 
              awayScore, 
              homePenalties, 
              awayPenalties,
              status: 'live',
              updatedAt: nowIso,
            },
          },
        }));
      },

      setMatchResult: async (matchId, homeScore, awayScore, homePenalties, awayPenalties) => {
        // Evitar re-escribir (y refrescar updatedAt) si el resultado no cambió.
        // Esto mantiene updatedAt como "cuándo se estableció el resultado".
        const existing = get().matchResults[matchId];
        if (existing && existing.status === 'finished'
            && existing.homeScore === homeScore && existing.awayScore === awayScore
            && (existing.homePenalties ?? null) === (homePenalties ?? null)
            && (existing.awayPenalties ?? null) === (awayPenalties ?? null)) {
          return;
        }

        const nowIso = new Date().toISOString();
        if (isSupabaseConfigured) {
          await supabase.from('match_results').upsert({
            match_id: matchId,
            home_score: homeScore,
            away_score: awayScore,
            home_penalties: homePenalties,
            away_penalties: awayPenalties,
            status: 'finished',
            updated_at: nowIso,
          }, { onConflict: 'match_id' });
        }
        set(state => ({
          matchResults: {
            ...state.matchResults,
            [matchId]: { 
              homeScore, 
              awayScore, 
              homePenalties,
              awayPenalties,
              status: 'finished',
              updatedAt: nowIso,
            },
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
        const { matchResults, matchUpdates } = get();
        return ALL_MATCHES.map(m => {
          const resultOverride = matchResults[m.id];
          const teamUpdate = matchUpdates[m.id];
          
          // Apply both team updates and result overrides
          let match = { ...m };
          if (teamUpdate) {
            match = { ...match, ...teamUpdate };
          }
          if (resultOverride) {
            match = { ...match, ...resultOverride };
          }
          
          return match;
        });
      },

      // ─── Predicciones ────────────────────────────────────────
      predictions: [],

      setPrediction: async (matchId, predictionData) => {
        const { currentUserId } = get();
        if (!currentUserId) return;

        // predictionData puede ser:
        // { homeScore, awayScore } para fase de grupos
        // { homeScore, awayScore, penaltyWinner, homePenalties?, awayPenalties? } para eliminación directa con empate
        const { homeScore, awayScore, penaltyWinner, homePenalties, awayPenalties } = predictionData;

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
            penalty_winner: penaltyWinner || null,
            home_penalties: homePenalties || null,
            away_penalties: awayPenalties || null,
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
                  ? { 
                      ...p, 
                      homeScore, 
                      awayScore, 
                      penaltyWinner: penaltyWinner || null,
                      homePenalties: homePenalties || null,
                      awayPenalties: awayPenalties || null,
                      updatedAt: now 
                    }
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
                penaltyWinner: penaltyWinner || null,
                homePenalties: homePenalties || null,
                awayPenalties: awayPenalties || null,
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
                penalty_winner: p.penaltyWinner || null,
                home_penalties: p.homePenalties ?? null,
                away_penalties: p.awayPenalties ?? null,
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
        matchUpdates: state.matchUpdates, // Persist team updates for R32
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
