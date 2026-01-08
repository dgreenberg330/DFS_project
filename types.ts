// ============================================================================
// Box Office Fantasy Sports - TypeScript Types
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Contest state flow: upcoming -> locked -> resolved
 */
export enum ContestStatus {
  UPCOMING = 'upcoming', // Accepting entries
  LOCKED = 'locked',     // Thursday 8PM ET, no more entries/edits
  RESOLVED = 'resolved'  // Scored, final results published
}

/**
 * Lineup state flow: editable -> locked -> scored
 */
export enum LineupStatus {
  EDITABLE = 'editable', // User can modify selections
  LOCKED = 'locked',     // Contest locked, no edits allowed
  SCORED = 'scored'      // Final scoring complete
}

// ============================================================================
// DATABASE TABLES
// ============================================================================

export interface Contest {
  id: string; // UUID

  // Contest identification
  name: string; // e.g., "Weekend of Jan 10-12, 2025"

  // Timing (stored in UTC, displayed as ET in frontend)
  lock_time: string; // ISO 8601 timestamp (Thursday 8PM ET)
  weekend_start: string; // ISO 8601 date (Friday)
  weekend_end: string; // ISO 8601 date (Sunday)

  // State
  status: ContestStatus;

  created_at: string;
  updated_at: string;
}

export interface Movie {
  id: string; // UUID
  contest_id: string; // UUID

  // Movie details
  title: string;
  release_date: string; // ISO 8601 date
  distributor: string | null;
  theater_count: number | null;

  // Pricing and projections
  salary: number; // Integer dollars (0-100), e.g., 45 = $45
  projected_gross: number; // Decimal millions, e.g., 25.5 = $25.5M

  // Actuals (null until results entered Sunday night)
  actual_gross: number | null; // Decimal millions

  created_at: string;
  updated_at: string;
}

export interface Lineup {
  id: string; // UUID

  // State and scoring
  status: LineupStatus;
  total_score: number | null; // Sum of actual_gross, null until scored

  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string; // UUID

  // Relationships
  user_id: string; // UUID, references auth.users
  contest_id: string; // UUID
  lineup_id: string; // UUID

  created_at: string;
}

export interface LineupMovie {
  lineup_id: string; // UUID
  movie_id: string; // UUID
  created_at: string;
}

// ============================================================================
// EXTENDED TYPES (with relationships)
// ============================================================================

/**
 * Lineup with selected movies populated
 */
export interface LineupWithMovies extends Lineup {
  movies: Movie[];
}

/**
 * Entry with lineup and movies populated
 */
export interface EntryWithLineup extends Entry {
  lineup: LineupWithMovies;
}

/**
 * Entry with all related data for leaderboard display
 */
export interface LeaderboardEntry extends Entry {
  lineup: LineupWithMovies;
  user: {
    id: string;
    email: string;
    username?: string; // Optional for backward compatibility
  };
  rank?: number; // Assigned after sorting by total_score
}

/**
 * Contest with movies populated
 */
export interface ContestWithMovies extends Contest {
  movies: Movie[];
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Lineup validation constraints (per MVP spec)
 */
export const LINEUP_CONSTRAINTS = {
  MIN_MOVIES: 2,
  MAX_MOVIES: 4,
  SALARY_CAP: 100,
  IDEAL_MOVIES: 3 // Optimal lineup size
} as const;

/**
 * Lineup validation result
 */
export interface LineupValidation {
  isValid: boolean;
  errors: string[];
  movieCount: number;
  totalSalary: number;
  remainingSalary: number;
}

// ============================================================================
// FORM/INPUT TYPES
// ============================================================================

/**
 * Data needed to create a new contest
 */
export interface CreateContestInput {
  name: string;
  lock_time: string; // ISO 8601 timestamp in UTC
  weekend_start: string; // ISO 8601 date
  weekend_end: string; // ISO 8601 date
}

/**
 * Data needed to create a new movie
 */
export interface CreateMovieInput {
  contest_id: string;
  title: string;
  release_date: string; // ISO 8601 date
  distributor?: string;
  theater_count?: number;
  salary: number;
  projected_gross: number;
}

/**
 * Data needed to submit a lineup
 */
export interface SubmitLineupInput {
  contest_id: string;
  movie_ids: string[]; // Array of 2-4 movie UUIDs
}

/**
 * Data needed to update actual grosses (Sunday night admin task)
 */
export interface UpdateActualsInput {
  movie_id: string;
  actual_gross: number; // Millions
}

// ============================================================================
// SCORING TYPES
// ============================================================================

/**
 * Result of scoring a single lineup
 */
export interface ScoredLineup {
  lineup_id: string;
  entry_id: string;
  user_id: string;
  total_score: number; // Sum of actual_gross for all movies in lineup
  rank: number; // Position on leaderboard (1 = winner)
}

/**
 * Contest scoring results
 */
export interface ContestScoringResult {
  contest_id: string;
  scored_lineups: ScoredLineup[];
  scored_at: string; // ISO 8601 timestamp
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

/**
 * Admin user record
 */
export interface AdminUser {
  id: string;
  user_id: string;
  created_at: string;
}

/**
 * User profile (extended data beyond auth.users)
 */
export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

/**
 * Username validation constraints
 */
export const USERNAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  PATTERN: /^[a-zA-Z0-9_]+$/,
  PATTERN_DESCRIPTION: 'letters, numbers, and underscores only'
} as const;

/**
 * Data needed to update a movie (admin action)
 */
export interface UpdateMovieInput {
  title?: string;
  release_date?: string;
  distributor?: string | null;
  theater_count?: number | null;
  salary?: number;
  projected_gross?: number;
}

/**
 * Batch actuals input (Sunday workflow)
 */
export interface BatchActualsInput {
  movieId: string;
  actualGross: number;
}

// ============================================================================
// DESIGN NOTES
// ============================================================================
/*
 * Key assumptions and design choices:
 *
 * 1. All dates/times are ISO 8601 strings in TypeScript.
 *    Database stores timestamptz in UTC, frontend converts to ET.
 *
 * 2. Money representation:
 *    - salary: number (integer, 5-100)
 *    - projected_gross, actual_gross, total_score: number (decimal)
 *    All monetary values in these types use numbers, not strings.
 *
 * 3. UUIDs represented as strings in TypeScript.
 *
 * 4. Null vs undefined: Using null for database nullable fields
 *    (matches PostgreSQL NULL), undefined for optional input fields.
 *
 * 5. Extended types (WithMovies, etc.) represent joined query results.
 *    Use these for API responses, not database writes.
 *
 * 6. Validation types separate from database types to keep concerns clear.
 *
 * 7. Enums use string values matching database ENUM types exactly.
 */