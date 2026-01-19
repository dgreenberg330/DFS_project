// ============================================================================
// Google Tag Manager DataLayer Utilities
// ============================================================================

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// Event types for type safety
export type GTMEvent =
  | 'lineup_builder_opened'
  | 'lineup_submitted'
  | 'lineup_abandoned'
  | 'contest_viewed'
  | 'leaderboard_viewed'
  | 'user_properties_set';

// User property types for GA4 custom dimensions
export interface UserProperties {
  contest_sequence?: number; // 1, 2, 3, etc. (how many contests user has entered)
  user_cohort?: number; // Which contest week the user first joined (1, 2, 3, etc.)
}

export type AbandonedStage = 'start' | 'midway' | 'near_end';
export type ContestStatus = 'upcoming' | 'locked' | 'resolved';
export type LeaderboardPlacement = 'top10' | 'top50' | 'all';

// Event parameter types
interface LineupBuilderOpenedParams {
  contest_id: string;
  user_id: string;
}

interface LineupSubmittedParams {
  contest_id: string;
  user_id: string;
  salary_used: number;
  num_movies: number;
}

interface LineupAbandonedParams {
  contest_id: string;
  user_id: string;
  stage_abandoned: AbandonedStage;
}

interface ContestViewedParams {
  contest_id: string;
  contest_status: ContestStatus;
}

interface LeaderboardViewedParams {
  contest_id: string;
  placement: LeaderboardPlacement;
}

/**
 * Push event to GTM dataLayer
 * Safe to call on server (no-op) or client
 */
function pushToDataLayer(data: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(data);
  }
}

/**
 * Track when user opens the lineup builder
 */
export function trackLineupBuilderOpened(params: LineupBuilderOpenedParams): void {
  pushToDataLayer({
    event: 'lineup_builder_opened',
    contest_id: params.contest_id,
    user_id: params.user_id,
  });
}

/**
 * Track when user successfully submits a lineup
 */
export function trackLineupSubmitted(params: LineupSubmittedParams): void {
  pushToDataLayer({
    event: 'lineup_submitted',
    contest_id: params.contest_id,
    user_id: params.user_id,
    salary_used: params.salary_used,
    num_movies: params.num_movies,
  });
}

/**
 * Track when user abandons lineup builder without submitting
 * - 'start': opened but didn't add any movies
 * - 'midway': added some movies but under salary cap or < 2 movies
 * - 'near_end': had valid lineup but didn't submit
 */
export function trackLineupAbandoned(params: LineupAbandonedParams): void {
  pushToDataLayer({
    event: 'lineup_abandoned',
    contest_id: params.contest_id,
    user_id: params.user_id,
    stage_abandoned: params.stage_abandoned,
  });
}

/**
 * Track when user views a contest details page
 */
export function trackContestViewed(params: ContestViewedParams): void {
  pushToDataLayer({
    event: 'contest_viewed',
    contest_id: params.contest_id,
    contest_status: params.contest_status,
  });
}

/**
 * Track when user views the leaderboard
 */
export function trackLeaderboardViewed(params: LeaderboardViewedParams): void {
  pushToDataLayer({
    event: 'leaderboard_viewed',
    contest_id: params.contest_id,
    placement: params.placement,
  });
}

/**
 * Determine abandoned stage based on lineup state
 */
export function getAbandonedStage(
  selectedCount: number,
  isValidLineup: boolean
): AbandonedStage {
  if (selectedCount === 0) {
    return 'start';
  }
  if (isValidLineup) {
    return 'near_end';
  }
  return 'midway';
}

/**
 * Set user properties for GA4 custom dimensions
 * These are user-scoped and persist across sessions in GA4
 */
export function setUserProperties(props: UserProperties): void {
  pushToDataLayer({
    event: 'user_properties_set',
    user_properties: props,
  });
}
