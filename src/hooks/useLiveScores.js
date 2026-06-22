import { useEffect, useRef } from 'react';
import useStore from '../store';
import { isMatchToday } from '../utils/scoring';
import { fetchTodayScores, isFootballDataConfigured } from '../lib/footballData';

// 90 seconds: safe for free tier (10 req/min) with up to ~8 concurrent users
const POLL_INTERVAL_MS = 90 * 1000;

export function useLiveScores() {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isFootballDataConfigured) return;

    const sync = async () => {
      // Access store directly to always get fresh state without stale closures
      const { getAllMatches, setMatchResult, setLiveScore } = useStore.getState();
      const allMatches = getAllMatches();
      const todayMatches = allMatches.filter(m => isMatchToday(m));

      // Skip polling if no matches today
      if (todayMatches.length === 0) return;

      const results = await fetchTodayScores(todayMatches);

      for (const { matchId, homeScore, awayScore, status } of results) {
        if (status === 'FINISHED') {
          setMatchResult(matchId, homeScore, awayScore);
        } else if (status === 'IN_PLAY' || status === 'PAUSED') {
          setLiveScore(matchId, homeScore, awayScore);
        }
      }
    };

    sync(); // Run immediately on mount
    timerRef.current = setInterval(sync, POLL_INTERVAL_MS);

    return () => clearInterval(timerRef.current);
  }, []); // Runs once on mount
}
