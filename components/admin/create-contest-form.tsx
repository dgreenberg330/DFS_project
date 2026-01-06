// ============================================================================
// Create Contest Form - Admin Component
// ============================================================================

'use client';

import { useState } from 'react';
import { createContest } from '@/actions/contests';
import { useRouter } from 'next/navigation';

export function CreateContestForm() {
  const router = useRouter();
  const [weekendStart, setWeekendStart] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contestId, setContestId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!weekendStart) {
        throw new Error('Please select the Friday date for the opening weekend.');
      }

      const friday = new Date(weekendStart + 'T00:00:00');

      // Calculate Thursday before Friday at 8PM ET
      // Thursday 8PM ET = Friday 1AM UTC (EST) or Friday 12AM UTC (EDT)
      // For consistency, we'll use EST offset (UTC-5) = add 5 hours to get UTC
      const thursday = new Date(friday);
      thursday.setDate(friday.getDate() - 1);

      // Create Thursday 8PM ET as UTC time
      // Parse the date in ET timezone and convert to UTC
      const thursdayDateStr = thursday.toISOString().split('T')[0]; // YYYY-MM-DD
      const lockTimeET = new Date(`${thursdayDateStr}T20:00:00-05:00`); // 8PM EST
      const lockTimeUTC = lockTimeET;

      // Calculate Sunday (2 days after Friday)
      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);

      // Generate contest name
      const contestName = `Weekend of ${friday.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} - ${sunday.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;

      // Create contest
      const contest = await createContest({
        name: contestName,
        lock_time: lockTimeUTC.toISOString(),
        weekend_start: friday.toISOString().split('T')[0],
        weekend_end: sunday.toISOString().split('T')[0],
      });

      setContestId(contest.id);
      // Redirect to movies page after short delay
      setTimeout(() => {
        router.push(`/admin/contests/${contest.id}/movies`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create contest');
    } finally {
      setLoading(false);
    }
  }

  if (contestId) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-green-900 mb-4">
          Contest Created Successfully!
        </h2>
        <p className="text-sm text-green-800 mb-4">
          Redirecting to add movies...
        </p>
        <div className="flex gap-2">
          <a
            href={`/admin/contests/${contestId}/movies`}
            className="inline-block px-4 py-2 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700"
          >
            Add Movies Now →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="weekend-start"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Opening Weekend Friday
          </label>
          <input
            type="date"
            id="weekend-start"
            value={weekendStart}
            onChange={(e) => setWeekendStart(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Select the Friday that starts the opening weekend
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">
            Auto-Calculated Details:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Lock Time: Thursday 8:00 PM ET (before selected Friday)</li>
            <li>• Weekend: Friday - Sunday</li>
            <li>• Contest Name: Auto-generated from dates</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading || !weekendStart}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Contest...' : 'Create Contest'}
        </button>
      </form>
    </div>
  );
}
