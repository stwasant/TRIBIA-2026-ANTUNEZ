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
  'Brasil': 'Brazil',
  'Marruecos': 'Morocco',
  'Haití': 'Haiti',
  'Escocia': 'Scotland',
  'Estados Unidos': 'United States',
  'Turquía': 'Turkey',
  'Alemania': 'Germany',
  'Curazao': 'Curacao',
  'Costa de Marfil': 'Ivory Coast',
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
};

// Reverse: English → Spanish
const EN_TO_ES = {};
for (const [es, en] of Object.entries(ES_TO_EN)) {
  EN_TO_ES[en.toLowerCase()] = es;
}

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
  if (byTime.length === 1) return byTime[0];

  // Same kickoff time → disambiguate by home team
  return byTime.find(m =>
    m.home === homeEs || normalize(m.home) === normalize(homeEs)
  ) || byTime[0];
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
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  try {
    const res = await fetch(`${ESPN_BASE}/scoreboard?dates=${dateStr}`);

    if (!res.ok) {
      console.warn('[LiveScores] ESPN error:', res.status);
      return [];
    }

    const data = await res.json();
    const results = [];

    for (const event of (data.events || [])) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const homeComp = competition.competitors?.find(c => c.homeAway === 'home');
      const awayComp = competition.competitors?.find(c => c.homeAway === 'away');
      if (!homeComp || !awayComp) continue;

      const homeApi = homeComp.team?.displayName || homeComp.team?.name || '';
      const awayApi = awayComp.team?.displayName || awayComp.team?.name || '';
      const apiKickoff = new Date(event.date).getTime();

      console.log(`[ESPN] ${homeApi} vs ${awayApi} @ ${new Date(apiKickoff).toISOString()}`);
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

      results.push({
        matchId: localMatch.id,
        homeScore,
        awayScore,
        status,
        minute: event.status?.displayClock || '',
      });
    }

    return results;
  } catch (err) {
    console.warn('[LiveScores] ESPN fetch failed:', err.message);
    return [];
  }
}
