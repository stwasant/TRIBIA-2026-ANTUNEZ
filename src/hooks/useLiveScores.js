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
    if (!isFootballDataConfigured) return;

    const sync = async () => {
      // Access store directly to always get fresh state without stale closures
      const { getAllMatches, setMatchResult, setLiveScore } = useStore.getState();
      const allMatches = getAllMatches();
      
      // Pass all matches - fetchTodayScores will handle filtering by date range
      // (it queries ESPN for yesterday, today, and tomorrow)
      const results = await fetchTodayScores(allMatches);

      for (const { matchId, homeScore, awayScore, status } of results) {
        if (status === 'FINISHED') {
          setMatchResult(matchId, homeScore, awayScore);
        } else if (status === 'IN_PLAY' || status === 'PAUSED') {
          setLiveScore(matchId, homeScore, awayScore);
        }
      }
    };

    const syncR32Updates = async () => {
      // First check if there are any placeholders
      const { getAllMatches } = useStore.getState();
      const matches = getAllMatches();
      const hasPlaceholders = matches.some(m => 
        m.phase === 'r32' && (
          m.home.match(/^[123][A-L]$/) || 
          m.away.match(/^[123][A-L]$/) ||
          m.home.match(/^3[A-Z]+$/) ||
          m.away.match(/^3[A-Z]+$/)
        )
      );
      
      if (!hasPlaceholders) {
        console.log('[R32 Updates] All teams already updated, skipping');
        return;
      }

      // Check cache only if we have placeholders
      const lastUpdate = localStorage.getItem('r32-last-update');
      const lastUpdateTime = lastUpdate ? parseInt(lastUpdate, 10) : 0;
      const timeSinceUpdate = Date.now() - lastUpdateTime;
      
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

    sync(); // Run immediately on mount
    syncR32Updates(); // Also check for R32 updates immediately
    
    timerRef.current = setInterval(sync, POLL_INTERVAL_MS);
    r32TimerRef.current = setInterval(syncR32Updates, R32_UPDATE_INTERVAL_MS);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(r32TimerRef.current);
    };
  }, []); // Runs once on mount
}
