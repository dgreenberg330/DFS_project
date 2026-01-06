// ============================================================================
// Create Contest Form - Client Component
// ============================================================================

'use client';

import { useState } from 'react';
import { createContest } from '@/actions/contests';
import { batchCreateMovies } from '@/actions/movies';
import { useRouter } from 'next/navigation';

export function CreateContestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contestId, setContestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateContest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Calculate lock time: Next Thursday 8PM ET
      const now = new Date();

      // Get next Thursday
      const daysUntilThursday = (4 - now.getDay() + 7) % 7 || 7;
      const nextThursday = new Date(now);
      nextThursday.setDate(now.getDate() + daysUntilThursday);
      nextThursday.setHours(20, 0, 0, 0); // 8PM local time

      // Convert to ET by creating a date string in America/New_York timezone
      // For simplicity, we'll set to 8PM and assume EST (UTC-5)
      // Thursday 8PM EST = Friday 1AM UTC
      const thursday8pmET = new Date(nextThursday);
      thursday8pmET.setUTCHours(20 + 5, 0, 0, 0); // 8PM + 5 hours = 1AM next day UTC

      // Weekend dates (Friday-Sunday after Thursday lock)
      const friday = new Date(nextThursday);
      friday.setDate(nextThursday.getDate() + 1); // Day after Thursday
      friday.setHours(0, 0, 0, 0);
      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);

      // Create contest
      const contest = await createContest({
        name: `Weekend of ${friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        lock_time: thursday8pmET.toISOString(),
        weekend_start: friday.toISOString().split('T')[0],
        weekend_end: sunday.toISOString().split('T')[0],
      });

      // Create sample movies
      const sampleMovies = [
        {
          contest_id: contest.id,
          title: 'Big Budget Blockbuster',
          release_date: friday.toISOString().split('T')[0],
          distributor: 'Major Studio',
          theater_count: 4200,
          salary: 48,
          projected_gross: 35.0,
        },
        {
          contest_id: contest.id,
          title: 'Action Sequel',
          release_date: friday.toISOString().split('T')[0],
          distributor: 'Major Studio',
          theater_count: 3800,
          salary: 40,
          projected_gross: 28.5,
        },
        {
          contest_id: contest.id,
          title: 'Family Comedy',
          release_date: friday.toISOString().split('T')[0],
          distributor: 'Mid-Size Studio',
          theater_count: 3200,
          salary: 32,
          projected_gross: 20.0,
        },
        {
          contest_id: contest.id,
          title: 'Romantic Drama',
          release_date: friday.toISOString().split('T')[0],
          distributor: 'Indie Studio',
          theater_count: 2500,
          salary: 24,
          projected_gross: 15.5,
        },
        {
          contest_id: contest.id,
          title: 'Horror Thriller',
          release_date: friday.toISOString().split('T')[0],
          distributor: 'Small Studio',
          theater_count: 2000,
          salary: 18,
          projected_gross: 10.2,
        },
        {
          contest_id: contest.id,
          title: 'Limited Release Drama',
          release_date: friday.toISOString().split('T')[0],
          distributor: 'Art House Films',
          theater_count: 800,
          salary: 8,
          projected_gross: 3.5,
        },
        {
          contest_id: contest.id,
          title: 'Carryover Hit (Week 2)',
          release_date: new Date(friday.getTime() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          distributor: 'Major Studio',
          theater_count: 3900,
          salary: 35,
          projected_gross: 22.0,
        },
      ];

      await batchCreateMovies(sampleMovies);

      setContestId(contest.id);
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
        <div className="space-y-3">
          <p className="text-sm text-green-800">
            Contest ID: <code className="bg-green-100 px-2 py-1 rounded">{contestId}</code>
          </p>
          <div className="flex flex-col gap-2">
            <a
              href={`/contests/${contestId}/lineup`}
              className="inline-block px-4 py-2 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700"
            >
              Build Lineup →
            </a>
            <button
              onClick={() => {
                setContestId(null);
                setError(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300"
            >
              Create Another Contest
            </button>
          </div>
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

      <form onSubmit={handleCreateContest}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will create a test contest with 7 sample movies for the upcoming weekend.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Contest Details:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Lock Time: Thursday 8:00 PM ET</li>
              <li>• Weekend: Friday-Sunday after lock</li>
              <li>• 7 Movies with salaries $8-$48</li>
              <li>• Includes 1 carryover movie</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Contest...' : 'Create Test Contest'}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-900 mb-2">Sample Movies:</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Big Budget Blockbuster</span>
            <span>$48 (35.0M proj)</span>
          </div>
          <div className="flex justify-between">
            <span>Action Sequel</span>
            <span>$40 (28.5M proj)</span>
          </div>
          <div className="flex justify-between">
            <span>Family Comedy</span>
            <span>$32 (20.0M proj)</span>
          </div>
          <div className="flex justify-between">
            <span>Carryover Hit (Week 2)</span>
            <span>$35 (22.0M proj)</span>
          </div>
          <div className="flex justify-between">
            <span>+ 3 more movies</span>
            <span>$8-$24</span>
          </div>
        </div>
      </div>
    </div>
  );
}
