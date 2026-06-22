import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store';
import { calcularTotalUsuario, isMatchToday, isMatchLive, formatMatchLocalTime } from '../utils/scoring';

export default function Home() {
  const { users, predictions, getAllMatches } = useStore();
  const matches = getAllMatches();

  const ranking = useMemo(() => {
    return users
      .map(user => {
        const stats = calcularTotalUsuario(user.id, predictions, matches);
        const puntosTotales = stats.total + (user.points || 0);
        return {
          user,
          stats,
          puntosTotales,
          totalPronosticos: predictions.filter(p => p.userId === user.id).length,
        };
      })
      .sort((a, b) => b.puntosTotales - a.puntosTotales || b.stats.aciertosExactos - a.stats.aciertosExactos);
  }, [users, predictions, matches]);

  // Usar fecha/hora local del usuario
  const todayMatches = matches.filter(m => isMatchToday(m)).length;
  const finishedMatches = matches.filter(m => m.status === 'finished').length;
  const upcomingMatches = matches.filter(m => m.status === 'scheduled').length;
  const liveMatches = matches.filter(m => isMatchLive(m)).length;

  // Pronósticos de hoy por partido
  const todayPredictions = useMemo(() => {
    const today = matches
      .filter(m => isMatchToday(m))
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    return today.map(match => {
      const userPreds = users.map(user => {
        const pred = predictions.find(p => p.userId === user.id && p.matchId === match.id);
        return {
          user,
          prediction: pred || null,
        };
      });
      return {
        match,
        userPredictions: userPreds,
        totalPredicted: userPreds.filter(up => up.prediction).length,
      };
    });
  }, [matches, users, predictions]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-yellow-950 border border-yellow-900/30 rounded-2xl p-6 text-center">
        <div className="text-5xl mb-2">🏆</div>
        <h1 className="text-3xl font-black text-yellow-400 mb-1">QUINELA 2026</h1>
        <p className="text-gray-400 text-sm">Pronósticos · Mundial de Fútbol · USA · México · Canadá</p>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <Link to="/partidos" className="text-center hover:scale-105 transition-transform cursor-pointer">
            <div className="text-2xl font-bold text-green-400">{finishedMatches}</div>
            <div className="text-gray-500 text-xs hover:text-green-400">Jugados</div>
          </Link>
          {liveMatches > 0 && (
            <Link to="/partidos" className="text-center hover:scale-105 transition-transform cursor-pointer">
              <div className="text-2xl font-bold text-red-400 animate-pulse">{liveMatches}</div>
              <div className="text-gray-500 text-xs hover:text-red-400">En vivo 🔴</div>
            </Link>
          )}
          {todayMatches > 0 && (
            <Link to="/partidos" className="text-center hover:scale-105 transition-transform cursor-pointer">
              <div className="text-2xl font-bold text-yellow-400">{todayMatches}</div>
              <div className="text-gray-500 text-xs hover:text-yellow-400">Hoy 📅</div>
            </Link>
          )}
          <Link to="/partidos" className="text-center hover:scale-105 transition-transform cursor-pointer">
            <div className="text-2xl font-bold text-blue-400">{upcomingMatches}</div>
            <div className="text-gray-500 text-xs hover:text-blue-400">Por jugar</div>
          </Link>
          <Link to="/usuarios" className="text-center hover:scale-105 transition-transform cursor-pointer">
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-gray-500 text-xs hover:text-white">Participantes</div>
          </Link>
        </div>
      </div>

      {/* Pronósticos de Hoy */}
      {todayPredictions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span>📅</span> Pronósticos de Hoy - {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </h2>

          <div className="card overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400 font-medium sticky left-0 bg-[#1a1f2e] z-10">
                    Participante
                  </th>
                  {todayPredictions.map(({ match }) => (
                    <th key={match.id} className="text-center p-2 font-medium min-w-[90px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1 text-base">
                          <span>{match.homeFlag}</span>
                          <span className="text-gray-500 text-xs">vs</span>
                          <span>{match.awayFlag}</span>
                        </div>
                        <div className="text-xs text-gray-500">{formatMatchLocalTime(match)}</div>
                      </div>
                    </th>
                  ))}
                  <th className="text-center p-2 text-yellow-400 font-medium min-w-[70px]">
                    Pts Hoy
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Fila de Resultado Real */}
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <td className="p-2 font-medium text-white sticky left-0 bg-gray-900/80 z-10">
                    Resultado Real
                  </td>
                  {todayPredictions.map(({ match }) => (
                    <td key={match.id} className="text-center p-2">
                      {match.status === 'finished' ? (
                        <span className="font-bold text-green-400">
                          {match.homeScore}–{match.awayScore}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  ))}
                  <td className="text-center p-2 text-gray-600">-</td>
                </tr>
                
                {/* Filas de usuarios */}
                {users.map(user => {
                  const userPredictionsToday = todayPredictions.map(({ match }) => {
                    return predictions.find(p => p.userId === user.id && p.matchId === match.id);
                  });
                  const hasPredictions = userPredictionsToday.some(p => p);
                  
                  return (
                    <tr key={user.id} className={`border-b border-gray-800 hover:bg-gray-900/30 transition-colors ${hasPredictions ? 'bg-yellow-950/10' : ''}`}>
                      <td className="p-2 sticky left-0 bg-[#1a1f2e] z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{user.avatar}</span>
                          <span className="font-medium text-white text-xs sm:text-sm truncate max-w-[100px]">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      {todayPredictions.map(({ match }) => {
                        const pred = predictions.find(p => p.userId === user.id && p.matchId === match.id);
                        return (
                          <td key={match.id} className="text-center p-2">
                            {pred ? (
                              <span className="font-bold text-white">
                                {pred.homeScore}–{pred.awayScore}
                              </span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center p-2 text-yellow-400 font-bold">
                        -
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de posiciones */}
      <div>
        <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <span>🏅</span> Tabla de Posiciones
        </h2>

        {users.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-gray-400 mb-4">Aún no hay participantes</p>
            <Link to="/usuarios" className="btn-primary inline-block">Agregar usuarios</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map(({ user, stats, puntosTotales, totalPronosticos }, idx) => (
              <div
                key={user.id}
                className={`card flex items-center gap-4 transition-all hover:border-gray-700 ${
                  idx === 0 ? 'border-yellow-500/50 bg-yellow-950/20' :
                  idx === 1 ? 'border-gray-400/30' :
                  idx === 2 ? 'border-amber-700/30' : ''
                }`}
              >
                {/* Posición */}
                <div className="text-center w-8 shrink-0">
                  {idx === 0 ? <span className="text-2xl">🥇</span> :
                   idx === 1 ? <span className="text-2xl">🥈</span> :
                   idx === 2 ? <span className="text-2xl">🥉</span> :
                   <span className="text-gray-500 font-bold text-lg">{idx + 1}</span>}
                </div>

                {/* Avatar y nombre */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-3xl">{user.avatar}</span>
                  <div>
                    <div className="font-bold text-white">{user.name}</div>
                    <div className="text-xs text-gray-500">{totalPronosticos} pronósticos</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex gap-4 text-center">
                  <div>
                    <div className="text-green-400 font-bold text-sm">{stats.aciertosExactos}</div>
                    <div className="text-xs text-gray-600">🎯 Exactos</div>
                  </div>
                  <div>
                    <div className="text-blue-400 font-bold text-sm">{stats.aciertosGanador}</div>
                    <div className="text-xs text-gray-600">✅ Ganador</div>
                  </div>
                  <div>
                    <div className="text-red-400 font-bold text-sm">{stats.fallidos}</div>
                    <div className="text-xs text-gray-600">❌ Fallidos</div>
                  </div>
                </div>

                {/* Puntos */}
                <div className="text-center shrink-0">
                  <div className="text-2xl font-black text-yellow-400">{puntosTotales}</div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reglas */}
      <div className="card bg-gray-900/50">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2"><span>📋</span> Reglas de Puntuación</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-green-400 mb-1">3 pts</div>
            <div className="text-sm text-green-300 font-medium">Marcador exacto</div>
            <div className="text-xs text-gray-400 mt-1">Ej: predices 2-1, sale 2-1</div>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-blue-400 mb-1">1 pt</div>
            <div className="text-sm text-blue-300 font-medium">Solo el ganador</div>
            <div className="text-xs text-gray-400 mt-1">Ej: predices 1-0, sale 2-0</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-gray-500 mb-1">0 pts</div>
            <div className="text-sm text-gray-400 font-medium">Pronóstico fallido</div>
            <div className="text-xs text-gray-500 mt-1">Ej: predices 1-0, sale 0-2</div>
          </div>
        </div>
      </div>
    </div>
  );
}
