// ============================================================================
// Admin Dashboard
// ============================================================================

import { getAllContests } from '@/actions/admin-contests';
import Link from 'next/link';

export default async function AdminDashboard() {
  const contests = await getAllContests();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage contests and box office data</p>
      </div>

      <div className="mb-6">
        <Link
          href="/admin/contests/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Create New Contest
        </Link>
      </div>

      {/* Contest List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">All Contests</h2>
        </div>

        {contests.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No contests yet. Create your first contest to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {contests.map((contest) => (
              <div key={contest.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{contest.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Status:{' '}
                      <span
                        className={`capitalize font-medium ${
                          contest.status === 'upcoming'
                            ? 'text-blue-600'
                            : contest.status === 'locked'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {contest.status}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Lock: {new Date(contest.lock_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/contests/${contest.id}/movies`}
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      Movies
                    </Link>
                    {contest.status === 'locked' && (
                      <>
                        <Link
                          href={`/admin/contests/${contest.id}/actuals`}
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          Actuals
                        </Link>
                        <Link
                          href={`/admin/contests/${contest.id}/score`}
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          Score
                        </Link>
                      </>
                    )}
                    {contest.status === 'resolved' && (
                      <Link
                        href={`/contests/${contest.id}/leaderboard`}
                        className="text-sm text-green-600 hover:underline font-medium"
                      >
                        Leaderboard
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
