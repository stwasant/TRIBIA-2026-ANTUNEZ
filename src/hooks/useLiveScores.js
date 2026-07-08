import { useEffect, useRef } from 'react';
import useStore from '../store';
import { fetchTodayScores, fetchR32Updates, fetchR16Updates, fetchQFUpdates, fetchSFUpdates, isFootballDataConfigured } from '../lib/footballData';

// 90 seconds: safe for free tier (10 req/min) with up to ~8 concurrent users
const POLL_INTERVAL_MS = 90 * 1000;
// 10 minutes for knockout team-name updates
const KNOCKOUT_UPDATE_INTERVAL_MS = 10 * 60 * 1000;

export function useLiveScores() {
  const timerRef = useRef(null);
  const r32TimerRef = useRef(null);
  const r16TimerRef = useRef(null);
  const qfTimerRef = useRef(null);
  const sfTimerRef = useRef(null);

  useEffect(() => {
    console.log('[LiveScores Hook] Initializing...');
    console.log('[LiveScores Hook] isFootballDataConfigured:', isFootballDataConfigured);
    
    if (!isFootballDataConfigured) return;

    const sync = async () => {
      const { getAllMatches, setMatchResult, setLiveScore } = useStore.getState();
      const allMatches = getAllMatches();
      const results = await fetchTodayScores(allMatches);

      for (const result of results) {
        const { matchId, homeScore, awayScore, homePenalties, awayPenalties, status } = result;
        if (status === 'FINISHED') {
          setMatchResult(matchId, homeScore, awayScore, homePenalties, awayPenalties);
        } else if (status === 'IN_PLAY' || status === 'PAUSED') {
          setLiveScore(matchId, homeScore, awayScore, homePenalties, awayPenalties);
        }
      }
    };

    // ── Generic factory for knockout team-update syncs ──────────────────
    // `force` bypasses the rate-limit cache — used on initial mount so a stale
    // cache from a previous session never permanently blocks unresolved placeholders.
    const makeKnockoutSync = (phase, fetchFn, cacheKey) => async ({ force = false } = {}) => {
      console.log(`[${phase.toUpperCase()} Hook] syncUpdates called${force ? ' (forced)' : ''}`);

      const { getAllMatches, updateMatchTeams } = useStore.getState();
      const matches = getAllMatches();

      const placeholders = matches.filter(m =>
        m.phase === phase && (m.home === 'Por definir' || m.away === 'Por definir')
      );

      console.log(`[${phase.toUpperCase()} Hook] Matches with placeholders: ${placeholders.length}`);
      placeholders.forEach(m => console.log(`  - ${m.id}: ${m.home} vs ${m.away}`));

      if (placeholders.length === 0) {
        console.log(`[${phase.toUpperCase()} Updates] All teams already updated, skipping`);
        return;
      }

      if (!force) {
        const lastUpdate = localStorage.getItem(cacheKey);
        const timeSinceUpdate = Date.now() - (lastUpdate ? parseInt(lastUpdate, 10) : 0);

        if (timeSinceUpdate < KNOCKOUT_UPDATE_INTERVAL_MS) {
          console.log(`[${phase.toUpperCase()} Updates] Updated recently, waiting for next interval`);
          return;
        }
      } else {
        console.log(`[${phase.toUpperCase()} Updates] Force run — bypassing cache`);
      }

      console.log(`[${phase.toUpperCase()} Updates] Fetching team updates from ESPN...`);
      const updates = await fetchFn(matches);

      if (updates.length > 0) {
        await updateMatchTeams(updates);
        console.log(`[${phase.toUpperCase()} Updates] ✅ Updated ${updates.length} matches with real teams!`);

        // Only cache if ALL placeholders were resolved; otherwise retry next interval
        const stillUnresolved = placeholders.filter(m => !updates.find(u => u.matchId === m.id));
        if (stillUnresolved.length > 0) {
          console.log(`[${phase.toUpperCase()} Updates] ⚠️ ${stillUnresolved.length} placeholder(s) still unresolved — will retry next interval`);
          localStorage.removeItem(cacheKey);
        } else {
          localStorage.setItem(cacheKey, Date.now().toString());
        }
      } else {
        localStorage.setItem(cacheKey, Date.now().toString());
        console.log(`[${phase.toUpperCase()} Updates] No new updates found from ESPN, will retry later`);
      }
    };

    const syncR32Updates = async () => {
      console.log('[R32 Hook] syncR32Updates called');
      
      const { getAllMatches } = useStore.getState();
      const matches = getAllMatches();
      
      console.log('[R32 Hook] Total matches from store:', matches.length);
      
      const r32Matches = matches.filter(m => m.phase === 'r32');
      console.log('[R32 Hook] Total R32 matches:', r32Matches.length);
      console.log('[R32 Hook] All R32 matches in store:');
      r32Matches.forEach(m => console.log(`  ${m.id}: ${m.home} vs ${m.away}`));
      
      const isPlaceholder = (team) => {
        if (!team) return false;
        return (
          team.match(/^[123][A-L]$/) ||
          team.match(/^3[A-Z]+$/) ||
          team.toLowerCase().includes('group') ||
          team.toLowerCase().includes('third') ||
          team.toLowerCase().includes('winner') ||
          team.toLowerCase().includes('place')
        );
      };
      const placeholderMatches = r32Matches.filter(m => isPlaceholder(m.home) || isPlaceholder(m.away));
      
      console.log('[R32 Hook] Matches with placeholders:', placeholderMatches.length);
      placeholderMatches.forEach(m => console.log(`  - ${m.id}: ${m.home} vs ${m.away}`));
      
      if (placeholderMatches.length === 0) {
        console.log('[R32 Updates] All teams already updated, skipping');
        return;
      }

      const lastUpdate = localStorage.getItem('r32-last-update');
      const timeSinceUpdate = Date.now() - (lastUpdate ? parseInt(lastUpdate, 10) : 0);
      if (timeSinceUpdate < KNOCKOUT_UPDATE_INTERVAL_MS) {
        console.log('[R32 Updates] Updated recently, waiting for next interval');
        return;
      }

      console.log('[R32 Updates] Fetching team updates from ESPN...');
      const { updateMatchTeams } = useStore.getState();
      
      const updates = await fetchR32Updates(matches);
      localStorage.setItem('r32-last-update', Date.now().toString());
      
      if (updates.length > 0) {
        await updateMatchTeams(updates);
        console.log(`[R32 Updates] ✅ Updated ${updates.length} matches with real teams!`);
      } else {
        console.log('[R32 Updates] No new updates found, will retry later');
      }
    };

    const syncR16Updates = makeKnockoutSync('r16', fetchR16Updates, 'r16-last-update');
    const syncQFUpdates  = makeKnockoutSync('qf',  fetchQFUpdates,  'qf-last-update');
    const syncSFUpdates  = makeKnockoutSync('sf',  fetchSFUpdates,  'sf-last-update');

    // ── R16 wrapper with extra placeholder check logging ───────────────
    const syncR16WithLog = async ({ force = false } = {}) => {
      console.log('[R16 Hook] syncR16Updates called');
      const { getAllMatches } = useStore.getState();
      const matches = getAllMatches();
      const r16Placeholders = matches.filter(m =>
        m.phase === 'r16' && (m.home === 'Por definir' || m.away === 'Por definir')
      );
      console.log('[R16 Hook] R16 matches with placeholders:', r16Placeholders.length);
      r16Placeholders.forEach(m => console.log(`  - ${m.id}: ${m.home} vs ${m.away}`));
      await syncR16Updates({ force });
    };

    console.log('[LiveScores Hook] Running initial sync...');
    sync();
    console.log('[LiveScores Hook] Running initial R32 update check...');
    syncR32Updates();
    // Initial calls always force-bypass the cache to resolve any stale placeholders
    console.log('[LiveScores Hook] Running initial R16 update check...');
    syncR16WithLog({ force: true });
    console.log('[LiveScores Hook] Running initial QF update check...');
    syncQFUpdates({ force: true });
    console.log('[LiveScores Hook] Running initial SF update check...');
    syncSFUpdates({ force: true });
    
    console.log('[LiveScores Hook] Setting up intervals...');
    timerRef.current    = setInterval(sync, POLL_INTERVAL_MS);
    r32TimerRef.current = setInterval(syncR32Updates, KNOCKOUT_UPDATE_INTERVAL_MS);
    r16TimerRef.current = setInterval(syncR16WithLog, KNOCKOUT_UPDATE_INTERVAL_MS);
    qfTimerRef.current  = setInterval(syncQFUpdates, KNOCKOUT_UPDATE_INTERVAL_MS);
    sfTimerRef.current  = setInterval(syncSFUpdates, KNOCKOUT_UPDATE_INTERVAL_MS);
    console.log('[LiveScores Hook] Intervals set — scores every', POLL_INTERVAL_MS/1000, 's, knockout updates every', KNOCKOUT_UPDATE_INTERVAL_MS/1000, 's');

    return () => {
      clearInterval(timerRef.current);
      clearInterval(r32TimerRef.current);
      clearInterval(r16TimerRef.current);
      clearInterval(qfTimerRef.current);
      clearInterval(sfTimerRef.current);
    };
  }, []);
}
