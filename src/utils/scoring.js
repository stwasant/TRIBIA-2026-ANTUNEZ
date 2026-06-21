// Calcula los puntos de una predicción dado el resultado real
export function calcularPuntos(predHome, predAway, realHome, realAway) {
  if (realHome === null || realAway === null) return null;
  if (predHome === null || predAway === null) return null;

  // Marcador exacto → 3 puntos
  if (predHome === realHome && predAway === realAway) return 3;

  // Ganador correcto (o empate correcto) → 1 punto
  const ganadorPred = predHome > predAway ? 'local' : predHome < predAway ? 'visitante' : 'empate';
  const ganadorReal = realHome > realAway ? 'local' : realHome < realAway ? 'visitante' : 'empate';

  if (ganadorPred === ganadorReal) return 1;

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
      const pts = calcularPuntos(p.homeScore, p.awayScore, match.homeScore, match.awayScore);
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

// Determina si el partido está disponible para pronosticar
export function disponibleParaPronosticar(match) {
  return match.status === 'scheduled';
}
