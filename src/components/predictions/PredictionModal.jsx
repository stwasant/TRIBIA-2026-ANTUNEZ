import { useState } from 'react';
import { formatMatchLocalDateTime } from '../../utils/scoring';
import { ALL_MATCHES } from '../../data/matches';

// Últimos N partidos terminados de un equipo
function getTeamForm(teamName, currentMatchId, n = 5) {
  const finished = ALL_MATCHES.filter(m =>
    m.status === 'finished' &&
    m.id !== currentMatchId &&
    (m.home === teamName || m.away === teamName)
  ).sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff)).slice(0, n);

  return finished.map(m => {
    const isHome = m.home === teamName;
    const gf = isHome ? m.homeScore : m.awayScore;
    const gc = isHome ? m.awayScore : m.homeScore;
    if (gf > gc) return 'W';
    if (gf === gc) return 'D';
    return 'L';
  });
}

function FormBadge({ result }) {
  const styles = {
    W: 'bg-green-500 text-white',
    D: 'bg-yellow-500 text-gray-900',
    L: 'bg-red-500 text-white',
  };
  const labels = { W: 'G', D: 'E', L: 'P' };
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${styles[result]}`}>
      {labels[result]}
    </span>
  );
}

export default function PredictionModal({ match, prediction, onSave, onClose }) {
  const [homeScore, setHomeScore] = useState(
    prediction?.homeScore !== undefined ? String(prediction.homeScore) : ''
  );
  const [awayScore, setAwayScore] = useState(
    prediction?.awayScore !== undefined ? String(prediction.awayScore) : ''
  );
  const [penaltyWinner, setPenaltyWinner] = useState(prediction?.penaltyWinner || null);
  const [homePenalties, setHomePenalties] = useState(
    prediction?.homePenalties !== undefined ? String(prediction.homePenalties) : ''
  );
  const [awayPenalties, setAwayPenalties] = useState(
    prediction?.awayPenalties !== undefined ? String(prediction.awayPenalties) : ''
  );

  const homeForm = getTeamForm(match.home, match.id);
  const awayForm = getTeamForm(match.away, match.id);
  
  const isKnockout = match.phase !== 'group'; // Eliminación directa
  const isDraw = homeScore !== '' && awayScore !== '' && parseInt(homeScore) === parseInt(awayScore);
  const needsPenaltyPrediction = isKnockout && isDraw;

  const handleSave = () => {
    const h = parseInt(homeScore);
    const a = parseInt(awayScore);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    
    // Si es eliminación directa y hay empate, requiere ganador por penales
    if (needsPenaltyPrediction && !penaltyWinner) return;
    
    const predictionData = {
      homeScore: h,
      awayScore: a,
    };
    
    // Agregar datos de penales si aplica
    if (needsPenaltyPrediction) {
      predictionData.penaltyWinner = penaltyWinner;
      
      // Opcionalmente guardar marcador de penales si fue ingresado
      const hp = parseInt(homePenalties);
      const ap = parseInt(awayPenalties);
      if (!isNaN(hp) && !isNaN(ap) && hp >= 0 && ap >= 0) {
        predictionData.homePenalties = hp;
        predictionData.awayPenalties = ap;
      }
    }
    
    onSave(match.id, predictionData);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  const quickScores = [
    [0,0],[1,0],[0,1],[1,1],[2,0],[0,2],[2,1],[1,2],[2,2],[3,0],[0,3],[3,1],[1,3],[3,2],[2,3],
  ];

  const isValid = homeScore !== '' && awayScore !== '' && 
                  !isNaN(parseInt(homeScore)) && !isNaN(parseInt(awayScore)) && 
                  parseInt(homeScore) >= 0 && parseInt(awayScore) >= 0 &&
                  (!needsPenaltyPrediction || penaltyWinner !== null); // Requiere ganador si hay empate en eliminación

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Cabecera */}
        <h3 className="text-center text-lg font-bold text-white mb-1">Ingresa tu pronóstico</h3>
        <p className="text-center text-xs text-gray-400 mb-1">
          Marcador exacto = 3 pts · Solo ganador = 1 pt
        </p>
        <p className="text-center text-xs text-gray-500 mb-4">
          {formatMatchLocalDateTime(match)}{match.city ? ` · ${match.city}` : ''}
        </p>

        {/* Equipos + forma */}
        <div className="flex items-center justify-between mb-5 bg-gray-800 rounded-xl p-3">
          <div className="flex-1 text-center">
            <div className="text-3xl">{match.homeFlag}</div>
            <div className="text-xs font-medium text-white mt-1">{match.home}</div>
            {homeForm.length > 0 && (
              <div className="flex gap-1 justify-center mt-2">
                {homeForm.map((r, i) => <FormBadge key={i} result={r} />)}
              </div>
            )}
          </div>
          <div className="text-gray-500 font-bold">vs</div>
          <div className="flex-1 text-center">
            <div className="text-3xl">{match.awayFlag}</div>
            <div className="text-xs font-medium text-white mt-1">{match.away}</div>
            {awayForm.length > 0 && (
              <div className="flex gap-1 justify-center mt-2">
                {awayForm.map((r, i) => <FormBadge key={i} result={r} />)}
              </div>
            )}
          </div>
        </div>

        {/* Inputs de marcador */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <div className="text-center">
            <label className="text-xs text-gray-400 block mb-1">{match.home}</label>
            <input
              type="number"
              min="0"
              max="20"
              value={homeScore}
              onChange={e => setHomeScore(e.target.value)}
              onKeyDown={handleKeyDown}
              className="score-input"
              placeholder="0"
              autoFocus
            />
          </div>
          <div className="text-2xl font-black text-gray-500 mt-4">–</div>
          <div className="text-center">
            <label className="text-xs text-gray-400 block mb-1">{match.away}</label>
            <input
              type="number"
              min="0"
              max="20"
              value={awayScore}
              onChange={e => setAwayScore(e.target.value)}
              onKeyDown={handleKeyDown}
              className="score-input"
              placeholder="0"
            />
          </div>
        </div>

        {/* Marcadores rápidos */}
        <div className="mb-5">
          <p className="text-xs text-gray-500 text-center mb-2">Marcadores comunes</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {quickScores.map(([h, a]) => (
              <button
                key={`${h}-${a}`}
                onClick={() => { setHomeScore(String(h)); setAwayScore(String(a)); }}
                className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                  homeScore === String(h) && awayScore === String(a)
                    ? 'bg-yellow-500 border-yellow-500 text-gray-900 font-bold'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                {h}–{a}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de ganador por penales (solo en eliminación directa con empate) */}
        {needsPenaltyPrediction && (
          <div className="mb-5 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <p className="text-xs text-purple-300 text-center mb-3 font-medium">
              ⚽ Partido de eliminación directa con empate
            </p>
            <p className="text-xs text-gray-400 text-center mb-3">
              Selecciona quién ganará por penales
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPenaltyWinner('home')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  penaltyWinner === 'home'
                    ? 'bg-purple-500 border-purple-500 text-white font-bold'
                    : 'border-gray-700 text-gray-400 hover:border-purple-500/50 hover:text-white'
                }`}
              >
                <div className="text-2xl mb-1">{match.homeFlag}</div>
                <div className="text-xs">{match.home}</div>
              </button>
              <button
                onClick={() => setPenaltyWinner('away')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  penaltyWinner === 'away'
                    ? 'bg-purple-500 border-purple-500 text-white font-bold'
                    : 'border-gray-700 text-gray-400 hover:border-purple-500/50 hover:text-white'
                }`}
              >
                <div className="text-2xl mb-1">{match.awayFlag}</div>
                <div className="text-xs">{match.away}</div>
              </button>
            </div>
            
            {/* Opcional: Marcador de penales */}
            {penaltyWinner && (
              <div className="mt-3 pt-3 border-t border-purple-500/20">
                <p className="text-xs text-gray-400 text-center mb-2">Marcador de penales (opcional)</p>
                <div className="flex items-center justify-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={homePenalties}
                    onChange={e => setHomePenalties(e.target.value)}
                    className="w-16 text-center py-2 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="0"
                  />
                  <span className="text-gray-500">–</span>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={awayPenalties}
                    onChange={e => setAwayPenalties(e.target.value)}
                    className="w-16 text-center py-2 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSave} disabled={!isValid} className="btn-primary flex-1">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
