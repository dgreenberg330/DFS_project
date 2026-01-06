// ============================================================================
// Admin: Score Contest
// ============================================================================

import { getContest } from '@/actions/contests';
import { getContestEntryCount } from '@/actions/admin-contests';
import { ScoreContestForm } from '@/components/admin/score-contest-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ScoreContestPage({ params }: PageProps) {
  const { id: contestId } = await params;
  const contest = await getContest(contestId);
  const entryCount = await getContestEntryCount(contestId);

  // Validate contest is locked
  if (contest.status !== 'locked') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">
            Contest Not Ready for Scoring
          </h2>
          <p className="text-yellow-800">
            Contest must be locked before scoring. Current status: <strong>{contest.status}</strong>
          </p>
        </div>
      </div>
    );
  }

  // Check which movies are missing actuals
  const moviesWithoutActuals = (contest.movies || []).filter(
    (m) => m.actual_gross === null || m.actual_gross === undefined
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Score Contest: {contest.name}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Run final scoring and generate leaderboard
        </p>
      </div>

      <ScoreContestForm
        contest={contest}
        entryCount={entryCount}
        moviesWithoutActuals={moviesWithoutActuals}
      />
    </div>
  );
}
