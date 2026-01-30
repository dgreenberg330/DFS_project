// ============================================================================
// Lineup Builder Page
// ============================================================================

import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getContest } from '@/actions/contests';
import { getUserEntry } from '@/actions/lineups';
import { LineupBuilder } from '@/components/lineup-builder';
import { Header } from '@/components/header';
import type { Movie } from '@/types';

// Type for lineup movie with nested movie data from Supabase joins
interface LineupMovieData {
  movie: Movie | Movie[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LineupPage({ params }: PageProps) {
  const { id: contestId } = await params;

  // Require authentication
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // Get contest with movies
  const contest = await getContest(contestId);

  // Defensive check: ensure contest has movies
  if (!contest.movies || !Array.isArray(contest.movies)) {
    throw new Error('Contest movies could not be loaded. Please try again.');
  }

  if (contest.movies.length === 0) {
    throw new Error('This contest has no movies available. Please contact support.');
  }

  // Check if user has existing entry
  const existingEntry = await getUserEntry(contestId);

  // Extract existing movie IDs if entry exists
  const existingMovieIds = existingEntry
    ? (() => {
        // Defensive check: ensure lineup exists
        if (!existingEntry.lineup) {
          return [];
        }

        const lineup = Array.isArray(existingEntry.lineup)
          ? existingEntry.lineup[0]
          : existingEntry.lineup;

        // Defensive check: ensure lineup is valid
        if (!lineup || !lineup.movies) {
          return [];
        }

        const movies = lineup.movies || [];
        return movies.map((lm: LineupMovieData) => {
          const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
          // Defensive check: ensure movie has id
          return movie?.id;
        }).filter(Boolean); // Remove any undefined/null IDs
      })()
    : [];

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Contest Info */}
        <div className="mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-100">{contest.name}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Locks: {new Date(contest.lock_time).toLocaleString('en-US', {
              timeZone: 'America/New_York',
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short',
            })}
          </p>
        </div>

        {/* Lineup Builder Component */}
        <LineupBuilder
          contest={contest}
          movies={contest.movies}
          existingMovieIds={existingMovieIds}
          isLocked={contest.status !== 'upcoming'}
          userId={user.id}
        />
      </div>
    </div>
  );
}
