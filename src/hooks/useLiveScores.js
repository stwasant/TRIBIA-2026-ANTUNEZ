import { useEffect, useRef } from 'react';
import useStore from '../store';
import { fetchTodayScores, fetchR32Updates, isFootballDataConfigured } from '../lib/footballData';

// 90 seconds: safe for free tier (10 req/min) with up to ~8 concurrent users
const POLL_INTERVAL_MS = 90 * 1000;
// 10 minutes for R32 updates (more frequent to catch updates as soon as ESPN publishes)
const R32_UPDATE_INTERVAL_MS = 10 * 60 * 1000;

export function useLiveScores() {
  const timerRef = useRef(null);
  const r32TimerRef = useRef(null);

  useEffect(() => {
    console.log('[LiveScores Hook] Initializing...');
    console.log('[LiveScores Hook] isFootballDataConfigured:', isFootballDataConfigured);
    
    if (!isFootballDataConfigured) return;

    const sync = async () => {
      // Access store directly to always get fresh state without stale closures
      const { getAllMatches, setMatchResult, setLiveScore } = useStore.getState();
      const allMatches = getAllMatches();
      
      // Pass all matches - fetchTodayScores will handle filtering by date range
      // (it queries ESPN for yesterday, today, and tomorrow)
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

    const syncR32Updates = async () => {
      console.log('[R32 Hook] syncR32Updates called');
      
      // First check if there are any placeholders
      const { getAllMatches } = useStore.getState();
      const matches = getAllMatches();
      
      console.log('[R32 Hook] Total matches from store:', matches.length);
      console.log('[R32 Hook] Checking for placeholders...');
      
      // Find ALL R32 matches and check each one
      const r32Matches = matches.filter(m => m.phase === 'r32');
      console.log('[R32 Hook] Total R32 matches:', r32Matches.length);
      
      // Log ALL R32 matches to see what's in the store
      console.log('[R32 Hook] All R32 matches in store:');
      r32Matches.forEach(m => console.log(`  ${m.id}: ${m.home} vs ${m.away}`));
      
      const placeholderMatches = r32Matches.filter(m => {
        // Match patterns:
        // - "1A", "2B", "3C" etc.
        // - "3ABCD", "3ABCDF" etc.
        // - "Third Place Group X/Y/Z"
        // - "Group X Winner", "Group X 2nd Place"
        // - Any text containing "Group", "Third", "Winner", "Place"
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
        return isPlaceholder(m.home) || isPlaceholder(m.away);
      });
      
      console.log('[R32 Hook] Matches with placeholders:', placeholderMatches.length);
      placeholderMatches.forEach(m => console.log(`  - ${m.id}: ${m.home} vs ${m.away}`));
      
      if (placeholderMatches.length === 0) {
        console.log('[R32 Updates] All teams already updated, skipping');
        return;
      }

      // Check cache only if we have placeholders
      const lastUpdate = localStorage.getItem('r32-last-update');
      const lastUpdateTime = lastUpdate ? parseInt(lastUpdate, 10) : 0;
      const timeSinceUpdate = Date.now() - lastUpdateTime;
      
      console.log('[R32 Hook] Last update:', lastUpdateTime ? new Date(lastUpdateTime).toISOString() : 'never');
      console.log('[R32 Hook] Time since update:', Math.round(timeSinceUpdate / 1000), 'seconds');
      console.log('[R32 Hook] Interval threshold:', R32_UPDATE_INTERVAL_MS / 1000, 'seconds');
      
      // Skip if updated recently (but continue if we have placeholders)
      if (timeSinceUpdate < R32_UPDATE_INTERVAL_MS) {
        console.log('[R32 Updates] Updated recently, waiting for next interval');
        return;
      }

      console.log('[R32 Updates] Fetching team updates from ESPN...');
      const { updateMatchTeams } = useStore.getState();
      
      const updates = await fetchR32Updates(matches);
      
      if (updates.length > 0) {
        await updateMatchTeams(updates);
        localStorage.setItem('r32-last-update', Date.now().toString());
        console.log(`[R32 Updates] ✅ Updated ${updates.length} matches with real teams!`);
      } else {
        // Update timestamp even if no matches found (to avoid hammering API)
        localStorage.setItem('r32-last-update', Date.now().toString());
        console.log('[R32 Updates] No new updates found, will retry later');
      }
    };

    console.log('[LiveScores Hook] Running initial sync...');
    sync(); // Run immediately on mount
    console.log('[LiveScores Hook] Running initial R32 update check...');
    syncR32Updates(); // Also check for R32 updates immediately
    
    console.log('[LiveScores Hook] Setting up intervals...');
    timerRef.current = setInterval(sync, POLL_INTERVAL_MS);
    r32TimerRef.current = setInterval(syncR32Updates, R32_UPDATE_INTERVAL_MS);
    console.log('[LiveScores Hook] Intervals set - scores every', POLL_INTERVAL_MS/1000, 's, R32 every', R32_UPDATE_INTERVAL_MS/1000, 's');

    return () => {
      clearInterval(timerRef.current);
      clearInterval(r32TimerRef.current);
    };
  }, []); // Runs once on mount
}
