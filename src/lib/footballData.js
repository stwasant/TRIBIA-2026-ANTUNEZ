// ESPN unofficial soccer API — CORS-friendly, no API key required
// Covers FIFA World Cup under the 'fifa.world' competition slug
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

export const isFootballDataConfigured = true; // ESPN needs no config

// Maps Spanish team names (our data) → English names (ESPN)
const ES_TO_EN = {
  'México': 'Mexico',
  'Sudáfrica': 'South Africa',
  'Corea del Sur': 'Korea Republic',
  'Chequia': 'Czech Republic',
  'Canadá': 'Canada',
  'Suiza': 'Switzerland',
  'Bosnia y Herzegovina': 'Bosnia and Herzegovina',
  'Qatar': 'Qatar',
  'RD del Congo': 'Congo DR',
  'Inglaterra': 'England',
  'Ghana': 'Ghana',
  'Portugal': 'Portugal',
  'Brasil': 'Brazil',
  'Marruecos': 'Morocco',
  'Haití': 'Haiti',
  'Escocia': 'Scotland',
  'Estados Unidos': 'United States',
  'Australia': 'Australia',
  'Turquía': 'Turkey',
  'Paraguay': 'Paraguay',
  'Alemania': 'Germany',
  'Curazao': 'Curacao',
  'Costa de Marfil': 'Ivory Coast',
  'Ecuador': 'Ecuador',
  'Francia': 'France',
  'Noruega': 'Norway',
  'Argelia': 'Algeria',
  'Jordania': 'Jordan',
  'España': 'Spain',
  'Bélgica': 'Belgium',
  'Países Bajos': 'Netherlands',
  'Croacia': 'Croatia',
  'Dinamarca': 'Denmark',
  'Polonia': 'Poland',
  'Rumanía': 'Romania',
  'Hungría': 'Hungary',
  'Macedonia del Norte': 'North Macedonia',
  'Eslovaquia': 'Slovakia',
  'Eslovenia': 'Slovenia',
  'Italia': 'Italy',
  'Ucrania': 'Ukraine',
  'Japón': 'Japan',
  'Irán': 'Iran',
  'Arabia Saudita': 'Saudi Arabia',
  'Uzbekistán': 'Uzbekistan',
  'Colombia': 'Colombia',
  'Perú': 'Peru',
  'Chile': 'Chile',
  'Costa Rica': 'Costa Rica',
  'Panamá': 'Panama',
  'Jamaica': 'Jamaica',
  'Nigeria': 'Nigeria',
  'Egipto': 'Egypt',
  'Camerún': 'Cameroon',
  'Túnez': 'Tunisia',
  'Guinea': 'Guinea',
  'Cabo Verde': 'Cape Verde',
  'Nueva Zelanda': 'New Zealand',
  'Senegal': 'Senegal',
  'Iraq': 'Iraq',
  'Argentina': 'Argentina',
  'Austria': 'Austria',
  'Uruguay': 'Uruguay',
  'Suecia': 'Sweden',
};

// Reverse: English → Spanish  
const EN_TO_ES = {};
for (const [es, en] of Object.entries(ES_TO_EN)) {
  EN_TO_ES[en.toLowerCase()] = es;
}
// Add alternative ESPN names
EN_TO_ES['czechia'] = 'Chequia';
EN_TO_ES['korea republic'] = 'Corea del Sur';
EN_TO_ES['south korea'] = 'Corea del Sur';
EN_TO_ES['bosnia-herzegovina'] = 'Bosnia y Herzegovina';

