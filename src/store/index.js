import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ALL_MATCHES } from '../data/matches';
import { calcularPuntos } from '../utils/scoring';

const useStore = create(
  persist(
    (set, get) => ({
      // ─── Usuarios ───────────────────────────────────────────
      users: [],
      currentUserId: null,

      addUser: (name, avatar) => {
        const newUser = {
          id: `u-${Date.now()}`,
          name: name.trim(),
          avatar,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ users: [...state.users, newUser] }));
        return newUser.id;
      },

      removeUser: (userId) => {
        set(state => ({
          users: state.users.filter(u => u.id !== userId),
          predictions: state.predictions.filter(p => p.userId !== userId),
          currentUserId: state.currentUserId === userId ? null : state.currentUserId,
        }));
      },

      setCurrentUser: (userId) => set({ currentUserId: userId }),

      // ─── Partidos (resultados) ───────────────────────────────
      matchResults: {}, // { [matchId]: { homeScore, awayScore, status } }

      setMatchResult: (matchId, homeScore, awayScore) => {
        set(state => ({
          matchResults: {
            ...state.matchResults,
            [matchId]: { homeScore, awayScore, status: 'finished' },
          },
        }));
      },

      clearMatchResult: (matchId) => {
        set(state => {
          const updated = { ...state.matchResults };
          delete updated[matchId];
          return { matchResults: updated };
        });
      },

      // Devuelve datos del partido (datos base + resultado si existe en store)
      getMatch: (matchId) => {
        const base = ALL_MATCHES.find(m => m.id === matchId);
        if (!base) return null;
        const override = get().matchResults[matchId];
        if (override) return { ...base, ...override };
        return base;
      },

      // Devuelve todos los partidos con resultados actualizados
      getAllMatches: () => {
        const { matchResults } = get();
        return ALL_MATCHES.map(m => {
          const override = matchResults[m.id];
          return override ? { ...m, ...override } : m;
        });
      },

      // ─── Predicciones ────────────────────────────────────────
      predictions: [],

      setPrediction: (matchId, homeScore, awayScore) => {
        const { currentUserId } = get();
        if (!currentUserId) return;

        set(state => {
          const existing = state.predictions.find(
            p => p.userId === currentUserId && p.matchId === matchId
          );
          if (existing) {
            return {
              predictions: state.predictions.map(p =>
                p.id === existing.id
                  ? { ...p, homeScore, awayScore, updatedAt: new Date().toISOString() }
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
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

      // ─── Cargar datos históricos (bulk import) ───────────────
      importHistoricalData: (data) => {
        // data: { users?, predictions?, matchResults? }
        set(state => {
          const newState = { ...state };

          if (data.users) {
            const existingIds = new Set(state.users.map(u => u.id));
            const newUsers = data.users.filter(u => !existingIds.has(u.id));
            newState.users = [...state.users, ...newUsers];
          }

          if (data.predictions) {
            const existingIds = new Set(state.predictions.map(p => p.id));
            const newPreds = data.predictions.filter(p => !existingIds.has(p.id));
            newState.predictions = [...state.predictions, ...newPreds];
          }

          if (data.matchResults) {
            newState.matchResults = { ...state.matchResults, ...data.matchResults };
          }

          return newState;
        });
      },

      // ─── Exportar datos ──────────────────────────────────────
      exportData: () => {
        const { users, predictions, matchResults } = get();
        return JSON.stringify({ users, predictions, matchResults }, null, 2);
      },

      // ─── Limpiar todo ────────────────────────────────────────
      clearAll: () => set({ users: [], predictions: [], matchResults: {}, currentUserId: null }),
    }),
    {
      name: 'tribia-2026-storage',
      version: 1,
    }
  )
);

export default useStore;
