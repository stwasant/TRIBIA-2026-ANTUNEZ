import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store';
import MatchCard from '../components/matches/MatchCard';
import PredictionModal from '../components/predictions/PredictionModal';
import { calcularPuntos, disponibleParaPronosticar, isAdminUnlocked } from '../utils/scoring';

export default function Pronosticos() {
  const { getAllMatches, getPrediction, getUserPredictions, setPrediction, currentUserId, users } = useStore();
  const matches = getAllMatches();
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewUserId, setViewUserId] = useState(null);
  const adminUnlocked = sessionStorage.getItem('tribia-admin-unlocked') === 'true';
  const isAdmin = isAdminUnlocked();

  const activeUserId = viewUserId || currentUserId;
  const predictions = getUserPredictions(activeUserId);
  const isViewingOthers = viewUserId && viewUserId !== currentUserId;
  const canEdit = !isViewingOthers || adminUnlocked;
  const activeUser = users.find(u => u.id === activeUserId);

  const matchesWithPred = useMemo(() => {
    return matches
      .filter(m => {
        const pred = predictions.find(p => p.matchId === m.id);
        if (filter === 'predicted') return !!pred;
        if (filter === 'unpredicted') return !pred && disponibleParaPronosticar(m, isAdmin);
        if (filter === 'finished') return m.status === 'finished';
        return true;
      })
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
      .map(m => ({
        match: m,
        prediction: predictions.find(p => p.matchId === m.id) || null,
      }));
  }, [matches, predictions, filter]);

  const totalPoints = useMemo(() => {
    let pts = 0;
    predictions.forEach(p => {
      const m = matches.find(x => x.id === p.matchId);
      if (m) {
        const v = calcularPuntos(p.homeScore, p.awayScore, m.homeScore, m.awayScore);
        if (v !== null) pts += v;
      }
    });
    // Sumar puntos base del usuario (misma lógica que Home)
    const basePoints = activeUser?.points || 0;
    return pts + basePoints;
  }, [predictions, matches, activeUser]);

  const scheduledWithoutPred = matches.filter(
    m => disponibleParaPronosticar(m, isAdmin) && !predictions.find(p => p.matchId === m.id)
  ).length;

  if (!currentUserId && !viewUserId) {
    return (
      <div className="card text-center py-16 max-w-md mx-auto mt-10">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-xl font-bold text-white mb-2">Selecciona un usuario</h2>
        <p className="text-gray-400 mb-6 text-sm">
          Para ver o ingresar pronósticos, primero selecciona o crea un usuario
        </p>
        <Link to="/usuarios" className="btn-primary">Ir a Usuarios</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🎯</span> Pronósticos
          </h1>
          {isViewingOthers && !adminUnlocked && (
            <p className="text-xs text-gray-500 mt-1">👁️ Ver pronósticos de otro usuario (solo lectura)</p>
          )}
        </div>

        {/* Selector de usuario para ver otros */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Ver:</span>
          <select
            value={activeUserId || ''}
            onChange={e => setViewUserId(e.target.value || null)}
            className="input text-sm py-1"
            style={{ width: 'auto' }}
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.avatar} {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats del usuario */}
      {activeUser && (
        <div className="card bg-gradient-to-r from-yellow-950/40 to-gray-900 border-yellow-900/30">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-4xl">{activeUser.avatar}</span>
            <div className="flex-1">
              <h2 className="font-bold text-white text-lg">{activeUser.name}</h2>
              <div className="flex flex-wrap gap-3 mt-1 text-sm">
                <span className="text-yellow-400 font-bold">{totalPoints} puntos</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-400">{predictions.length} pronósticos</span>
                {scheduledWithoutPred > 0 && activeUserId === currentUserId && (
                  <>
                    <span className="text-gray-500">·</span>
                    <span className="text-orange-400">{scheduledWithoutPred} sin pronosticar</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'predicted', label: 'Con pronóstico' },
          { key: 'unpredicted', label: 'Sin pronosticar' },
          { key: 'finished', label: 'Terminados' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-yellow-500 text-gray-950'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="grid gap-3 md:grid-cols-2">
        {matchesWithPred.map(({ match, prediction }) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={prediction}
            onPredict={canEdit ? (m) => setSelectedMatch(m) : null}
          />
        ))}
      </div>

      {matchesWithPred.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-400">No hay partidos que mostrar con este filtro</p>
        </div>
      )}

      {/* Modal */}
      {selectedMatch && (
        <PredictionModal
          match={selectedMatch}
          prediction={getPrediction(selectedMatch.id)}
          onSave={setPrediction}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
