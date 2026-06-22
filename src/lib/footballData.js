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
  if (EN_TO_ES[lower]) return EN_TO_ES[lower];
  const normKey = normalize(apiName);
  for (const [en, es] of Object.entries(ES_TO_EN)) {
    if (normalize(en) === normKey) return es;
  }
  return apiName;
}

function findLocalMatch(homeApi, awayApi, apiKickoff, localMatches) {
  const homeEs = resolveTeam(homeApi);
  const awayEs = resolveTeam(awayApi);

  // Filter by kickoff time (±5 min tolerance)
  const byTime = localMatches.filter(m =>
    Math.abs(new Date(m.kickoff).getTime() - apiKickoff) <= 5 * 60 * 1000
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

      const localMatch = findLocalMatch(homeApi, awayApi, apiKickoff, localMatches);
      if (!localMatch) continue;

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

// Maps Spanish team names (our data) → English names (football-data.org)
const ES_TO_EN = {
  'México': 'Mexico',
  'Sudáfrica': 'South Africa',
  'Corea del Sur': 'Korea Republic',
  'Chequia': 'Czechia',
  'Canadá': 'Canada',
  'Suiza': 'Switzerland',
  'Bosnia y Herzegovina': 'Bosnia and Herzegovina',
  'Brasil': 'Brazil',
  'Marruecos': 'Morocco',
  'Haití': 'Haiti',
  'Escocia': 'Scotland',
  'Estados Unidos': 'United States',
  'Turquía': 'Türkiye',
  'Alemania': 'Germany',
  'Curazao': 'Curaçao',
  'Costa de Marfil': "Côte d'Ivoire",
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
  'Bahréin': 'Bahrain',
  'Emiratos Árabes Unidos': 'United Arab Emirates',
  'Omán': 'Oman',
  'Colombia': 'Colombia',
  'Perú': 'Peru',
  'Chile': 'Chile',
  'Costa Rica': 'Costa Rica',
  'Panamá': 'Panama',
  'Jamaica': 'Jamaica',
  'Trinidad y Tobago': 'Trinidad and Tobago',
  'Nigeria': 'Nigeria',
  'Egipto': 'Egypt',
  'Camerún': 'Cameroon',
  'Túnez': 'Tunisia',
  'Guinea': 'Guinea',
  'Cabo Verde': 'Cape Verde',
  'Nueva Zelanda': 'New Zealand',
  'Indonesia': 'Indonesia',
  'Filipinas': 'Philippines',
  'China': 'China PR',
  'Tailandia': 'Thailand',
  'Congo': 'Congo',
  'Rep. Democrática del Congo': 'Congo DR',
  'Guatemala': 'Guatemala',
  'Honduras': 'Honduras',
  'Venezuela': 'Venezuela',
  'Bolivia': 'Bolivia',
  'Uruguay': 'Uruguay',
};

// Reverse map: English → Spanish
const EN_TO_ES = {};
for (const [es, en] of Object.entries(ES_TO_EN)) {
  EN_TO_ES[en.toLowerCase()] = es;
}

function normalize(name) {
  return (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Resolve API English team name → our Spanish team name
function resolveTeam(apiName) {
  const lower = (apiName || '').toLowerCase();
  if (EN_TO_ES[lower]) return EN_TO_ES[lower];
  const normKey = normalize(apiName);
  for (const [en, es] of Object.entries(ES_TO_EN)) {
    if (normalize(en) === normKey) return es;
  }
  return apiName; // Same in both languages (e.g. Argentina, Senegal, Qatar...)
}

// Match an API result to one of our local matches
function findLocalMatch(apiMatch, localMatches) {
  const apiKickoff = new Date(apiMatch.utcDate).getTime();

  // Filter by kickoff time (±3 min tolerance for any clock skew)
  const byTime = localMatches.filter(m => {
    return Math.abs(new Date(m.kickoff).getTime() - apiKickoff) <= 3 * 60 * 1000;
  });

  if (byTime.length === 0) return null;
  if (byTime.length === 1) return byTime[0];

  // Multiple matches at same time → disambiguate by home team
  const homeEn = apiMatch.homeTeam?.name || '';
  const homeEs = resolveTeam(homeEn);
  return byTime.find(m => m.home === homeEs || normalize(m.home) === normalize(homeEs)) || byTime[0];
}

/**
 * Fetch today's World Cup matches with current scores from football-data.org.
 * @param {Array} localMatches - our local match objects (with kickoff in UTC)
 * @returns {Promise<Array>} - array of { matchId, homeScore, awayScore, status, minute }
 */
export async function fetchTodayScores(localMatches) {
  if (!TOKEN) return [];

  const dateStr = new Date().toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `${BASE_URL}/matches?competitions=WC&dateFrom=${dateStr}&dateTo=${dateStr}`,
      { headers: { 'X-Auth-Token': TOKEN } }
    );

    if (res.status === 429) {
      console.warn('[LiveScores] Rate limit hit, backing off');
      return [];
    }
    if (!res.ok) {
      console.warn('[LiveScores] API error:', res.status);
      return [];
    }

    const data = await res.json();
    const results = [];

    for (const apiMatch of (data.matches || [])) {
      const localMatch = findLocalMatch(apiMatch, localMatches);
      if (!localMatch) continue;

      const { status, score, minute } = apiMatch;
      // Use fullTime score if available, otherwise halfTime
      const home = score?.fullTime?.home ?? score?.halfTime?.home;
      const away = score?.fullTime?.away ?? score?.halfTime?.away;

      if (home == null || away == null) continue;

      results.push({
        matchId: localMatch.id,
        homeScore: home,
        awayScore: away,
        status,   // SCHEDULED | IN_PLAY | PAUSED | FINISHED | TIMED | SUSPENDED
        minute,
      });
    }

    return results;
  } catch (err) {
    console.warn('[LiveScores] Fetch failed:', err.message);
    return [];
  }
}
