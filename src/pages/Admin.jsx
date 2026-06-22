import { useState, useMemo } from 'react';
import useStore from '../store';
import { GROUPS } from '../data/matches';
import { isSupabaseConfigured } from '../lib/supabase';
import { formatMatchLocalDate, formatMatchLocalTime } from '../utils/scoring';

export default function Admin() {
  const { getAllMatches, setMatchResult, clearMatchResult, exportData, importHistoricalData, clearAll } = useStore();
  const matches = getAllMatches();

  const [tab, setTab] = useState('results');
  const [groupFilter, setGroupFilter] = useState('A');
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [editScores, setEditScores] = useState({}); // { [matchId]: { home, away } }

  // ─── Protección por PIN (definido en VITE_ADMIN_PIN) ────────
  const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN;
  const [unlocked, setUnlocked] = useState(
    () => !ADMIN_PIN || sessionStorage.getItem('tribia-admin-unlocked') === '1'
  );
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleUnlock = (e) => {
    e?.preventDefault();
    if (pinInput === ADMIN_PIN) {
      sessionStorage.setItem('tribia-admin-unlocked', '1');
      setUnlocked(true);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('PIN incorrecto. Inténtalo de nuevo.');
      setPinInput('');
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem('tribia-admin-unlocked');
    setUnlocked(false);
  };

  const groupMatches = useMemo(() => {
    return matches.filter(m => m.phase === 'group' && m.group === groupFilter);
  }, [matches, groupFilter]);

  const knockoutMatches = useMemo(() => {
    return matches.filter(m => m.phase !== 'group');
  }, [matches]);

  const handleScoreChange = (matchId, field, value) => {
    setEditScores(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value },
    }));
  };

  const handleSaveResult = (matchId) => {
    const scores = editScores[matchId];
    if (!scores) return;
    const h = parseInt(scores.home ?? '');
    const a = parseInt(scores.away ?? '');
    if (!isNaN(h) && !isNaN(a) && h >= 0 && a >= 0) {
      setMatchResult(matchId, h, a);
    }
  };

  const handleClearResult = (matchId) => {
    clearMatchResult(matchId);
    setEditScores(prev => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tribia-2026-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setImportError('');
    setImportSuccess('');
    try {
      const data = JSON.parse(importJson);
      importHistoricalData(data);
      setImportSuccess('✅ Datos importados correctamente');
      setImportJson('');
    } catch {
      setImportError('❌ JSON inválido. Verifica el formato del archivo.');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('¿Eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      clearAll();
    }
  };

  const ResultRow = ({ match }) => {
    const currentHome = editScores[match.id]?.home ?? (match.homeScore !== null ? String(match.homeScore) : '');
    const currentAway = editScores[match.id]?.away ?? (match.awayScore !== null ? String(match.awayScore) : '');
    const hasResult = match.homeScore !== null;

    return (
      <div className={`card flex flex-wrap items-center gap-3 text-sm ${hasResult ? 'border-green-900/30' : ''}`}>
        {/* Fecha */}
        <div className="text-gray-500 text-xs w-20 shrink-0">
          {formatMatchLocalDate(match)}<br />{formatMatchLocalTime(match)}
        </div>

        {/* Partido */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span>{match.homeFlag}</span>
          <span className="font-medium text-white truncate">{match.home}</span>
          <span className="text-gray-500 font-bold">vs</span>
          <span className="font-medium text-white truncate">{match.away}</span>
          <span>{match.awayFlag}</span>
        </div>

        {/* Resultado actual */}
        {hasResult && (
          <span className="text-green-400 font-bold">
            {match.homeScore}–{match.awayScore}
          </span>
        )}

        {/* Inputs */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number" min="0" max="20"
            value={currentHome}
            onChange={e => handleScoreChange(match.id, 'home', e.target.value)}
            className="w-12 text-center bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white text-sm focus:border-yellow-500 focus:outline-none"
            placeholder="–"
          />
          <span className="text-gray-500 font-bold">–</span>
          <input
            type="number" min="0" max="20"
            value={currentAway}
            onChange={e => handleScoreChange(match.id, 'away', e.target.value)}
            className="w-12 text-center bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white text-sm focus:border-yellow-500 focus:outline-none"
            placeholder="–"
          />
          <button
            onClick={() => handleSaveResult(match.id)}
            className="bg-green-700 hover:bg-green-600 text-white text-xs px-2 py-1 rounded transition-colors"
          >
            ✓
          </button>
          {hasResult && (
            <button
              onClick={() => handleClearResult(match.id)}
              className="text-red-500 hover:text-red-400 text-xs px-1"
              title="Borrar resultado"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  };

  // Bloqueo: si hay PIN configurado y no se ha desbloqueado, pedirlo
  if (!unlocked) {
    return (
      <div className="max-w-sm mx-auto mt-10">
        <form onSubmit={handleUnlock} className="card space-y-4 text-center">
          <div className="text-4xl">🔒</div>
          <h1 className="text-xl font-bold text-white">Panel de Administración</h1>
          <p className="text-sm text-gray-400">
            Ingresa el PIN de administrador para acceder.
          </p>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            placeholder="PIN"
            className="input text-center tracking-widest"
          />
          {pinError && <p className="text-sm text-red-400">{pinError}</p>}
          <button type="submit" className="btn-primary w-full">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>⚙️</span> Panel de Administración
        </h1>
        {ADMIN_PIN && (
          <button
            onClick={handleLock}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5"
          >
            🔒 Bloquear
          </button>
        )}
      </div>

      {!ADMIN_PIN && (
        <div className="card border-orange-900/40 bg-orange-950/10 text-sm text-orange-300">
          ⚠️ No hay PIN configurado (<code>VITE_ADMIN_PIN</code> en <code>.env.local</code>). El panel está sin protección.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-0">
        {[
          { key: 'results', label: '📝 Resultados' },
        { key: 'import', label: '📥 Importar/Exportar' },
        { key: 'supabase', label: '🔗 Supabase' },
        { key: 'danger', label: '⚠️ Peligro' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Resultados */}
      {tab === 'results' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Ingresa los resultados oficiales de cada partido. Al guardar, los puntos se calculan automáticamente para todos los usuarios.
          </p>

          {/* Selector de grupo */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {GROUPS.map(g => (
                <button
                  key={g}
                  onClick={() => setGroupFilter(g)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    groupFilter === g ? 'bg-yellow-500 text-gray-950' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Grupo {g}
                </button>
              ))}
              <button
                onClick={() => setGroupFilter('knockout')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  groupFilter === 'knockout' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                🏆 Eliminatorias
              </button>
            </div>

            <div className="space-y-2">
              {groupFilter === 'knockout'
                ? knockoutMatches.map(m => <ResultRow key={m.id} match={m} />)
                : groupMatches.map(m => <ResultRow key={m.id} match={m} />)
              }
            </div>
          </div>
        </div>
      )}

      {/* Tab: Importar/Exportar */}
      {tab === 'import' && (
        <div className="space-y-6">
          {/* Exportar */}
          <div className="card">
            <h3 className="font-bold text-white mb-2">📤 Exportar datos</h3>
            <p className="text-sm text-gray-400 mb-3">
              Descarga un archivo JSON con todos los usuarios, pronósticos y resultados. 
              Compártelo con otros participantes para sincronizar datos.
            </p>
            <button onClick={handleExport} className="btn-primary">
              Descargar JSON
            </button>
          </div>

          {/* Importar */}
          <div className="card">
            <h3 className="font-bold text-white mb-2">📥 Importar datos históricos</h3>
            <p className="text-sm text-gray-400 mb-3">
              Pega el contenido de un archivo JSON exportado previamente. Los datos nuevos se agregarán sin duplicar los existentes.
            </p>
            <textarea
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              className="input mb-3 h-40 font-mono text-xs resize-y"
              placeholder='{"users":[],"predictions":[],"matchResults":{}}'
            />
            {importError && <p className="text-red-400 text-sm mb-2">{importError}</p>}
            {importSuccess && <p className="text-green-400 text-sm mb-2">{importSuccess}</p>}
            <button onClick={handleImport} disabled={!importJson.trim()} className="btn-primary">
              Importar
            </button>
          </div>

          {/* Instrucciones */}
          <div className="card bg-gray-900/50 text-sm text-gray-400">
            <p className="font-medium text-white mb-2">💡 Formato de importación manual</p>
            <pre className="text-xs overflow-auto bg-gray-950 p-3 rounded-lg">
{`{
  "users": [
    { "id": "u-001", "name": "María", "avatar": "🦁", "createdAt": "2026-06-01T00:00:00.000Z" }
  ],
  "predictions": [
    { "id": "p-001", "userId": "u-001", "matchId": "A1", "homeScore": 2, "awayScore": 0 }
  ],
  "matchResults": {
    "A1": { "homeScore": 2, "awayScore": 0, "status": "finished" }
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab: Supabase */}
      {tab === 'supabase' && (
        <div className="space-y-4">
          {isSupabaseConfigured ? (
            <div className="card border-green-900/50 bg-green-950/10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="font-bold text-green-400">Supabase conectado</p>
                  <p className="text-sm text-gray-400">Los datos se comparten en tiempo real entre todos los dispositivos.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card border-orange-900/40 bg-orange-950/10">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⚠️</span>
                <div>
                  <p className="font-bold text-orange-400">Supabase no configurado</p>
                  <p className="text-sm text-gray-400">Actualmente los datos solo se guardan localmente.</p>
                </div>
              </div>
            </div>
          )}

          <div className="card space-y-4 text-sm text-gray-300">
            <h3 className="font-bold text-white text-base">📋 Cómo configurar Supabase (gratis)</h3>
            <ol className="space-y-3 list-decimal list-inside text-gray-400">
              <li>
                Ve a <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">supabase.com</a> y crea una cuenta gratuita
              </li>
              <li>Crea un nuevo proyecto (elige región cercana, ej: <em>East US</em>)</li>
              <li>
                Ve a <strong className="text-white">SQL Editor</strong> y ejecuta el contenido del archivo{' '}
                <code className="bg-gray-800 px-1 rounded text-yellow-400">supabase-schema.sql</code>{' '}
                que está en la raíz del proyecto
              </li>
              <li>
                Ve a <strong className="text-white">Settings → API</strong> y copia:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li><strong className="text-white">Project URL</strong></li>
                  <li><strong className="text-white">anon public key</strong></li>
                </ul>
              </li>
              <li>
                Crea el archivo <code className="bg-gray-800 px-1 rounded text-yellow-400">.env.local</code> en la raíz del proyecto:
                <pre className="bg-gray-950 rounded-lg p-3 mt-2 text-xs overflow-auto">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...`}
                </pre>
              </li>
              <li>Para GitHub Pages, agrega esas mismas variables en <strong className="text-white">Settings → Secrets → Actions</strong> de tu repo como <code className="bg-gray-800 px-1 rounded">VITE_SUPABASE_URL</code> y <code className="bg-gray-800 px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
              <li>Reinicia el servidor: <code className="bg-gray-800 px-1 rounded">npm run dev</code></li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab: Peligro */}
      {tab === 'danger' && (
        <div className="card border-red-900/50 bg-red-950/10 space-y-4">
          <h3 className="font-bold text-red-400 text-lg">⚠️ Zona de Peligro</h3>
          <p className="text-sm text-gray-400">
            Estas acciones son irreversibles. Asegúrate de exportar tus datos antes de continuar.
          </p>
          <button onClick={handleClearAll} className="btn-danger w-full">
            🗑️ Eliminar todos los datos
          </button>
        </div>
      )}
    </div>
  );
}
