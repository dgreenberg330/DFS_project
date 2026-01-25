// ============================================================================
// Score Contest Form - Admin Component
// ============================================================================

'use client';

import { useState } from 'react';
import { scoreContest } from '@/actions/scoring';
import { sendContestResultsEmails } from '@/actions/emails';
import { Contest, Movie, ScoredLineup } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ScoreContestFormProps {
  contest: Contest;
  entryCount: number;
  moviesWithoutActuals: Movie[];
}

export function ScoreContestForm({ contest, entryCount, moviesWithoutActuals }: ScoreContestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoredLineup[] | null>(null);
  const [emailStatus, setEmailStatus] = useState<{
    sending: boolean;
    sent?: number;
    failed?: number;
    error?: string;
  }>({ sending: false });

  const canScore = moviesWithoutActuals.length === 0 && entryCount > 0;

  async function handleSendEmails() {
    setEmailStatus({ sending: true });
    try {
      const result = await sendContestResultsEmails(contest.id);
      setEmailStatus({
        sending: false,
        sent: result.sent,
        failed: result.failed,
      });
    } catch (err: unknown) {
      setEmailStatus({
        sending: false,
        error: err instanceof Error ? err.message : 'Failed to send emails',
      });
    }
  }

  async function handleScore() {
    if (!canScore) return;

    const confirmed = confirm(
      `Score contest and mark as resolved?\n\nThis will:\n- Calculate scores for ${entryCount} entries\n- Mark contest as resolved\n- Publish final leaderboard\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const results = await scoreContest(contest.id);
      setLeaderboard(results);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to score contest');
    } finally {
      setLoading(false);
    }
  }

  // If scoring is complete, show leaderboard preview
  if (leaderboard) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-2">
            Contest Scored Successfully!
          </h2>
          <p className="text-green-800 mb-4">
            {leaderboard.length} entries have been scored and the contest has been marked as resolved.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/contests/${contest.id}/leaderboard`}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              View Full Leaderboard →
            </Link>
          </div>
        </div>

        {/* Email Results Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Send Results Emails</h3>
          <p className="text-sm text-gray-600 mb-4">
            Notify participants of their final scores and rankings.
          </p>

          {emailStatus.sent !== undefined ? (
            <div className={`p-4 rounded-lg ${emailStatus.failed && emailStatus.failed > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
              <p className={`font-medium ${emailStatus.failed && emailStatus.failed > 0 ? 'text-yellow-900' : 'text-green-900'}`}>
                {emailStatus.sent} email{emailStatus.sent !== 1 ? 's' : ''} sent successfully
                {emailStatus.failed && emailStatus.failed > 0 && `, ${emailStatus.failed} failed`}
              </p>
            </div>
          ) : emailStatus.error ? (
            <div className="p-4 rounded-lg bg-red-50">
              <p className="text-red-800">{emailStatus.error}</p>
            </div>
          ) : (
            <button
              onClick={handleSendEmails}
              disabled={emailStatus.sending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {emailStatus.sending ? 'Sending Emails...' : 'Send Results Emails'}
            </button>
          )}
        </div>

        {/* Leaderboard Preview */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Top 10 Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboard.slice(0, 10).map((entry) => (
                  <tr key={entry.entry_id} className={entry.rank === 1 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      #{entry.rank}
                      {entry.rank === 1 && ' 🏆'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {entry.user_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${entry.total_score.toFixed(2)}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contest Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Contest Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Contest Name:</span>
            <span className="font-medium text-gray-900">{contest.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="font-medium text-yellow-600 capitalize">{contest.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Entries:</span>
            <span className="font-medium text-gray-900">{entryCount}</span>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {entryCount === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">No entries to score</p>
          <p className="text-yellow-700 text-sm mt-1">
            This contest has no participant entries yet.
          </p>
        </div>
      )}

      {moviesWithoutActuals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium mb-2">
            Cannot score: {moviesWithoutActuals.length} movie(s) missing box office results
          </p>
          <ul className="text-red-700 text-sm space-y-1">
            {moviesWithoutActuals.map((movie) => (
              <li key={movie.id}>• {movie.title}</li>
            ))}
          </ul>
          <Link
            href={`/admin/contests/${contest.id}/actuals`}
            className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Enter Actuals First
          </Link>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Score Button */}
      {canScore && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Ready to Score</h3>
          <p className="text-blue-800 text-sm mb-4">
            All movies have actuals entered. Clicking the button below will calculate scores for all {entryCount} entries and mark the contest as resolved.
          </p>
          <button
            onClick={handleScore}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Scoring Contest...' : `Score Contest (${entryCount} Entries)`}
          </button>
        </div>
      )}
    </div>
  );
}
