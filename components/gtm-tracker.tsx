// ============================================================================
// GTM Tracker Components - Client-side tracking for page views
// ============================================================================

'use client';

import { useEffect } from 'react';
import {
  trackContestViewed,
  trackLeaderboardViewed,
  type ContestStatus,
  type LeaderboardPlacement,
} from '@/lib/gtm';

/**
 * Track contest page view
 * Place this component in Server Component pages
 */
export function ContestViewTracker({
  contestId,
  contestStatus,
}: {
  contestId: string;
  contestStatus: ContestStatus;
}) {
  useEffect(() => {
    trackContestViewed({
      contest_id: contestId,
      contest_status: contestStatus,
    });
  }, [contestId, contestStatus]);

  return null;
}

/**
 * Track leaderboard page view
 * Place this component in Server Component pages
 */
export function LeaderboardViewTracker({
  contestId,
  totalEntries,
}: {
  contestId: string;
  totalEntries: number;
}) {
  // Determine placement category based on total entries shown
  const placement: LeaderboardPlacement =
    totalEntries <= 10 ? 'top10' : totalEntries <= 50 ? 'top50' : 'all';

  useEffect(() => {
    trackLeaderboardViewed({
      contest_id: contestId,
      placement: placement,
    });
  }, [contestId, placement]);

  return null;
}
