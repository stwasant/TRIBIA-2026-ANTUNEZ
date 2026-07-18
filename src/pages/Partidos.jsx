import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import useStore from '../store';
import { GROUPS, PHASES } from '../data/matches';
import MatchCard from '../components/matches/MatchCard';
import PredictionModal from '../components/predictions/PredictionModal';
import { isMatchToday, isMatchLive, hasMatchStarted } from '../utils/scoring';

const PHASES_FILTER = [
  { key: 'all', label: 'Todos' },
  { key: 'today', label: '📅 Hoy' },
  { key: 'live', label: '🔴 En Vivo' },
  { key: 'finished', label: '✅ Jugados' },
  { key: 'upcoming', label: '⏳ Por Jugar' },
  { key: 'group', label: 'Grupos' },
  { key: 'r32', label: 'Ronda 32' },
  { key: 'r16', label: 'Octavos' },
  { key: 'qf', label: 'Cuartos' },
  { key: 'sf', label: 'Semis' },
  { key: 'final', label: 'Final' },
];

export default function Partidos() {
  const { getAllMatches, getPrediction, setPrediction, currentUserId } = useStore();
  const matches = getAllMatches();
  const [searchParams] = useSearchParams();

  const [phaseFilter, setPhaseFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Leer filtro desde query params al cargar
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && PHASES_FILTER.some(f => f.key === filterParam)) {
      setPhaseFilter(filterParam);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = matches;
    
    // Filtro especial para "Hoy" - usa fecha local del usuario
    if (phaseFilter === 'today') {
      list = list.filter(m => isMatchToday(m));
    }
    // Filtro para "En Vivo"
    else if (phaseFilter === 'live') {
      list = list.filter(m => isMatchLive(m));
    }
    // Filtro para "Jugados"
    else if (phaseFilter === 'finished') {
      list = list.filter(m => m.status === 'finished');
    }
    // Filtro para "Por Jugar"
    else if (phaseFilter === 'upcoming') {
      list = list.filter(m => m.status === 'scheduled' && !hasMatchStarted(m));
    }
    // Filtros por fase
    else if (phaseFilter !== 'all') {
      list = list.filter(m => m.phase === phaseFilter);
    }
    
    // Filtro adicional por grupo (solo cuando se filtra por fase de grupos)
    if (groupFilter !== 'all' && phaseFilter === 'group') {
      list = list.filter(m => m.group === groupFilter);
    }
    
    // Ordenar por jornada (matchday) ascendente, luego por fecha de inicio
    list.sort((a, b) => {
      const hasMatchdayA = a.matchday !== undefined && a.matchday !== null;
      const hasMatchdayB = b.matchday !== undefined && b.matchday !== null;
      
      // Si solo uno tiene matchday, el que tiene va primero
      if (hasMatchdayA && !hasMatchdayB) return -1;
      if (!hasMatchdayA && hasMatchdayB) return 1;
      
      // Si ambos tienen matchday, comparar por matchday
      if (hasMatchdayA && hasMatchdayB) {
        if (a.matchday !== b.matchday) {
          return a.matchday - b.matchday;
        }
      }
      
      // Si matchday es igual o ambos no tienen matchday, ordenar por fecha de inicio
      return new Date(a.kickoff) - new Date(b.kickoff);
    });
    
    return list;
  }, [matches, phaseFilter, groupFilter]);

  const handlePredict = (match) => {
    if (!currentUserId) {
      alert('Selecciona un usuario primero desde la sección "Usuarios"');
      return;
    }
    setSelectedMatch(match);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <span>⚽</span> Partidos Mundial 2026
      </h1>

      {/* Filtros de fase */}
      <div className="flex flex-wrap gap-2">
        {PHASES_FILTER.map(f => (
          <button
            key={f.key}
            onClick={() => { setPhaseFilter(f.key); if (f.key !== 'group') setGroupFilter('all'); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              phaseFilter === f.key
                ? 'bg-yellow-500 text-gray-950'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtro de grupo (solo cuando se filtra por fase de grupos) */}
      {phaseFilter === 'group' && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGroupFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              groupFilter === 'all' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Todos los grupos
          </button>
          {GROUPS.map(g => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                groupFilter === g ? 'bg-gray-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Grupo {g}
            </button>
          ))}
        </div>
      )}

      {/* Contador y nota informativa */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">{filtered.length} partido{filtered.length !== 1 ? 's' : ''}</p>
        {phaseFilter === 'today' && filtered.length > 0 && (
          <p className="text-xs text-gray-600 italic">
            ⏰ Horarios en tu hora local
          </p>
        )}
      </div>

      {/* Lista de partidos */}
      {phaseFilter === 'group' && groupFilter === 'all' ? (
        // Mostrar por grupos
        <div className="space-y-6">
          {GROUPS.map(g => {
            const groupMatches = filtered.filter(m => m.group === g);
            if (groupMatches.length === 0) return null;
            return (
              <div key={g}>
                <h2 className="text-lg font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <span className="bg-gray-700 px-2 py-0.5 rounded text-sm">Grupo {g}</span>
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {groupMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={currentUserId ? getPrediction(match.id) : null}
                      onPredict={handlePredict}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={currentUserId ? getPrediction(match.id) : null}
              onPredict={handlePredict}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-400">No hay partidos con ese filtro</p>
        </div>
      )}

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
