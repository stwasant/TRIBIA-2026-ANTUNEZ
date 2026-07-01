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
EN_TO_ES['curaçao'] = 'Curazao';  // ESPN usa ç
EN_TO_ES['türkiye'] = 'Turquía';  // Nombre oficial turco en ESPN

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
  const byTime = localMatches.filter(m => {
    // Skip R32 matches with placeholders - let fetchR32Updates handle them
    const hasPlaceholder = 
      m.phase === 'r32' && (
        m.home.match(/^[123][A-L]$/) || 
        m.away.match(/^[123][A-L]$/) ||
        m.home.match(/^3[A-Z]+$/) ||
        m.away.match(/^3[A-Z]+$/)
      );
    
    if (hasPlaceholder) return false;
    
    return Math.abs(new Date(m.kickoff).getTime() - apiKickoff) <= 24 * 60 * 60 * 1000;
  });

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
    case 'STATUS_FINAL_PEN':    return 'FINISHED';
    case 'STATUS_IN_PROGRESS':  return 'IN_PLAY';
    case 'STATUS_FIRST_HALF':   return 'IN_PLAY';
    case 'STATUS_SECOND_HALF':  return 'IN_PLAY';
    case 'STATUS_OVERTIME':     return 'IN_PLAY';
    case 'STATUS_HALFTIME':     return 'PAUSED';
    case 'STATUS_DELAYED':      return 'PAUSED';
    case 'STATUS_SUSPENDED':    return 'PAUSED';
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

        // Check for penalty shootout scores
        const homePenalties = homeComp.shootoutScore ? parseInt(homeComp.shootoutScore, 10) : null;
        const awayPenalties = awayComp.shootoutScore ? parseInt(awayComp.shootoutScore, 10) : null;
        const hasPenalties = homePenalties !== null && awayPenalties !== null;

        if (hasPenalties) {
          console.log(`  ⚽ Penalties: ${homePenalties} - ${awayPenalties}`);
        }

        // Avoid duplicates
        const existing = results.find(r => r.matchId === localMatch.id);
        if (existing) continue;

        results.push({
          matchId: localMatch.id,
          homeScore,
          awayScore,
          homePenalties: hasPenalties ? homePenalties : undefined,
          awayPenalties: hasPenalties ? awayPenalties : undefined,
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

/**
 * Fetch Round of 32 matches from ESPN to update placeholder teams.
 * Detects when R32 teams are defined and updates local matches with real team names.
 * @param {Array} localMatches - our local match objects (including R32 with placeholders)
 * @returns {Promise<Array>} - array of { matchId, home, away, homeFlag, awayFlag }
 */
export async function fetchR32Updates(localMatches) {
  console.log('[R32 Updates] Starting R32 update check...');
  console.log('[R32 Updates] Total local matches:', localMatches.length);
  
  // Helper to detect placeholder teams
  const isPlaceholder = (team) => {
    if (!team) return false;
    return (
      team.match(/^[123][A-L]$/) ||       // "1A", "2B", "3C"
      team.match(/^3[A-Z]+$/) ||          // "3ABCD", "3ABCDF"
      team.toLowerCase().includes('group') ||      // "Group X Winner"
      team.toLowerCase().includes('third') ||      // "Third Place Group..."
      team.toLowerCase().includes('winner') ||     // Any "Winner"
      team.toLowerCase().includes('place')         // "2nd Place", "Third Place"
    );
  };
  
  // Only check R32 matches (those with placeholder teams)
  const r32Matches = localMatches.filter(m => 
    m.phase === 'r32' && (isPlaceholder(m.home) || isPlaceholder(m.away))
  );

  console.log(`[R32 Updates] Found ${r32Matches.length} matches with placeholders:`);
  r32Matches.forEach(m => console.log(`  - ${m.id}: ${m.home} vs ${m.away} @ ${m.kickoff} in ${m.city}`));

  if (r32Matches.length === 0) return []; // All R32 teams already updated

  // R32 dates: June 28 - July 4, 2026
  const dates = ['20260628', '20260629', '20260630', '20260701', '20260702', '20260703', '20260704'];
  const updates = [];

  for (const dateStr of dates) {
    console.log(`[R32 Updates] Fetching ESPN for date: ${dateStr}...`);
    try {
      const res = await fetch(`${ESPN_BASE}/scoreboard?dates=${dateStr}`);
      if (!res.ok) {
        console.log(`[R32 Updates] ESPN fetch failed for ${dateStr}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      console.log(`[R32 Updates] ESPN returned ${data.events?.length || 0} events for ${dateStr}`);

      for (const event of (data.events || [])) {
        const competition = event.competitions?.[0];
        if (!competition) continue;

        // Check if it's a Round of 32 match
        const seasonType = event.season?.type;
        const seasonSlug = event.season?.slug;
        
        console.log(`  [Event] ${event.name} - Season: ${seasonSlug}, Type: ${seasonType}`);
        
        if (seasonSlug !== 'round-of-32' && seasonType !== 13801) {
          console.log(`    ⏭️  Skipping - not R32 (slug: ${seasonSlug}, type: ${seasonType})`);
          continue;
        }
        
        console.log(`    ✓ This is R32!`);

        const homeComp = competition.competitors?.find(c => c.homeAway === 'home');
        const awayComp = competition.competitors?.find(c => c.homeAway === 'away');
        if (!homeComp || !awayComp) continue;

        const homeApi = homeComp.team?.displayName || homeComp.team?.name || '';
        const awayApi = awayComp.team?.displayName || awayComp.team?.name || '';
        const apiKickoff = new Date(event.date).getTime();

        console.log(`  [ESPN] Found R32: ${homeApi} vs ${awayApi} @ ${new Date(apiKickoff).toISOString()}`);

        // Try to match with local R32 match by time and venue
        const venue = competition.venue?.fullName || '';
        const city = competition.venue?.address?.city || '';

        console.log(`    Venue: ${venue}, City: ${city}`);
        console.log(`    Looking for match in ${r32Matches.length} remaining placeholders...`);

        const localMatch = r32Matches.find(m => {
          console.log(`      Checking ${m.id}: ${m.home} vs ${m.away}`);
          const timeDiff = Math.abs(new Date(m.kickoff).getTime() - apiKickoff);
          const timeMatch = timeDiff <= 6 * 60 * 60 * 1000; // 6 hour tolerance
          
          console.log(`        Time diff: ${timeDiff / (60*60*1000).toFixed(2)} hours - Match: ${timeMatch}`);
          
          // If exact time match (0 hours diff), skip city check - it's definitely the right match
          if (timeDiff === 0) {
            console.log(`        ✅ Exact time match - accepting without city check`);
            return true;
          }
          
          // For non-exact matches, also check city
          let venueMatch = true;
          if (city && m.city) {
            const cityNorm = normalize(city);
            const mCityNorm = normalize(m.city);
            // More flexible matching: check if either contains the other
            venueMatch = cityNorm.includes(mCityNorm) || mCityNorm.includes(cityNorm) || 
                        cityNorm.includes('los') && mCityNorm.includes('los') || // Los Angeles variations
                        cityNorm.includes('angeles') && mCityNorm.includes('angeles') ||
                        cityNorm.includes('houston') && mCityNorm.includes('houston') ||
                        cityNorm.includes('dallas') && mCityNorm.includes('dallas') ||
                        cityNorm.includes('foxborough') && mCityNorm.includes('boston') || // Foxborough = Boston area
                        cityNorm.includes('boston') && mCityNorm.includes('foxborough') ||
                        cityNorm.includes('inglewood') && mCityNorm.includes('angeles'); // Inglewood = LA area
            console.log(`        City match: ${venueMatch} (${cityNorm} vs ${mCityNorm})`);
          }
          
          const finalMatch = timeMatch && venueMatch;
          console.log(`        Final result: ${finalMatch}`);
          return finalMatch;
        });

        if (!localMatch) {
          console.log(`    ❌ No local match found for ${homeApi} vs ${awayApi}`);
          continue;
        }

        console.log(`    ✅ Matched with local ${localMatch.id}`);

        // Resolve team names from ESPN to Spanish
        const homeEs = resolveTeam(homeApi);
        const awayEs = resolveTeam(awayApi);

        console.log(`[R32 Update] ${localMatch.id}: ${homeEs} vs ${awayEs}`);

        updates.push({
          matchId: localMatch.id,
          home: homeEs,
          away: awayEs,
          homeFlag: getCountryFlag(homeEs),
          awayFlag: getCountryFlag(awayEs),
        });

        // Remove from array to avoid duplicate matches
        const idx = r32Matches.indexOf(localMatch);
        if (idx > -1) r32Matches.splice(idx, 1);
      }
    } catch (err) {
      console.warn(`[R32 Updates] ESPN fetch failed for ${dateStr}:`, err.message);
    }
  }

  return updates;
}

/**
 * Fetch Round of 16 matches from ESPN to update placeholder teams.
 * Detects when R16 teams are defined and updates local matches with real team names.
 * @param {Array} localMatches - our local match objects
 * @returns {Promise<Array>} - array of { matchId, home, away, homeFlag, awayFlag }
 */
export async function fetchR16Updates(localMatches) {
  console.log('[R16 Updates] Starting R16 update check...');

  const isPlaceholder = (team) => {
    if (!team) return true;
    return team === 'Por definir';
  };

  const r16Matches = localMatches.filter(m =>
    m.phase === 'r16' && (isPlaceholder(m.home) || isPlaceholder(m.away))
  );

  console.log(`[R16 Updates] Found ${r16Matches.length} R16 matches with placeholders`);
  r16Matches.forEach(m => console.log(`  - ${m.id}: ${m.home} vs ${m.away} @ ${m.kickoff} in ${m.city}`));

  if (r16Matches.length === 0) return [];

  const dates = ['20260704', '20260705', '20260706', '20260707'];
  const updates = [];

  for (const dateStr of dates) {
    console.log(`[R16 Updates] Fetching ESPN for date: ${dateStr}...`);
    try {
      const res = await fetch(`${ESPN_BASE}/scoreboard?dates=${dateStr}`);
      if (!res.ok) {
        console.log(`[R16 Updates] ESPN fetch failed for ${dateStr}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      console.log(`[R16 Updates] ESPN returned ${data.events?.length || 0} events for ${dateStr}`);

      for (const event of (data.events || [])) {
        const competition = event.competitions?.[0];
        if (!competition) continue;

        const seasonSlug = event.season?.slug;
        if (seasonSlug !== 'round-of-16') {
          console.log(`  [Event] ${event.name} - skipping (slug: ${seasonSlug})`);
          continue;
        }

        const homeComp = competition.competitors?.find(c => c.homeAway === 'home');
        const awayComp = competition.competitors?.find(c => c.homeAway === 'away');
        if (!homeComp || !awayComp) continue;

        const homeTeam = homeComp.team || {};
        const awayTeam = awayComp.team || {};

        if (!homeTeam.isActive || !awayTeam.isActive) {
          console.log(`  [R16] Skipping placeholder: ${homeTeam.displayName} vs ${awayTeam.displayName}`);
          continue;
        }

        const homeApi = homeTeam.displayName || homeTeam.name || '';
        const awayApi = awayTeam.displayName || awayTeam.name || '';
        const apiKickoff = new Date(event.date).getTime();

        const city = competition.venue?.address?.city || '';
        console.log(`  [ESPN R16] ${homeApi} vs ${awayApi} @ ${new Date(apiKickoff).toISOString()} in ${city}`);

        const localMatch = r16Matches.find(m => {
          const timeDiff = Math.abs(new Date(m.kickoff).getTime() - apiKickoff);
          const timeMatch = timeDiff <= 6 * 60 * 60 * 1000;

          if (timeDiff === 0) return true;

          let venueMatch = true;
          if (city && m.city) {
            const cityNorm = normalize(city);
            const mCityNorm = normalize(m.city);
            venueMatch = cityNorm.includes(mCityNorm) || mCityNorm.includes(cityNorm) ||
              cityNorm.includes('los') && mCityNorm.includes('los') ||
              cityNorm.includes('angeles') && mCityNorm.includes('angeles') ||
              cityNorm.includes('houston') && mCityNorm.includes('houston') ||
              cityNorm.includes('dallas') && mCityNorm.includes('dallas') ||
              cityNorm.includes('arlington') && mCityNorm.includes('dallas') ||
              cityNorm.includes('east') && mCityNorm.includes('jersey') ||
              cityNorm.includes('rutherford') && mCityNorm.includes('jersey') ||
              cityNorm.includes('atlanta') && mCityNorm.includes('atlanta') ||
              cityNorm.includes('vancouver') && mCityNorm.includes('vancouver') ||
              cityNorm.includes('seattle') && mCityNorm.includes('seattle') ||
              cityNorm.includes('mexico') && mCityNorm.includes('mexico') ||
              cityNorm.includes('santa') && mCityNorm.includes('bah');
          }

          return timeMatch && venueMatch;
        });

        if (!localMatch) {
          console.log(`    ❌ No local R16 match found for ${homeApi} vs ${awayApi}`);
          continue;
        }

        console.log(`    ✅ Matched with local ${localMatch.id}`);

        const homeEs = resolveTeam(homeApi);
        const awayEs = resolveTeam(awayApi);

        if (homeEs === homeApi && !ES_TO_EN[homeEs]) {
          console.log(`    ⚠️ No Spanish mapping for ${homeApi}, skipping`);
          continue;
        }
        if (awayEs === awayApi && !ES_TO_EN[awayEs]) {
          console.log(`    ⚠️ No Spanish mapping for ${awayApi}, skipping`);
          continue;
        }

        console.log(`[R16 Update] ${localMatch.id}: ${homeEs} vs ${awayEs}`);

        const existing = updates.find(u => u.matchId === localMatch.id);
        if (existing) continue;

        updates.push({
          matchId: localMatch.id,
          home: homeEs,
          away: awayEs,
          homeFlag: getCountryFlag(homeEs),
          awayFlag: getCountryFlag(awayEs),
        });

        const idx = r16Matches.indexOf(localMatch);
        if (idx > -1) r16Matches.splice(idx, 1);
      }
    } catch (err) {
      console.warn(`[R16 Updates] ESPN fetch failed for ${dateStr}:`, err.message);
    }
  }

  return updates;
}

// Helper function to get country flag emoji (basic mapping)
function getCountryFlag(countryName) {
  const flagMap = {
    'Argentina': '🇦🇷', 'Brasil': '🇧🇷', 'México': '🇲🇽', 'Colombia': '🇨🇴',
    'Uruguay': '🇺🇾', 'Chile': '🇨🇱', 'Perú': '🇵🇪', 'Ecuador': '🇪🇨',
    'Paraguay': '🇵🇾', 'Costa Rica': '🇨🇷', 'Panamá': '🇵🇦', 'Jamaica': '🇯🇲',
    'Estados Unidos': '🇺🇸', 'Canadá': '🇨🇦', 'Haití': '🇭🇹',
    'España': '🇪🇸', 'Francia': '🇫🇷', 'Alemania': '🇩🇪', 'Italia': '🇮🇹',
    'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Países Bajos': '🇳🇱', 'Portugal': '🇵🇹', 'Bélgica': '🇧🇪',
    'Croacia': '🇭🇷', 'Polonia': '🇵🇱', 'Ucrania': '🇺🇦', 'Suiza': '🇨🇭',
    'Austria': '🇦🇹', 'Dinamarca': '🇩🇰', 'Suecia': '🇸🇪', 'Noruega': '🇳🇴',
    'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Rumanía': '🇷🇴', 'Chequia': '🇨🇿', 'Hungría': '🇭🇺',
    'Turquía': '🇹🇷', 'Eslovaquia': '🇸🇰', 'Eslovenia': '🇸🇮',
    'Bosnia y Herzegovina': '🇧🇦', 'Macedonia del Norte': '🇲🇰',
    'Nigeria': '🇳🇬', 'Senegal': '🇸🇳', 'Egipto': '🇪🇬', 'Marruecos': '🇲🇦',
    'Argelia': '🇩🇿', 'Túnez': '🇹🇳', 'Camerún': '🇨🇲', 'Ghana': '🇬🇭',
    'Costa de Marfil': '🇨🇮', 'Sudáfrica': '🇿🇦', 'Guinea': '🇬🇳',
    'Cabo Verde': '🇨🇻', 'RD del Congo': '🇨🇩',
    'Japón': '🇯🇵', 'Corea del Sur': '🇰🇷', 'Australia': '🇦🇺',
    'Irán': '🇮🇷', 'Arabia Saudita': '🇸🇦', 'Qatar': '🇶🇦',
    'Uzbekistán': '🇺🇿', 'Iraq': '🇮🇶', 'Jordania': '🇯🇴',
    'Nueva Zelanda': '🇳🇿', 'Curazao': '🇨🇼',
  };
  return flagMap[countryName] || '🏳️';
}
