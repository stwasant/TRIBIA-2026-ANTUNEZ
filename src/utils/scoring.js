// Calcula los puntos de una predicción dado el resultado real
export function calcularPuntos(prediction, match) {
  // prediction puede ser objeto {homeScore, awayScore, penaltyWinner?, ...} o números legacy
  // match puede tener homePenalties/awayPenalties si hubo definición por penales
  
  let predHome, predAway, predPenaltyWinner;
  if (typeof prediction === 'object' && prediction !== null) {
    predHome = prediction.homeScore;
    predAway = prediction.awayScore;
    predPenaltyWinner = prediction.penaltyWinner;
  } else {
    // Legacy: primer argumento es homeScore, segundo es awayScore
    predHome = prediction;
    predAway = match;
    // En este caso, match es el tercer argumento (debe venir de calcularPuntos(h, a, match))
    // Para mantener compatibilidad, si recibimos 4 argumentos en formato antiguo
    if (arguments.length === 4) {
      const realHome = arguments[2];
      const realAway = arguments[3];
      if (realHome === null || realAway === null) return null;
      if (predHome === null || predAway === null) return null;
      
      if (predHome === realHome && predAway === realAway) return 3;
      
      const ganadorPred = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
      const ganadorReal = realHome > realAway ? 'home' : realHome < realAway ? 'away' : 'draw';
      
      if (ganadorPred === ganadorReal) return 1;
      return 0;
    }
  }
  
  const realHome = match.homeScore;
  const realAway = match.awayScore;
  const realHasPenalties = match.homePenalties !== null && match.homePenalties !== undefined;
  
  if (realHome === null || realAway === null) return null;
  if (predHome === null || predAway === null) return null;

  // Marcador exacto en tiempo regular → 3 puntos
  if (predHome === realHome && predAway === realAway) return 3;

  // Determinar ganador en tiempo regular
  const predWinner = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
  const realWinner = realHome > realAway ? 'home' : realHome < realAway ? 'away' : 'draw';

  // Si acertó el resultado en tiempo regular (empate)
  if (predWinner === realWinner) {
    let points = 1; // Punto base por acertar resultado regular
    
    // Si el partido se definió por penales y el usuario predijo el ganador correcto
    if (realHasPenalties && realWinner === 'draw' && predPenaltyWinner) {
      const realPenaltyWinner = match.homePenalties > match.awayPenalties ? 'home' : 'away';
      if (predPenaltyWinner === realPenaltyWinner) {
        points += 1; // Punto adicional por acertar ganador en penales
      }
    }
    
    return points;
  }

  return 0;
}

// Calcula el total de puntos de un usuario
export function calcularTotalUsuario(userId, predictions, matches) {
  let total = 0;
  let aciertosExactos = 0;
  let aciertosGanador = 0;
  let fallidos = 0;
  let pendientes = 0;

  predictions
    .filter(p => p.userId === userId)
    .forEach(p => {
      const match = matches.find(m => m.id === p.matchId);
      if (!match) return;
      const pts = calcularPuntos(p, match);
      if (pts === null) {
        pendientes++;
      } else {
        total += pts;
        if (pts === 3) aciertosExactos++;
        else if (pts === 1) aciertosGanador++;
        else fallidos++;
      }
    });

  return { total, aciertosExactos, aciertosGanador, fallidos, pendientes };
}

// Formatea fecha en español
export function formatFecha(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Resultado textual
export function resultadoTexto(homeScore, awayScore) {
  if (homeScore === null || awayScore === null) return null;
  return `${homeScore} - ${awayScore}`;
}

// Determina si el partido ya pasó
export function partidoPasado(match) {
  return match.status === 'finished';
}

// Determina si el partido está disponible para pronosticar.
// Se puede pronosticar mientras NO haya comenzado (según el reloj local del usuario)
// y no esté en vivo ni finalizado. El admin puede editar incluso partidos cerrados.
export function disponibleParaPronosticar(match, isAdmin = false) {
  // Admin puede editar cualquier pronóstico
  if (isAdmin) return true;
  return match.status === 'scheduled' && !hasMatchStarted(match);
}

// Verifica si el usuario actual es admin (desbloqueó el panel admin)
export function isAdminUnlocked() {
  return sessionStorage.getItem('tribia-admin-unlocked') === '1';
}

// ==========================================
// FECHA Y HORA EN ZONA HORARIA LOCAL DEL USUARIO
// ==========================================
//
// Cada partido trae `kickoff`: el instante exacto del inicio en UTC (ISO 8601),
// p. ej. "2026-06-25T01:00:00.000Z". El navegador (desktop o móvil) lo convierte
// automáticamente a la zona horaria del usuario con los métodos toLocale*.
// No se asumen offsets ni ciudades: la fuente de verdad es el timestamp UTC.

// Devuelve el objeto Date (instante UTC) del inicio del partido.
export function getMatchKickoff(match) {
  if (!match?.kickoff) return null;
  const d = new Date(match.kickoff);
  return isNaN(d.getTime()) ? null : d;
}

// Formatea la HORA del partido en la zona horaria local del usuario (ej. "21:00").
export function formatMatchLocalTime(match) {
  const d = getMatchKickoff(match);
  if (!d) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Formatea la FECHA del partido en la zona horaria local del usuario (ej. "mié, 25 jun").
export function formatMatchLocalDate(match) {
  const d = getMatchKickoff(match);
  if (!d) return '';
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Fecha + hora local en un solo string (ej. "mié, 25 jun · 21:00").
export function formatMatchLocalDateTime(match) {
  const fecha = formatMatchLocalDate(match);
  const hora = formatMatchLocalTime(match);
  if (!fecha) return '';
  return hora ? `${fecha} · ${hora}` : fecha;
}

// Devuelve la fecha del partido como "YYYY-MM-DD" en la zona local del usuario.
export function getMatchLocalDayKey(match) {
  const d = getMatchKickoff(match);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Verifica si el partido es "hoy" según la fecha local del usuario.
export function isMatchToday(match) {
  const key = getMatchLocalDayKey(match);
  if (!key) return false;
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return key === todayKey;
}

// Indica si el partido ya comenzó (según el reloj del usuario).
export function hasMatchStarted(match) {
  if (match?.status === 'finished' || match?.status === 'live') return true;
  const d = getMatchKickoff(match);
  if (!d) return false;
  return Date.now() >= d.getTime();
}

// Ventana aproximada de duración de un partido (para el estado "en vivo").
const MATCH_WINDOW_MS = 135 * 60 * 1000; // ~2h15m

// Indica si el partido está EN VIVO ahora, derivado del kickoff real (no de un
// flag estático que no expira). Un partido finalizado nunca está en vivo.
export function isMatchLive(match) {
  if (match?.status === 'finished') return false;
  // Si el status es 'live' (de ESPN), confiar en eso
  if (match?.status === 'live') return true;
  const d = getMatchKickoff(match);
  if (!d) return false;
  const start = d.getTime();
  const now = Date.now();
  return now >= start && now < start + MATCH_WINDOW_MS;
}
