import { calcularPuntos, formatMatchLocalDate, formatMatchLocalTime, disponibleParaPronosticar, isMatchLive } from '../../utils/scoring';
import { PHASES } from '../../data/matches';

export default function MatchCard({ match, prediction, onPredict, showPrediction = true, compact = false }) {
  const isFinished = match.status === 'finished';
  const isLive = isMatchLive(match);
  const hasResult = match.homeScore !== null && match.awayScore !== null;
  const hasPrediction = prediction && prediction.homeScore !== null;
  const canPredict = disponibleParaPronosticar(match);

  const points = hasPrediction && hasResult
    ? calcularPuntos(prediction.homeScore, prediction.awayScore, match.homeScore, match.awayScore)
    : null;

  const pointsBadge = () => {
    if (points === null) return null;
    if (points === 3) return <span className="badge bg-green-500/20 text-green-400 border border-green-500/30">+3 pts 🎯</span>;
    if (points === 1) return <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30">+1 pt ✅</span>;
    return <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">0 pts ❌</span>;
  };

  const phaseLabel = match.phase !== 'group'
    ? <span className="text-xs text-purple-400 font-medium">{PHASES[match.phase] || match.phase}</span>
    : <span className="text-xs text-gray-500">Grupo {match.group} · Jornada {match.matchday}</span>;

  if (compact) {
    return (
      <div className="card hover:border-gray-700 transition-colors cursor-pointer" onClick={() => onPredict?.(match)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{match.homeFlag}</span>
            <span className="text-sm font-medium truncate">{match.home}</span>
          </div>
          <div className="text-center px-2">
            {hasResult
              ? <span className="text-white font-bold text-sm">{match.homeScore}–{match.awayScore}</span>
              : <span className="text-gray-500 text-xs">vs</span>
            }
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="text-sm font-medium truncate text-right">{match.away}</span>
            <span className="text-lg">{match.awayFlag}</span>
          </div>
          {hasPrediction && (
            <div className="ml-2 text-xs text-gray-400 whitespace-nowrap">
              {prediction.homeScore}–{prediction.awayScore}
            </div>
          )}
          {pointsBadge()}
        </div>
      </div>
    );
  }

  return (
    <div className={`card transition-all ${isLive ? 'border-red-500/50 shadow-red-500/10 shadow-lg' : 'hover:border-gray-700'}`}>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {phaseLabel}
          {isLive && (
            <span className="badge bg-red-500 text-white animate-pulse">🔴 EN VIVO</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">{formatMatchLocalDate(match)}</div>
          <div className="text-xs text-gray-500">
            {isFinished ? 'Finalizado' : isLive ? 'En juego' : formatMatchLocalTime(match)} · {match.city}
          </div>
        </div>
      </div>

      {/* Equipos y marcador */}
      <div className="flex items-center justify-between gap-3">
        {/* Local */}
        <div className="flex-1 text-center">
          <div className="text-3xl mb-1">{match.homeFlag}</div>
          <div className="text-sm font-semibold text-white leading-tight">{match.home}</div>
        </div>

        {/* Marcador */}
        <div className="text-center min-w-[80px]">
          {hasResult ? (
            <div className={`text-2xl font-black ${isFinished ? 'text-white' : 'text-red-400 animate-pulse'}`}>
              {match.homeScore} – {match.awayScore}
            </div>
          ) : (
            <div className="text-gray-600 font-bold text-lg">vs</div>
          )}
          {!hasResult && !isLive && (
            <div className="text-xs text-gray-500 mt-1">{formatMatchLocalTime(match)}</div>
          )}
        </div>

        {/* Visitante */}
        <div className="flex-1 text-center">
          <div className="text-3xl mb-1">{match.awayFlag}</div>
          <div className="text-sm font-semibold text-white leading-tight">{match.away}</div>
        </div>
      </div>

      {/* Pronóstico del usuario */}
      {showPrediction && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          {hasPrediction ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Tu pronóstico:</span>
                <span className="text-sm font-bold text-yellow-400">
                  {prediction.homeScore} – {prediction.awayScore}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {pointsBadge()}
                {canPredict && onPredict && (
                  <button
                    onClick={() => onPredict(match)}
                    className="text-xs text-gray-400 hover:text-white underline"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Sin pronóstico</span>
              {canPredict && onPredict && (
                <button
                  onClick={() => onPredict(match)}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Pronosticar
                </button>
              )}
              {!canPredict && (
                <span className="text-xs text-gray-600">Partido cerrado</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