function normalize(name) {
  return (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function resolveTeam(apiName) {
  const lower = (apiName || '').toLowerCase();
  if (EN_TO_ES[lower]) {
    console.log(`    Resolved ${apiName} → ${EN_TO_ES[lower]} (direct)`);
    return EN_TO_ES[lower];
  }
  const normKey = normalize(apiName);
  for (const [en, es] of Object.entries(ES_TO_EN)) {
    if (normalize(en) === normKey) {
      console.log(`    Resolved ${apiName} → ${es} (normalized)`);
      return es;
    }
  }
  console.log(`    Resolved ${apiName} → ${apiName} (no mapping)`);
  return apiName;
}

function findLocalMatch(homeApi, awayApi, apiKickoff, localMatches) {
  const homeEs = resolveTeam(homeApi);
  const awayEs = resolveTeam(awayApi);

  // Filter by kickoff time (±24h tolerance to handle timezone/scheduling differences)
  const byTime = localMatches.filter(m =>
    Math.abs(new Date(m.kickoff).getTime() - apiKickoff) <= 24 * 60 * 60 * 1000
  );

  if (byTime.length === 0) return null;

  // Find match where BOTH teams match (home AND away)
  const exactMatch = byTime.find(m => {
    const homeMatch = m.home === homeEs || normalize(m.home) === normalize(homeEs);
    const awayMatch = m.away === awayEs || normalize(m.away) === normalize(awayEs);
    return homeMatch && awayMatch;
  });

  if (exactMatch) return exactMatch;

  // No exact match found - don't return a wrong match
  console.log(`  ⚠️ No exact team match found for ${homeEs} vs ${awayEs}`);
  return null;
}

// Map ESPN status strings to our internal status
function mapStatus(espnStatus) {
  switch (espnStatus) {
    case 'STATUS_FINAL':        return 'FINISHED';
    case 'STATUS_FULL_TIME':    return 'FINISHED';
    case 'STATUS_IN_PROGRESS':  return 'IN_PLAY';
    case 'STATUS_HALFTIME':     return 'PAUSED';
    default:                    return 'SCHEDULED';
  }
}

/**
 * Fetch today's World Cup matches with current scores from ESPN.
 * @param {Array} localMatches - our local match objects
 * @returns {Promise<Array>} - array of { matchId, homeScore, awayScore, status, minute }
 */
export async function fetchTodayScores(localMatches) {
  // Fetch yesterday, today, and tomorrow to handle timezone differences
  const today = new Date();
  const dates = [
    new Date(today.getTime() - 24*60*60*1000),  // yesterday
    today,                                        // today
    new Date(today.getTime() + 24*60*60*1000),  // tomorrow
  ].map(d => d.toISOString().slice(0, 10).replace(/-/g, ''));

  const results = [];

  for (const dateStr of dates) {
    try {
      const res = await fetch(`${ESPN_BASE}/scoreboard?dates=${dateStr}`);

      if (!res.ok) {
        console.warn(`[LiveScores] ESPN error for ${dateStr}:`, res.status);
        continue;
      }

      const data = await res.json();

      for (const event of (data.events || [])) {
        const competition = event.competitions?.[0];
        if (!competition) continue;

        const homeComp = competition.competitors?.find(c => c.homeAway === 'home');
        const awayComp = competition.competitors?.find(c => c.homeAway === 'away');
        if (!homeComp || !awayComp) continue;

        const homeApi = homeComp.team?.displayName || homeComp.team?.name || '';
        const awayApi = awayComp.team?.displayName || awayComp.team?.name || '';
        const apiKickoff = new Date(event.date).getTime();

        console.log(`[ESPN ${dateStr}] ${homeApi} vs ${awayApi} @ ${new Date(apiKickoff).toISOString()}`);
        const localMatch = findLocalMatch(homeApi, awayApi, apiKickoff, localMatches);
        if (!localMatch) {
          console.log(`  ❌ No local match found`);
          continue;
        }
        console.log(`  ✓ Matched: ${localMatch.id} (${localMatch.home} vs ${localMatch.away})`);

        const statusName = event.status?.type?.name || '';
        const status = mapStatus(statusName);
        if (status === 'SCHEDULED') continue; // No scores to update

        const homeScore = parseInt(homeComp.score, 10);
        const awayScore = parseInt(awayComp.score, 10);
        if (isNaN(homeScore) || isNaN(awayScore)) continue;

        // Avoid duplicates
        const existing = results.find(r => r.matchId === localMatch.id);
        if (existing) continue;

        results.push({
          matchId: localMatch.id,
          homeScore,
          awayScore,
          status,
          minute: event.status?.displayClock || '',
        });
      }
    } catch (err) {
      console.warn(`[LiveScores] ESPN fetch failed for ${dateStr}:`, err.message);
    }
  }

  return results;
}
