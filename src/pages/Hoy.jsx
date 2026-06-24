import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store';
import PredictionModal from '../components/predictions/PredictionModal';
import { calcularPuntos, isMatchToday, isMatchLive, formatMatchLocalTime, disponibleParaPronosticar, isAdminUnlocked } from '../utils/scoring';

function isMatchTomorrow(match) {
  if (!match?.kickoff) return false;
  const d = new Date(match.kickoff);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
}

export default function Hoy() {
  const { users, predictions, getAllMatches, currentUserId, getPrediction, setPrediction } = useStore();
  const matches = getAllMatches();
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [tab, setTab] = useState('hoy'); // 'hoy' | 'manana'
  const isAdmin = isAdminUnlocked();

  const todayMatches = useMemo(() =>
    matches.filter(m => isMatchToday(m)).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff)),
    [matches]
  );

  const tomorrowMatches = useMemo(() =>
    matches.filter(m => isMatchTomorrow(m)).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff)),
    [matches]
  );

  const activeMatches = tab === 'hoy' ? todayMatches : tomorrowMatches;

  // Tabla de pronósticos por partido y usuario
  const tableData = useMemo(() => {
    return activeMatches.map(match => {
      const userPreds = users.map(user => {
        const pred = predictions.find(p => p.userId === user.id && p.matchId === match.id);
        const hasResult = match.homeScore !== null && match.awayScore !== null;
        const pts = pred && hasResult
          ? calcularPuntos(pred.homeScore, pred.awayScore, match.homeScore, match.awayScore)
          : null;
        return { user, pred, pts };
      });
      return { match, userPreds };
    });
  }, [activeMatches, users, predictions]);

  const dateLabel = tab === 'hoy'
    ? new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : new Date(Date.now() + 86400000).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📅</span> Partidos del Día
          </h1>
          <p className="text-gray-500 text-sm capitalize">{dateLabel}</p>
        </div>
        {currentUserId && (
          <Link to="/pronosticos" className="btn-primary text-sm">
            🎯 Mis pronósticos
          </Link>
        )}
      </div>

      {/* Tabs Hoy / Mañana */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('hoy')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'hoy' ? 'bg-yellow-500 text-gray-950' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Hoy {todayMatches.length > 0 && <span className="ml-1 bg-yellow-700/50 text-yellow-200 rounded px-1">{todayMatches.length}</span>}
        </button>
        <button
          onClick={() => setTab('manana')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'manana' ? 'bg-yellow-500 text-gray-950' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Mañana {tomorrowMatches.length > 0 && <span className="ml-1 bg-gray-700 text-gray-300 rounded px-1">{tomorrowMatches.length}</span>}
        </button>
      </div>

      {/* Sin partidos */}
      {activeMatches.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">😴</div>
          <p className="text-gray-400">No hay partidos programados para {tab === 'hoy' ? 'hoy' : 'mañana'}</p>
        </div>
      )}

      {/* Tabla por partido */}
      {tableData.map(({ match, userPreds }) => {
        const isLive = isMatchLive(match);
        const isFinished = match.status === 'finished';
        const hasResult = match.homeScore !== null && match.awayScore !== null;

        return (
          <div key={match.id} className={`card ${isLive ? 'border-red-500/50 shadow-red-500/10 shadow-lg' : ''}`}>
            {/* Cabecera del partido */}
            <div className="flex items-center gap-4 mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-3 flex-1">
                <div className="text-center w-16">
                  <div className="text-3xl">{match.homeFlag}</div>
                  <div className="text-xs text-white font-medium mt-1 leading-tight">{match.home}</div>
                </div>

                <div className="flex-1 text-center">
                  {hasResult ? (
                    <div className={`text-2xl font-black ${isFinished ? 'text-white' : 'text-red-400 animate-pulse'}`}>
                      {match.homeScore} – {match.awayScore}
                    </div>
                  ) : (
                    <div className="text-yellow-400 font-bold text-lg">{formatMatchLocalTime(match)}</div>
                  )}
                  <div className="text-xs mt-1">
                    {isLive && <span className="text-red-400 animate-pulse font-medium">🔴 EN VIVO</span>}
                    {isFinished && <span className="text-gray-500">Finalizado</span>}
                    {!isLive && !isFinished && <span className="text-gray-600">{match.city}</span>}
                  </div>
                </div>

                <div className="text-center w-16">
                  <div className="text-3xl">{match.awayFlag}</div>
                  <div className="text-xs text-white font-medium mt-1 leading-tight">{match.away}</div>
                </div>
              </div>

              {/* Botón pronosticar si el usuario actual no ha pronosticado */}
              {currentUserId && disponibleParaPronosticar(match, isAdmin) && (
                <button
                  onClick={() => setSelectedMatch(match)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    predictions.find(p => p.userId === currentUserId && p.matchId === match.id)
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'btn-primary'
                  }`}
                >
                  {predictions.find(p => p.userId === currentUserId && p.matchId === match.id)
                    ? '✏️ Editar'
                    : '🎯 Pronosticar'}
                </button>
              )}
            </div>

            {/* Grid de predicciones de usuarios */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {userPreds.map(({ user, pred, pts }) => {
                const colorClass = pts === 3 ? 'border-green-500/50 bg-green-950/30' :
                                   pts === 1 ? 'border-blue-500/50 bg-blue-950/30' :
                                   pts === 0 ? 'border-red-500/30 bg-red-950/20' :
                                   pred ? 'border-yellow-900/50 bg-yellow-950/20' :
                                   'border-gray-800 bg-gray-800/20';
                const scoreColor = pts === 3 ? 'text-green-400' :
                                   pts === 1 ? 'text-blue-400' :
                                   pts === 0 ? 'text-red-400' : 'text-white';
                const badge = pts === 3 ? '🎯' : pts === 1 ? '✅' : pts === 0 ? '❌' : '';

                return (
                  <div key={user.id} className={`rounded-lg border p-2 text-center transition-colors ${colorClass}`}>
                    <div className="text-xl mb-1">{user.avatar}</div>
                    <div className="text-xs text-gray-400 truncate mb-1">{user.name}</div>
                    {pred ? (
                      <div className={`text-sm font-bold ${scoreColor}`}>
                        {pred.homeScore}–{pred.awayScore} {badge}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600">Sin pronóstico</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Modal de pronóstico */}
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
